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
const LIMIT_DORMS = null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("\x1b[31mHATA: SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik (.env.local).\x1b[0m");
  process.exit(1);
}

if (!GOOGLE_API_KEY) {
  console.warn("\x1b[33mUYARI: GOOGLE_MAPS_API_KEY bulunamadı. JSON'da koordinatı olmayan yurtlar için arama yapılamayacak.\x1b[0m");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Gecikme fonksiyonu (Rate limit önlemi)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
 * Sadece 'establishment', 'point_of_interest' seviyesindeki gerçek kurum/bina sonuçlarını kabul eder.
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
    'school',
    'university'
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
// 3. AŞAMA: KYK YURTLARI SEED
// ==========================================
async function seedDorms() {
  console.log("================================================================================");
  console.log("🚀 AŞAMA 3: KYK Yurtları (JSON Öncelikli, Katı Geocoding & Fallback-Yok Modu)");
  console.log("================================================================================\n");

  // 1. kyk-yurtlari.json Dosyasını Oku
  const kykFilePath = path.join(__dirname, '../src/data/kyk-yurtlari.json');
  if (!fs.existsSync(kykFilePath)) {
    console.error("\x1b[31mHATA: kyk-yurtlari.json dosyası bulunamadı!\x1b[0m");
    process.exit(1);
  }

  const rawData = fs.readFileSync(kykFilePath, 'utf8');
  const dormList = JSON.parse(rawData);

  const totalDorms = LIMIT_DORMS ? Math.min(LIMIT_DORMS, dormList.length) : dormList.length;
  console.log(`📋 Toplam işlenecek KYK yurdu sayısı: ${totalDorms}\n`);

  let fromJsonCount = 0;
  let fromGeocodeCount = 0;
  let nullCoordsCount = 0;

  for (let i = 0; i < totalDorms; i++) {
    const dorm = dormList[i];
    const dormName = dorm.name || 'KYK Yurdu';

    // Cinsiyet doğrulaması ('Kız', 'Erkek', 'Karma')
    let gender = 'Karma';
    if (dorm.gender === 'Kız' || dorm.gender === 'Erkek' || dorm.gender === 'Karma') {
      gender = dorm.gender;
    }

    const cityClean = (dorm.city && dorm.city !== 'Türkiye') ? dorm.city : (dorm.district || '');
    console.log(`🏠 [${i + 1}/${totalDorms}] ${dormName} (${gender} - ${cityClean || 'Belirtilmemiş'})`);

    let finalLat = null;
    let finalLng = null;

    // 1. ÖNCELİK: JSON Verisinde Koordinat Var Mı?
    const rawLat = dorm.coordinates?.lat || dorm.lat;
    const rawLng = dorm.coordinates?.lng || dorm.lng;

    if (rawLat && rawLng && !isNaN(Number(rawLat)) && !isNaN(Number(rawLng)) && Number(rawLat) !== 0 && Number(rawLng) !== 0) {
      finalLat = Number(rawLat);
      finalLng = Number(rawLng);
      fromJsonCount++;
      console.log(`   ⚡ [JSON KOORDİNATI KULLANILDI] -> (${finalLat}, ${finalLng})`);
    } else {
      // 2. ÖNCELİK: JSON'da Yoksa Google Geocoding API'ye Katı Sorgu At
      const geocodeQuery = `${dormName} KYK Yurdu ${cityClean} Türkiye`.replace(/\s+/g, ' ').trim();
      console.log(`   🔍 Google Geocode sorgusu yapılıyor: "${geocodeQuery}"`);

      try {
        const geoResult = await queryGoogleGeocode(geocodeQuery);
        const validation = validateStrictEstablishment(geoResult);

        if (validation.valid) {
          finalLat = validation.location.lat;
          finalLng = validation.location.lng;
          fromGeocodeCount++;
          console.log(`   \x1b[32m✅ [GEOCODE NOKTA ATIŞI BULUNDU] -> (${finalLat}, ${finalLng}) [${validation.types.slice(0, 3).join(', ')}]\x1b[0m`);
        } else {
          nullCoordsCount++;
          console.log(`   \x1b[33m⚠️  [KOORDİNAT REDDEDİLDİ / NULL BIRAKILDI] -> ${validation.reason}\x1b[0m`);
        }

        await sleep(350); // Rate limit koruması
      } catch (err) {
        nullCoordsCount++;
        console.log(`   \x1b[33m⚠️  [API HATASI / NULL BIRAKILDI] -> ${err.message}\x1b[0m`);
      }
    }

    // dorms tablosuna ekle (type: 'KYK' enum kısıtına uygun)
    const dormAddress = dorm.address || dorm.district || null;

    const { error: insertError } = await supabase
      .from('dorms')
      .insert({
        name: dormName,
        type: 'KYK',
        gender: gender,
        city: cityClean || null,
        address: dormAddress,
        lat: finalLat,
        lng: finalLng
      });

    if (insertError) {
      console.error(`   \x1b[31m❌ dorms tablosuna eklenirken hata: ${insertError.message}\x1b[0m`);
    }
  }

  // ==========================================
  // ÖZET RAPOR
  // ==========================================
  console.log("\n================================================================================");
  console.log("📊 AŞAMA 3 TAMAMLANDI - ÖZET RAPOR");
  console.log("================================================================================");
  console.log(`🏠 İşlenen Toplam KYK Yurdu: ${totalDorms}`);
  console.log(`⚡ JSON'dan Doğrudan Alınan: ${fromJsonCount}`);
  console.log(`🎯 Google Geocode ile Nokta Atışı Bulunan: ${fromGeocodeCount}`);
  console.log(`⚠️  Koordinatı Reddedilen / NULL Bırakılan: ${nullCoordsCount}`);
  console.log("ℹ️  Haritada sahte iğne oluşmaması için bulunamayanların koordinatları NULL bırakıldı.");
  console.log("================================================================================\n");
}

seedDorms();
