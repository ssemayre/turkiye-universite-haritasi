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

// TEST MODU: Tüm veriyi aktarmak için null bırakın.
// Hızlı test yapmak isterseniz sayı belirtebilirsiniz (örn: 10).
const LIMIT_SUBCAMPUSES = null;

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
// GOOGLE GEOCODING ÇAĞRISI
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
 * 'locality' (Şehir/İlçe merkezi) veya 'administrative_area' sonuçlarını KESİNLİKLE reddeder.
 */
function validateStrictEstablishment(result) {
  if (!result || !result.types || !result.geometry || !result.geometry.location) {
    return { valid: false, reason: "Google sonuç bulamadı (ZERO_RESULTS)" };
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

  // Birincil tip şehir/ilçe/bölge ise reddet
  if (forbiddenGeneralTypes.includes(types[0])) {
    return { valid: false, reason: `Genel ilçe/şehir merkezi (${types[0]}) tespit edildi, reddedildi` };
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

// ==========================================
// 2. AŞAMA: MYO'LAR VE ALT YERLEŞKELER SEED
// ==========================================
async function seedSubcampuses() {
  console.log("================================================================================");
  console.log("🚀 AŞAMA 2: MYO'lar ve Alt Yerleşkeler (Katı Geocoding & Fallback-Yok Modu)");
  console.log("================================================================================\n");

  // 1. institutions Tablosundaki Üniversiteleri Çek
  console.log("📡 institutions tablosundan üniversiteler yükleniyor...");
  const { data: dbInstitutions, error: instFetchError } = await supabase
    .from('institutions')
    .select('id, name, city, type');

  if (instFetchError || !dbInstitutions || dbInstitutions.length === 0) {
    console.error("\x1b[31mHATA: institutions tablosundan veri çekilemedi. Önce Aşama 1'i (01_seed_universities.cjs) çalıştırdığınızdan emin olun!\x1b[0m");
    process.exit(1);
  }

  const instMap = new Map();
  dbInstitutions.forEach(inst => {
    instMap.set(normalizeName(inst.name), inst);
  });
  console.log(`ℹ️  ${dbInstitutions.length} ana üniversite institutions tablosundan eşleştirildi.\n`);

  // 2. campuses.json Dosyasını Oku
  const campusesFilePath = path.join(__dirname, '../src/data/campuses.json');
  if (!fs.existsSync(campusesFilePath)) {
    console.error("\x1b[31mHATA: campuses.json dosyası bulunamadı!\x1b[0m");
    process.exit(1);
  }

  const rawData = fs.readFileSync(campusesFilePath, 'utf8');
  const uniDict = JSON.parse(rawData);
  const uniList = Object.values(uniDict);

  // Sadece Merkez Kampüs Olmayan Alt Yerleşkeleri / MYO'ları Filtrele
  const subcampusesToProcess = [];

  for (const uni of uniList) {
    const uniName = uni.originalUniName || uni.universityName;
    const parentInst = instMap.get(normalizeName(uniName)) || instMap.get(normalizeName(uni.universityName));

    if (!parentInst) {
      console.warn(`\x1b[33mUYARI: "${uniName}" veritabanındaki institutions tablosunda bulunamadı, yerleşkeleri atlandı.\x1b[0m`);
      continue;
    }

    if (uni.campuses && Array.isArray(uni.campuses)) {
      for (const campus of uni.campuses) {
        const isMain = campus.isMain || (campus.name && campus.name.toLowerCase().trim() === 'merkez kampüs');
        if (!isMain) {
          subcampusesToProcess.push({
            parentInst: parentInst,
            campusName: campus.name,
            originalCity: uni.city
          });
        }
      }
    }
  }

  const totalToProcess = LIMIT_SUBCAMPUSES ? Math.min(LIMIT_SUBCAMPUSES, subcampusesToProcess.length) : subcampusesToProcess.length;
  console.log(`📋 Toplam işlenecek MYO / Alt Yerleşke sayısı: ${totalToProcess}\n`);

  let exactFound = 0;
  let rejectedCount = 0;

  for (let i = 0; i < totalToProcess; i++) {
    const item = subcampusesToProcess[i];
    const parentInst = item.parentInst;
    const campusName = item.campusName;
    const isCyprus = parentInst.type === 'Kıbrıs';

    // Şehir bilgisini al (Önce parent institution'dan, yoksa 'KKTC' veya boşluk)
    const city = parentInst.city || (isCyprus ? 'KKTC' : '');
    const country = isCyprus ? 'KKTC' : 'Türkiye';

    // Kural: '[MYO Adı] [Şehir] Türkiye' formatında nokta atışı sorgu
    const geocodeQuery = `${campusName} ${city} ${country}`.replace(/\s+/g, ' ').trim();

    console.log(`📍 [${i + 1}/${totalToProcess}] ${campusName} (Bağlı Kurum: ${parentInst.name} | İl: ${city || 'Belirsiz'})`);

    let preciseLocation = null;

    try {
      const geoResult = await queryGoogleGeocode(geocodeQuery);
      const validation = validateStrictEstablishment(geoResult);

      if (validation.valid) {
        preciseLocation = validation.location;
        exactFound++;
        console.log(`   \x1b[32m✅ [NOKTA ATIŞI BULUNDU] -> (${preciseLocation.lat}, ${preciseLocation.lng}) [${validation.types.slice(0, 3).join(', ')}]\x1b[0m`);
      } else {
        rejectedCount++;
        console.log(`   \x1b[33m⚠️  [KOORDİNAT REDDEDİLDİ / NULL BIRAKILDI] -> ${validation.reason}\x1b[0m`);
      }

      await sleep(350); // Rate limit koruması
    } catch (err) {
      rejectedCount++;
      console.log(`   \x1b[33m⚠️  [API HATASI / NULL BIRAKILDI] -> ${err.message}\x1b[0m`);
    }

    // campuses tablosuna ekle
    // Kural: Kesinlikle ana kampüs koordinatı devralınmaz. Bulunamadıysa lat: null, lng: null.
    const campusAddress = city ? `${campusName}, ${city}` : campusName;

    const { error: campusError } = await supabase
      .from('campuses')
      .insert({
        institution_id: parentInst.id,
        name: campusName,
        address: campusAddress,
        lat: preciseLocation ? preciseLocation.lat : null,
        lng: preciseLocation ? preciseLocation.lng : null
      });

    if (campusError) {
      console.error(`   \x1b[31m❌ campuses tablosuna eklenirken hata: ${campusError.message}\x1b[0m`);
    }
  }

  // ==========================================
  // ÖZET RAPOR
  // ==========================================
  console.log("\n================================================================================");
  console.log("📊 AŞAMA 2 TAMAMLANDI - ÖZET RAPOR");
  console.log("================================================================================");
  console.log(`🏫 İşlenen Toplam MYO / Alt Yerleşke: ${totalToProcess}`);
  console.log(`🎯 Nokta Atışı Koordinat Bulunan: ${exactFound}`);
  console.log(`⚠️  Koordinatı Reddedilen / NULL Bırakılan: ${rejectedCount}`);
  console.log("ℹ️  İğnelerin üst üste binmemesi için bulunamayanların koordinatları NULL bırakıldı.");
  console.log("================================================================================\n");
}

seedSubcampuses();
