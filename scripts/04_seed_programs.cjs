require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ==========================================
// AYARLAR
// ==========================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Paket boyutu (Supabase PostgREST için en ideal ve güvenli boyut: 500)
const BATCH_SIZE = 500;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("\x1b[31mHATA: SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik (.env.local).\x1b[0m");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeName = (s) => (s || '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9ğüşıöç]/gi, '').trim();

// ==========================================
// 4. AŞAMA: BÖLÜMLER VE PROGRAMLAR SEED
// ==========================================
async function seedPrograms() {
  console.log("================================================================================");
  console.log("🚀 AŞAMA 4: Bölümler ve Programlar (Batch Insert & İlişkisel Bağlantı)");
  console.log("================================================================================\n");

  // 1. institutions Tablosundaki Üniversiteleri Yükle
  console.log("📡 institutions tablosundan üniversiteler yükleniyor...");
  const { data: dbInstitutions, error: instError } = await supabase
    .from('institutions')
    .select('id, name');

  if (instError || !dbInstitutions || dbInstitutions.length === 0) {
    console.error("\x1b[31mHATA: institutions tablosundan veri çekilemedi. Önce Aşama 1'i çalıştırın!\x1b[0m");
    process.exit(1);
  }

  const instMap = new Map();
  dbInstitutions.forEach(inst => {
    instMap.set(normalizeName(inst.name), inst.id);
  });
  console.log(`ℹ️  ${dbInstitutions.length} üniversite institutions tablosundan eşleştirildi.`);

  // 2. campuses Tablosundaki Kampüsleri Yükle
  console.log("📡 campuses tablosundan yerleşkeler yükleniyor...");
  const { data: dbCampuses, error: campError } = await supabase
    .from('campuses')
    .select('id, institution_id, name');

  if (campError || !dbCampuses) {
    console.error("\x1b[31mHATA: campuses tablosundan veri çekilemedi. Önce Aşama 1 ve 2'yi çalıştırın!\x1b[0m");
    process.exit(1);
  }

  // Kampüs Eşleştirme Sözlükleri
  const campMap = new Map(); // instId::campusName -> campusId
  const mainCampMap = new Map(); // instId -> mainCampusId
  const campusesByInst = new Map(); // instId -> [ { id, name, normName } ]

  dbCampuses.forEach(camp => {
    const normName = normalizeName(camp.name);
    campMap.set(`${camp.institution_id}::${normName}`, camp.id);

    if (camp.name.toLowerCase().includes('merkez')) {
      mainCampMap.set(camp.institution_id, camp.id);
    }

    if (!campusesByInst.has(camp.institution_id)) {
      campusesByInst.set(camp.institution_id, []);
    }
    campusesByInst.get(camp.institution_id).push({
      id: camp.id,
      name: camp.name,
      normName: normName
    });
  });

  console.log(`ℹ️  ${dbCampuses.length} yerleşke campuses tablosundan eşleştirildi.\n`);

  // 3. Bölüm Verilerini Oku ve İlişkilendir
  const campusesFilePath = path.join(__dirname, '../src/data/campuses.json');
  const completeFilePath = path.join(__dirname, '../src/data/programs-complete.json');

  if (!fs.existsSync(campusesFilePath) && !fs.existsSync(completeFilePath)) {
    console.error("\x1b[31mHATA: Bölüm veri dosyaları bulunamadı!\x1b[0m");
    process.exit(1);
  }

  console.log("🔄 Bölüm verileri işleniyor ve ID bağlantıları kuruluyor...");

  const programsToInsert = [];
  const processedCodes = new Set();
  let matchedCampusCount = 0;
  let nullCampusCount = 0;
  let skippedNoInstCount = 0;

  // 3A. campuses.json üzerinden hiyerarşik okuma (En yüksek doğruluk)
  if (fs.existsSync(campusesFilePath)) {
    const rawData = fs.readFileSync(campusesFilePath, 'utf8');
    const uniDict = JSON.parse(rawData);

    for (const uni of Object.values(uniDict)) {
      const uniName = uni.originalUniName || uni.universityName;
      const instId = instMap.get(normalizeName(uniName)) || instMap.get(normalizeName(uni.universityName));

      if (!instId) {
        skippedNoInstCount++;
        continue;
      }

      if (uni.campuses && Array.isArray(uni.campuses)) {
        for (const campus of uni.campuses) {
          const isMain = campus.isMain || (campus.name && campus.name.toLowerCase().includes('merkez'));
          
          // campus_id eşleştirmesi
          let campusId = null;
          const campusNorm = normalizeName(campus.name);
          
          if (campMap.has(`${instId}::${campusNorm}`)) {
            campusId = campMap.get(`${instId}::${campusNorm}`);
          } else if (isMain && mainCampMap.has(instId)) {
            campusId = mainCampMap.get(instId);
          } else {
            // Fuzzy / İçerme Kontrolü
            const instCampuses = campusesByInst.get(instId) || [];
            const fuzzyMatch = instCampuses.find(c => c.normName.includes(campusNorm) || campusNorm.includes(c.normName));
            if (fuzzyMatch) {
              campusId = fuzzyMatch.id;
            }
          }

          if (campusId) matchedCampusCount++;
          else nullCampusCount++;

          if (campus.academicUnits && Array.isArray(campus.academicUnits)) {
            for (const unit of campus.academicUnits) {
              const facultyName = unit.name || 'Fakülte/Yüksekokul';
              
              if (unit.programs && Array.isArray(unit.programs)) {
                for (const prog of unit.programs) {
                  if (prog.code) processedCodes.add(String(prog.code));

                  // Derece ve Süre Tespiti
                  const isAssociate = prog.degree === 'Önlisans' || 
                                      facultyName.toUpperCase().includes('MESLEK') || 
                                      facultyName.toUpperCase().includes('MYO');
                  
                  const degreeLevel = isAssociate ? 'Önlisans' : 'Lisans';
                  const duration = isAssociate ? 2 : 4;

                  programsToInsert.push({
                    institution_id: instId,
                    campus_id: campusId || null,
                    name: prog.name,
                    faculty: facultyName,
                    degree_level: degreeLevel,
                    duration: duration
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  // 3B. programs-complete.json üzerinden kalan programları tamamla
  if (fs.existsSync(completeFilePath)) {
    const rawComplete = fs.readFileSync(completeFilePath, 'utf8');
    const completeList = JSON.parse(rawComplete);

    for (const prog of completeList) {
      const codeStr = String(prog.code || '');
      if (codeStr && processedCodes.has(codeStr)) {
        continue; // Zaten campuses.json'dan eklendi
      }

      const uniName = prog.universityName || prog.university;
      const instId = instMap.get(normalizeName(uniName));
      if (!instId) {
        continue;
      }

      const facultyName = prog.faculty || 'Fakülte';
      const facultyNorm = normalizeName(facultyName);

      // Kampüs eşleştirme
      let campusId = null;
      if (campMap.has(`${instId}::${facultyNorm}`)) {
        campusId = campMap.get(`${instId}::${facultyNorm}`);
      } else {
        const instCampuses = campusesByInst.get(instId) || [];
        const fuzzyMatch = instCampuses.find(c => c.normName.includes(facultyNorm) || facultyNorm.includes(c.normName));
        if (fuzzyMatch) {
          campusId = fuzzyMatch.id;
        } else if (mainCampMap.has(instId)) {
          campusId = mainCampMap.get(instId);
        }
      }

      if (campusId) matchedCampusCount++;
      else nullCampusCount++;

      const parsedDuration = parseInt(prog.duration) || 4;
      const isAssociate = parsedDuration === 2 || facultyName.toUpperCase().includes('MESLEK') || facultyName.toUpperCase().includes('MYO');
      const degreeLevel = isAssociate ? 'Önlisans' : 'Lisans';

      programsToInsert.push({
        institution_id: instId,
        campus_id: campusId || null,
        name: prog.name,
        faculty: facultyName,
        degree_level: degreeLevel,
        duration: parsedDuration
      });

      if (codeStr) processedCodes.add(codeStr);
    }
  }

  const totalPrograms = programsToInsert.length;
  const totalBatches = Math.ceil(totalPrograms / BATCH_SIZE);

  console.log(`\n📋 Toplam Eklenecek Bölüm Sayısı: ${totalPrograms}`);
  console.log(`📦 Gönderilecek Paket Sayısı: ${totalBatches} (Paket Başına ~${BATCH_SIZE} kayıt)\n`);

  // 4. Batch Insert (Paketler Halinde Supabase'e Gönder)
  console.log("🚀 Supabase programs tablosuna veri aktarımı başlıyor...\n");

  let successfullyInserted = 0;

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const startIdx = batchIdx * BATCH_SIZE;
    const endIdx = Math.min(startIdx + BATCH_SIZE, totalPrograms);
    const chunk = programsToInsert.slice(startIdx, endIdx);

    try {
      const { error: insertError } = await supabase
        .from('programs')
        .insert(chunk);

      if (insertError) {
        console.error(`   \x1b[31m❌ [Paket ${batchIdx + 1}/${totalBatches}] HATA: ${insertError.message}\x1b[0m`);
      } else {
        successfullyInserted += chunk.length;
        const percent = Math.round((successfullyInserted / totalPrograms) * 100);
        console.log(`   ✅ [Paket ${batchIdx + 1}/${totalBatches}] ${chunk.length} bölüm eklendi (%${percent}) [${successfullyInserted}/${totalPrograms}]`);
      }

      await sleep(60); // Supabase rate limit koruması
    } catch (err) {
      console.error(`   \x1b[31m❌ [Paket ${batchIdx + 1}/${totalBatches}] İstek Hatası: ${err.message}\x1b[0m`);
    }
  }

  // ==========================================
  // ÖZET RAPOR
  // ==========================================
  console.log("\n================================================================================");
  console.log("📊 AŞAMA 4 TAMAMLANDI - ÖZET RAPOR");
  console.log("================================================================================");
  console.log(`🎓 Toplam Hazırlanan Bölüm Sayısı: ${totalPrograms}`);
  console.log(`✅ Başarıyla Eklenen Bölüm Sayısı: ${successfullyInserted}`);
  console.log(`📦 Tamamlanan Paket (Batch) Sayısı: ${totalBatches}`);
  console.log(`📍 Kampüsle Eşleşen Bölümler: ${matchedCampusCount}`);
  console.log(`⚪ Kampüsü NULL Kalan (Doğrudan Ana Kuruma Bağlı) Bölümler: ${nullCampusCount}`);
  console.log("================================================================================\n");
}

seedPrograms();
