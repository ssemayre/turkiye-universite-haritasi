require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ==========================================
// AYARLAR
// ==========================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("\x1b[31mHATA: SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik (.env.local).\x1b[0m");
  process.exit(1);
}

if (!GOOGLE_API_KEY) {
  console.warn("\x1b[33mUYARI: GOOGLE_MAPS_API_KEY bulunamadı. Koordinat araması yapılamayacak.\x1b[0m");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Gecikme fonksiyonu (Rate limit önlemi)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeName = (s) => (s || '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9ğüşıöç]/gi, '').trim();

// ==========================================
// KATI GOOGLE GEOCODING KONTROLÜ
// ==========================================
const queryGoogleGeocode = (address) => {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_API_KEY) return resolve(null);

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_API_KEY}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'OK' && parsed.results && parsed.results.length > 0) {
            resolve(parsed.results[0]);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

/**
 * ÇOK KATI KOORDİNAT FİLTRESİ
 * Sadece 'establishment', 'point_of_interest', 'university', 'school'
 * seviyesindeki gerçek kurum/bina sonuçlarını kabul eder.
 * 'locality' (Şehir merkezi) veya 'administrative_area' sonuçlarını KESİNLİKLE reddeder.
 */
function validateStrictEstablishment(result) {
  if (!result || !result.types || !result.geometry || !result.geometry.location) {
    return { valid: false, reason: "Sonuç veya koordinat objesi yok" };
  }

  const types = result.types;

  // Reddedilecek genel coğrafi türler
  const forbiddenGeneralTypes = [
    'locality',
    'political',
    'administrative_area_level_1',
    'administrative_area_level_2',
    'administrative_area_level_3',
    'country',
    'postal_code'
  ];

  // Eğer ilk tür (birincil tip) bir şehir veya ilçe ise kesinlikle reddet
  if (forbiddenGeneralTypes.includes(types[0])) {
    return { valid: false, reason: `Genel bölge/şehir merkezi tipi (${types[0]}) tespit edildi, reddedildi` };
  }

  // Kabul edilen nokta atışı kurum/bina türleri
  const acceptedPoiTypes = [
    'establishment',
    'point_of_interest',
    'university',
    'school'
  ];

  const hasPoiType = types.some(t => acceptedPoiTypes.includes(t));

  if (!hasPoiType) {
    return { valid: false, reason: `Kurum/bina tipi içermiyor. Tipler: [${types.join(', ')}]` };
  }

  return { 
    valid: true, 
    location: result.geometry.location, 
    types: types 
  };
}

const determineType = (uniName) => {
  const name = (uniName || '').toUpperCase();
  if (name.includes('VAKIF')) return 'Vakıf';
  if (name.includes('KIBRIS') || name.includes('LEFKE') || name.includes('GİRNE') || name.includes('DOĞU AKDENİZ') || name.includes('YAKIN DOĞU') || name.includes('KARPAZ')) return 'Kıbrıs';
  return 'Devlet';
};

// ==========================================
// 1. AŞAMA: ANA ÜNİVERSİTELER VE MERKEZ KAMPÜS SEED
// ==========================================
async function seedUniversities() {
  console.log("================================================================================");
  console.log("🚀 AŞAMA 1: Ana Üniversiteler ve Merkez Kampüsler (Katı Geocoding Modu)");
  console.log("================================================================================\n");

  // 1. Şehir ve Doğrulanmış Veri Sözlüğünü Yükle
  const uniJsonPath = path.join(__dirname, '../src/data/universities.json');
  const uniLookupMap = new Map();
  if (fs.existsSync(uniJsonPath)) {
    const uniJsonData = JSON.parse(fs.readFileSync(uniJsonPath, 'utf8'));
    uniJsonData.forEach(u => {
      if (u.name) uniLookupMap.set(normalizeName(u.name), u);
    });
    console.log(`ℹ️  ${uniLookupMap.size} üniversitenin şehir eşleştirme rehberi yüklendi.`);
  }

  // 2. campuses.json'dan Ana Üniversite Listesini Al
  const campusesFilePath = path.join(__dirname, '../src/data/campuses.json');
  if (!fs.existsSync(campusesFilePath)) {
    console.error("\x1b[31mHATA: campuses.json dosyası bulunamadı!\x1b[0m");
    process.exit(1);
  }

  const rawData = fs.readFileSync(campusesFilePath, 'utf8');
  const uniDict = JSON.parse(rawData);
  const uniList = Object.values(uniDict);

  console.log(`📋 Toplam işlenecek ana üniversite sayısı: ${uniList.length}\n`);

  let totalUniversities = uniList.length;
  let exactCoordinatesFound = 0;
  let rejectedCoordinates = 0;

  for (let i = 0; i < uniList.length; i++) {
    const uni = uniList[i];
    const uniName = uni.originalUniName || uni.universityName;
    const uniType = determineType(uniName);
    const isCyprus = uniType === 'Kıbrıs';

    // Gerçek Şehri Tespit Et
    const matched = uniLookupMap.get(normalizeName(uniName)) || uniLookupMap.get(normalizeName(uni.universityName));
    let realCity = matched?.city;
    if (!realCity && uni.city && !uni.city.includes('ÜNİVERSİTESİ')) {
      realCity = uni.city;
    }
    if (!realCity && isCyprus) {
      realCity = 'KKTC';
    }

    console.log(`🏢 [${i + 1}/${totalUniversities}] ${uniName} (${uniType}) - Şehir: ${realCity || 'Belirtilmemiş'}`);

    // 1A. institutions Tablosuna Ekle
    const { data: instData, error: instError } = await supabase
      .from('institutions')
      .insert({
        name: uniName,
        type: uniType,
        city: realCity || null
      })
      .select('id')
      .single();

    if (instError) {
      console.error(`   \x1b[31m❌ Üniversite institutions tablosuna eklenemedi: ${instError.message}\x1b[0m`);
      continue;
    }

    const institutionId = instData.id;

    // 1B. Merkez Kampüs için Katı Google Geocoding Sorgusu
    const country = isCyprus ? 'KKTC' : 'Türkiye';
    const geocodeQuery = `${uniName} Merkez Kampüsü ${realCity || ''} ${country}`.replace(/\s+/g, ' ').trim();

    let preciseLocation = null;

    try {
      const geoResult = await queryGoogleGeocode(geocodeQuery);
      const validation = validateStrictEstablishment(geoResult);

      if (validation.valid) {
        preciseLocation = validation.location;
        exactCoordinatesFound++;
        console.log(`   \x1b[32m✅ [NOKTA ATIŞI BULUNDU] Merkez Kampüs -> (${preciseLocation.lat}, ${preciseLocation.lng}) [${validation.types.slice(0, 3).join(', ')}]\x1b[0m`);
      } else {
        rejectedCoordinates++;
        console.log(`   \x1b[31m❌ [KOORDİNAT REDDEDİLDİ / BULUNAMADI] Merkez Kampüs -> ${validation.reason}\x1b[0m`);
      }

      await sleep(350); // Rate limit koruması
    } catch (err) {
      rejectedCoordinates++;
      console.log(`   \x1b[31m❌ [API HATASI] Merkez Kampüs -> ${err.message}\x1b[0m`);
    }

    // 1C. campuses Tablosuna 'Merkez Kampüs' Kaydı Aç
    // Fallback uygulanmaz: Nokta atışı bulunamazsa lat/lng NULL olarak kaydedilir (daha sonra manuel girilmek üzere).
    const campusAddress = realCity ? `Merkez Kampüs, ${realCity}` : 'Merkez Kampüs';

    const { error: campusError } = await supabase
      .from('campuses')
      .insert({
        institution_id: institutionId,
        name: 'Merkez Kampüs',
        address: campusAddress,
        lat: preciseLocation ? preciseLocation.lat : null,
        lng: preciseLocation ? preciseLocation.lng : null
      });

    if (campusError) {
      console.error(`   \x1b[31m❌ Kampüs campuses tablosuna eklenemedi: ${campusError.message}\x1b[0m`);
    }
  }

  // ==========================================
  // ÖZET RAPOR
  // ==========================================
  console.log("\n================================================================================");
  console.log("📊 AŞAMA 1 TAMAMLANDI - ÖZET RAPOR");
  console.log("================================================================================");
  console.log(`🏛️  İşlenen Toplam Üniversite: ${totalUniversities}`);
  console.log(`🎯 Nokta Atışı Koordinat Bulunan: ${exactCoordinatesFound}`);
  console.log(`❌ Koordinatı Reddedilen / Boş Kalan: ${rejectedCoordinates}`);
  console.log("ℹ️  Koordinatı boş kalan üniversiteler lat: NULL olarak campuses tablosunda bekliyor.");
  console.log("================================================================================\n");
}

seedUniversities();
