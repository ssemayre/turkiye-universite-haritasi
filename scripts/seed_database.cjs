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

// TEST MODU: Tüm veriyi işlemek için null bırakın.
// Hızlı test için örneğin 3 veya 5 yapabilirsiniz.
const LIMIT_UNIVERSITIES = null; 
const LIMIT_DORMS = null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("HATA: SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// ŞEHİR MERKEZ KOORDİNATLARI (FALLBACK HAVUZU)
// ==========================================
const CITY_COORDINATES = {
  "ADANA": { lat: 37.0000, lng: 35.3213 },
  "ADIYAMAN": { lat: 37.7648, lng: 38.2786 },
  "AFYONKARAHİSAR": { lat: 38.7507, lng: 30.5567 },
  "AĞRI": { lat: 39.7191, lng: 43.0503 },
  "AMASYA": { lat: 40.6501, lng: 35.8353 },
  "ANKARA": { lat: 39.9334, lng: 32.8597 },
  "ANTALYA": { lat: 36.8969, lng: 30.7133 },
  "ARTVİN": { lat: 41.1828, lng: 41.8183 },
  "AYDIN": { lat: 37.8560, lng: 27.8416 },
  "BALIKESİR": { lat: 39.6484, lng: 27.8826 },
  "BİLECİK": { lat: 40.1451, lng: 29.9799 },
  "BİNGÖL": { lat: 38.8853, lng: 40.4983 },
  "BİTLİS": { lat: 38.4006, lng: 42.1095 },
  "BOLU": { lat: 40.7392, lng: 31.6089 },
  "BURDUR": { lat: 37.7203, lng: 30.2908 },
  "BURSA": { lat: 40.1885, lng: 29.0610 },
  "ÇANAKKALE": { lat: 40.1553, lng: 26.4142 },
  "ÇANKIRI": { lat: 40.6013, lng: 33.6134 },
  "ÇORUM": { lat: 40.5506, lng: 34.9556 },
  "DENİZLİ": { lat: 37.7765, lng: 29.0864 },
  "DİYARBAKIR": { lat: 37.9144, lng: 40.2306 },
  "EDİRNE": { lat: 41.6771, lng: 26.5557 },
  "ELAZIĞ": { lat: 38.6810, lng: 39.2264 },
  "ERZİNCAN": { lat: 39.7500, lng: 39.5000 },
  "ERZURUM": { lat: 39.9055, lng: 41.2658 },
  "ESKİŞEHİR": { lat: 39.7767, lng: 30.5206 },
  "GAZİANTEP": { lat: 37.0662, lng: 37.3833 },
  "GİRESUN": { lat: 40.9128, lng: 38.3895 },
  "GÜMÜŞHANE": { lat: 40.4600, lng: 39.4718 },
  "HAKKARİ": { lat: 37.5833, lng: 43.7333 },
  "HATAY": { lat: 36.2023, lng: 36.1606 },
  "ISPARTA": { lat: 37.7648, lng: 30.5566 },
  "MERSİN": { lat: 36.8121, lng: 34.6415 },
  "İSTANBUL": { lat: 41.0082, lng: 28.9784 },
  "İZMİR": { lat: 38.4237, lng: 27.1428 },
  "KARS": { lat: 40.6013, lng: 43.0975 },
  "KASTAMONU": { lat: 41.3887, lng: 33.7827 },
  "KAYSERİ": { lat: 38.7205, lng: 35.4826 },
  "KIRKLARELİ": { lat: 41.7333, lng: 27.2167 },
  "KIRŞEHİR": { lat: 39.1425, lng: 34.1709 },
  "KOCAELİ": { lat: 40.8533, lng: 29.8815 },
  "KONYA": { lat: 37.8667, lng: 32.4833 },
  "KÜTAHYA": { lat: 39.4167, lng: 29.9833 },
  "MALATYA": { lat: 38.3552, lng: 38.3095 },
  "MANİSA": { lat: 38.6191, lng: 27.4289 },
  "KAHRAMANMARAŞ": { lat: 37.5858, lng: 36.9371 },
  "MARDİN": { lat: 37.3212, lng: 40.7245 },
  "MUĞLA": { lat: 37.2153, lng: 28.3636 },
  "MUŞ": { lat: 38.9462, lng: 41.7539 },
  "NEVŞEHİR": { lat: 38.6244, lng: 34.7144 },
  "NİĞDE": { lat: 37.9667, lng: 34.6833 },
  "ORDU": { lat: 40.9839, lng: 37.8764 },
  "RİZE": { lat: 41.0201, lng: 40.5234 },
  "SAKARYA": { lat: 40.7569, lng: 30.3783 },
  "SAMSUN": { lat: 41.2867, lng: 36.3300 },
  "SİİRT": { lat: 37.9333, lng: 41.9500 },
  "SİNOP": { lat: 42.0231, lng: 35.1531 },
  "SİVAS": { lat: 39.7477, lng: 37.0179 },
  "TEKİRDAĞ": { lat: 40.9833, lng: 27.5167 },
  "TOKAT": { lat: 40.3167, lng: 36.5500 },
  "TRABZON": { lat: 41.0027, lng: 39.7167 },
  "TUNCELİ": { lat: 39.1079, lng: 39.5401 },
  "ŞANLIURFA": { lat: 37.1674, lng: 38.7955 },
  "UŞAK": { lat: 38.6823, lng: 29.4082 },
  "VAN": { lat: 38.4891, lng: 43.4089 },
  "YOZGAT": { lat: 39.8181, lng: 34.8147 },
  "ZONGULDAK": { lat: 41.4564, lng: 31.7987 },
  "AKSARAY": { lat: 38.3687, lng: 34.0370 },
  "BAYBURT": { lat: 40.2552, lng: 40.2249 },
  "KARAMAN": { lat: 37.1759, lng: 33.2287 },
  "KIRIKKALE": { lat: 39.8468, lng: 33.5153 },
  "BATMAN": { lat: 37.8812, lng: 41.1294 },
  "ŞIRNAK": { lat: 37.4187, lng: 42.4918 },
  "BARTIN": { lat: 41.6344, lng: 32.3375 },
  "ARDAHAN": { lat: 41.1105, lng: 42.7022 },
  "IĞDIR": { lat: 39.9196, lng: 44.0450 },
  "YALOVA": { lat: 40.6500, lng: 29.2667 },
  "KARABÜK": { lat: 41.2061, lng: 32.6204 },
  "KİLİS": { lat: 36.7184, lng: 37.1212 },
  "OSMANİYE": { lat: 37.0742, lng: 36.2472 },
  "DÜZCE": { lat: 40.8438, lng: 31.1565 },
  "LEFKOŞA": { lat: 35.1856, lng: 33.3823 },
  "GAZİMAĞUSA": { lat: 35.1250, lng: 33.9500 },
  "GİRNE": { lat: 35.3382, lng: 33.3186 },
  "GÜZELYURT": { lat: 35.2028, lng: 32.9936 },
  "KKTC": { lat: 35.1856, lng: 33.3823 }
};

// ==========================================
// YARDIMCI FONKSİYONLAR
// ==========================================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => sleep(Math.floor(Math.random() * 500) + 500);

const normalizeName = (s) => (s || '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9ğüşıöç]/gi, '').trim();

// Google Geocoding API Çağrısı
const queryGoogleGeocode = (queryAddress) => {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_API_KEY) {
      return resolve(null);
    }
    const encodedAddress = encodeURIComponent(queryAddress);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_API_KEY}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'OK' && parsed.results && parsed.results.length > 0) {
            resolve(parsed.results[0].geometry.location);
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

// Çok Aşamalı Hassas Geocoding (Üniversite + Kampüs + Şehir + Ülke)
async function geocodeCampusPrecise(uniName, campusName, cityName, isCyprus) {
  const country = isCyprus ? 'KKTC' : 'Türkiye';
  const cleanCity = cityName || '';

  // 1. Aşama: En detaylı arama (Üniversite Adı + Kampüs Adı + Şehir + Ülke)
  let primaryQuery = `${uniName} ${campusName} ${cleanCity} ${country}`.replace(/\s+/g, ' ').trim();
  let coords = await queryGoogleGeocode(primaryQuery);
  if (coords) return { coords, queryUsed: primaryQuery };

  await sleep(300);

  // 2. Aşama: Sadece Kampüs / MYO Adı + Şehir + Ülke (Örn: "Gerede Meslek Yüksekokulu Bolu Türkiye")
  let secondaryQuery = `${campusName} ${cleanCity} ${country}`.replace(/\s+/g, ' ').trim();
  coords = await queryGoogleGeocode(secondaryQuery);
  if (coords) return { coords, queryUsed: secondaryQuery };

  await sleep(300);

  // 3. Aşama: Üniversite Adı + Şehir + Ülke
  let tertiaryQuery = `${uniName} ${cleanCity} ${country}`.replace(/\s+/g, ' ').trim();
  coords = await queryGoogleGeocode(tertiaryQuery);
  if (coords) return { coords, queryUsed: tertiaryQuery };

  return { coords: null, queryUsed: primaryQuery };
}

const determineType = (uniName) => {
  const name = uniName.toUpperCase();
  if (name.includes('VAKIF')) return 'Vakıf';
  if (name.includes('KIBRIS') || name.includes('LEFKE') || name.includes('GİRNE') || name.includes('DOĞU AKDENİZ') || name.includes('YAKIN DOĞU')) return 'Kıbrıs';
  return 'Devlet';
};

const determineDegreeLevel = (facultyName) => {
  const name = (facultyName || '').toUpperCase();
  if (name.includes('MESLEK') || name.includes('MYO')) return 'Önlisans';
  return 'Lisans';
};

// ==========================================
// ANA SEED FONKSİYONU
// ==========================================
async function runSeed() {
  console.log("🚀 Veritabanı Seeding (Gelişmiş Geocoding & Fallback) Başlıyor...\n");

  // Bilinen koordinat & şehir sözlüğünü yükle (universities.json)
  const uniJsonPath = path.join(__dirname, '../src/data/universities.json');
  const uniLookupMap = new Map();
  if (fs.existsSync(uniJsonPath)) {
    const uniJsonData = JSON.parse(fs.readFileSync(uniJsonPath, 'utf8'));
    uniJsonData.forEach(u => {
      if (u.name) {
        uniLookupMap.set(normalizeName(u.name), u);
      }
    });
    console.log(`ℹ️  ${uniLookupMap.size} üniversitenin önceden doğrulanmış koordinat ve şehir bilgisi yüklendi.`);
  }

  // 1. Üniversiteleri Oku
  const campusesFilePath = path.join(__dirname, '../src/data/campuses.json');
  if (fs.existsSync(campusesFilePath)) {
    console.log("\n📘 ÜNİVERSİTELER VE YERLEŞKELER İŞLENİYOR...");
    const rawData = fs.readFileSync(campusesFilePath, 'utf8');
    const uniDict = JSON.parse(rawData);
    const uniList = Object.values(uniDict);
    
    const limit = LIMIT_UNIVERSITIES ? LIMIT_UNIVERSITIES : uniList.length;
    
    let totalCampuses = 0;
    let geocodedSuccess = 0;
    let fallbackCount = 0;

    for (let i = 0; i < limit; i++) {
      const uni = uniList[i];
      const displayName = uni.originalUniName || uni.universityName;
      const uniType = determineType(displayName);
      const isCyprus = uniType === 'Kıbrıs';

      // Gerçek Şehri ve Bilinen Koordinatı Tespit Et
      const matchedUniInfo = uniLookupMap.get(normalizeName(displayName)) || uniLookupMap.get(normalizeName(uni.universityName));
      
      let realCity = matchedUniInfo?.city;
      if (!realCity && uni.city && !uni.city.includes('ÜNİVERSİTESİ')) {
        realCity = uni.city;
      }
      if (!realCity && isCyprus) {
        realCity = 'KKTC';
      }

      // Üniversitenin bilinen merkez koordinatı (varsa)
      let uniKnownCoords = null;
      if (matchedUniInfo && matchedUniInfo.latitude && matchedUniInfo.longitude) {
        uniKnownCoords = {
          lat: Number(matchedUniInfo.latitude),
          lng: Number(matchedUniInfo.longitude)
        };
      } else if (realCity && CITY_COORDINATES[realCity.toUpperCase()]) {
        uniKnownCoords = CITY_COORDINATES[realCity.toUpperCase()];
      }

      console.log(`\n🏢 [${i+1}/${limit}] Üniversite: ${displayName} (${uniType}) - Şehir: ${realCity || 'Belirsiz'}`);

      // 1A. Institution (Kurum) Ekle
      const { data: instData, error: instError } = await supabase
        .from('institutions')
        .insert({
          name: displayName,
          type: uniType,
          city: realCity || null
        })
        .select('id').single();

      if (instError) {
        console.error("   ❌ Üniversite eklenemedi:", instError.message);
        continue;
      }
      const institutionId = instData.id;

      // 1B. Campuses (Yerleşkeler) Ekle
      let mainCampusCoords = null; // Bu üniversitenin ana kampüs koordinatı

      if (uni.campuses && Array.isArray(uni.campuses)) {
        for (const campus of uni.campuses) {
          totalCampuses++;
          const isMainCampus = campus.isMain || (campus.name && campus.name.toLowerCase().includes('merkez'));
          
          let lat = null, lng = null;
          let usedFallback = false;
          let fallbackReason = "";

          // Google Geocoding Hassas Sorgu At
          try {
            const { coords, queryUsed } = await geocodeCampusPrecise(displayName, campus.name, realCity, isCyprus);
            if (coords) {
              lat = coords.lat;
              lng = coords.lng;
              geocodedSuccess++;
              console.log(`     ✅ [GEOCODE BAŞARILI] ${campus.name} -> (${lat}, ${lng})`);
              
              if (isMainCampus && !mainCampusCoords) {
                mainCampusCoords = { lat, lng };
              }
            } else {
              usedFallback = true;
              fallbackReason = `Google Geocoding sonuç bulamadı (Sorgu: "${queryUsed}")`;
            }
            await randomDelay();
          } catch (geoErr) {
            usedFallback = true;
            fallbackReason = `Geocoding API hatası: ${geoErr.message}`;
          }

          // FALLBACK MEKANİZMASI (Koordinat null kalmasın!)
          if (usedFallback || !lat || !lng) {
            fallbackCount++;
            
            // 1. Tercih: Üniversitenin ana kampüs koordinatı
            if (mainCampusCoords) {
              lat = mainCampusCoords.lat;
              lng = mainCampusCoords.lng;
              fallbackReason = "Ana Kampüs koordinatı devralındı";
            } 
            // 2. Tercih: universities.json'daki doğrulanmış üniversite koordinatı
            else if (uniKnownCoords) {
              lat = uniKnownCoords.lat;
              lng = uniKnownCoords.lng;
              fallbackReason = "Kayıtlı üniversite merkez koordinatı devralındı";
            } 
            // 3. Tercih: Şehir merkez koordinatı
            else if (realCity && CITY_COORDINATES[realCity.toUpperCase()]) {
              const cityCoord = CITY_COORDINATES[realCity.toUpperCase()];
              lat = cityCoord.lat;
              lng = cityCoord.lng;
              fallbackReason = `${realCity} şehir merkezi koordinatı atandı`;
            } 
            // 4. Tercih: Türkiye geneli varsayılan merkez (Ankara)
            else {
              lat = 39.9334;
              lng = 32.8597;
              fallbackReason = "Türkiye genel merkez koordinatı atandı";
            }

            // Ana kampüs koordinatı henüz boşsa ve ana kampüs fallback aldıysa bunu kaydet
            if (isMainCampus && !mainCampusCoords) {
              mainCampusCoords = { lat, lng };
            }

            console.log(`     \x1b[33m⚠️  [FALLBACK KULLANILDI] ${campus.name} -> (${lat}, ${lng}) [Sebep: ${fallbackReason}]\x1b[0m`);
          }

          // Adres alanını temizle
          const campusAddress = realCity ? `${campus.name}, ${realCity}` : campus.name;

          const { data: campusData, error: campusError } = await supabase
            .from('campuses')
            .insert({
              institution_id: institutionId,
              name: campus.name,
              address: campusAddress,
              lat: lat,
              lng: lng
            })
            .select('id').single();

          if (campusError) {
            console.error(`     ❌ Kampüs eklenemedi (${campus.name}):`, campusError.message);
            continue;
          }
          const campusId = campusData.id;

          // 1C. Programs (Bölümler) Ekle
          if (campus.academicUnits) {
            let programsToInsert = [];
            for (const unit of campus.academicUnits) {
              if (unit.programs) {
                for (const prog of unit.programs) {
                  programsToInsert.push({
                    institution_id: institutionId,
                    campus_id: campusId,
                    name: prog.name,
                    faculty: unit.name,
                    degree_level: determineDegreeLevel(unit.name),
                    duration: determineDegreeLevel(unit.name) === 'Önlisans' ? 2 : 4
                  });
                }
              }
            }

            // Toplu ekleme (Batch Insert)
            if (programsToInsert.length > 0) {
              const chunkSize = 100;
              for (let c = 0; c < programsToInsert.length; c += chunkSize) {
                const chunk = programsToInsert.slice(c, c + chunkSize);
                const { error: progError } = await supabase.from('programs').insert(chunk);
                if (progError) console.error(`       ❌ Programlar eklenirken hata:`, progError.message);
              }
              console.log(`       🎓 ${programsToInsert.length} bölüm eklendi.`);
            }
          }
        }
      }
    }

    console.log(`\n📊 YERLEŞKE İSTATİSTİKLERİ:`);
    console.log(`   Toplam Yerleşke: ${totalCampuses}`);
    console.log(`   Doğrudan Geocode Edilen: ${geocodedSuccess}`);
    console.log(`   Fallback (Yedek) ile Kurtarılan: ${fallbackCount}`);
  } else {
    console.log("⚠️ campuses.json bulunamadı. Üniversite verileri atlandı.");
  }


  // 2. Yurtları Oku
  const kykFilePath = path.join(__dirname, '../src/data/kyk-yurtlari.json');
  if (fs.existsSync(kykFilePath)) {
    console.log("\n🏠 YURTLAR İŞLENİYOR...");
    const rawData = fs.readFileSync(kykFilePath, 'utf8');
    const dormList = JSON.parse(rawData);
    
    const limit = LIMIT_DORMS ? LIMIT_DORMS : dormList.length;
    
    let dormsToInsert = [];
    for (let i = 0; i < limit; i++) {
      const dorm = dormList[i];
      
      let lat = dorm.coordinates?.lat || null;
      let lng = dorm.coordinates?.lng || null;
      let gender = (dorm.gender === 'Kız' || dorm.gender === 'Erkek' || dorm.gender === 'Karma') ? dorm.gender : 'Karma';

      // Eğer koordinat JSON'da yoksa Google Geocoding'den hassas arama yap
      if (!lat || !lng) {
        try {
          const dormQuery = `${dorm.name} KYK Yurdu ${dorm.city || ''} Türkiye`.trim();
          const coords = await queryGoogleGeocode(dormQuery);
          if (coords) {
            lat = coords.lat; 
            lng = coords.lng;
            console.log(`   ✅ [YURT GEOCODE] ${dorm.name} -> (${lat}, ${lng})`);
          } else if (dorm.city && CITY_COORDINATES[dorm.city.toUpperCase()]) {
            const cityCoord = CITY_COORDINATES[dorm.city.toUpperCase()];
            lat = cityCoord.lat;
            lng = cityCoord.lng;
            console.log(`   \x1b[33m⚠️  [YURT FALLBACK] ${dorm.name} için şehir merkezi koordinatı atandı (${dorm.city})\x1b[0m`);
          }
          await randomDelay();
        } catch(e) {
          if (dorm.city && CITY_COORDINATES[dorm.city.toUpperCase()]) {
            const cityCoord = CITY_COORDINATES[dorm.city.toUpperCase()];
            lat = cityCoord.lat;
            lng = cityCoord.lng;
          }
        }
      }

      dormsToInsert.push({
        name: dorm.name,
        type: 'KYK',
        gender: gender,
        city: dorm.city || null,
        address: dorm.district || dorm.address || null,
        lat: lat,
        lng: lng
      });
    }

    if (dormsToInsert.length > 0) {
      const chunkSize = 100;
      for (let c = 0; c < dormsToInsert.length; c += chunkSize) {
        const chunk = dormsToInsert.slice(c, c + chunkSize);
        const { error } = await supabase.from('dorms').insert(chunk);
        if (error) console.error("❌ Yurtlar eklenirken hata:", error.message);
      }
      console.log(`✅ Toplam ${dormsToInsert.length} KYK yurdu eklendi.`);
    }

  } else {
    console.log("⚠️ kyk-yurtlari.json bulunamadı. Yurt verileri atlandı.");
  }

  console.log("\n🎉 SEED İŞLEMİ EKSİKSİZ VE HATASIZ TAMAMLANDI!");
}

runSeed();
