import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import xlsx from 'xlsx';

dotenv.config({ path: '.env.local' });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Hata: .env.local dosyasında SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik!');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeString(str) {
  if (!str) return '';
  return str
    .toLocaleUpperCase('tr-TR')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractUniName(rawName) {
  // Remove " (Devlet Üniversitesi)" etc.
  let name = rawName.split('(')[0].trim();
  return normalizeString(name);
}

async function run() {
  console.log("⏳ Tablo-3 okunuyor...");
  let rows = [];
  try {
    const wb = xlsx.readFile('tablo-3.xls.xls');
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  } catch (err) {
    console.error("❌ tablo-3.xls.xls okunamadı:", err.message);
    process.exit(1);
  }

  // Build mapping from MYO name to a Set of University Names
  const myoMap = new Map();
  let currentUni = null;

  for (const row of rows) {
    // We observe that if row[0] is empty, and row[1] has content:
    const col0 = row[0] ? String(row[0]).trim() : '';
    const col1 = row[1] ? String(row[1]).trim() : '';

    if (!col0 && col1) {
      if (col1.includes('Üniversitesi)') || col1.includes('ÜNİVERSİTESİ (')) {
        currentUni = extractUniName(col1);
      } else {
        if (currentUni) {
          const myoName = normalizeString(col1);
          if (!myoMap.has(myoName)) {
            myoMap.set(myoName, new Set());
          }
          myoMap.get(myoName).add(currentUni);
        }
      }
    }
  }
  
  console.log(`✅ CSV'den ${myoMap.size} farklı MYO okundu.`);

  // Fetch all universities to differentiate main vs myos
  console.log("⏳ Veritabanından kayıtlar çekiliyor...");
  const { data: dbUniversities, error: fetchError } = await supabase
    .from('universities')
    .select('id, name, type, parent_id, city');

  if (fetchError) {
    console.error("❌ Veritabanı hatası:", fetchError);
    return;
  }

  // We consider "Main Universities" as those without parent_id (and type 'Ana Kampüs' or 'Üniversite')
  const mainUnis = dbUniversities.filter(u => !u.parent_id && (u.type === 'Ana Kampüs' || u.type === 'Üniversite' || u.type === 'Devlet' || u.type === 'Vakıf' || u.type === 'Kıbrıs' || u.name.toLocaleUpperCase('tr-TR').includes('ÜNİVERSİTESİ')));
  
  // Unmatched MYOs
  const unmatchedMyos = dbUniversities.filter(u => !u.parent_id && !mainUnis.find(m => m.id === u.id));

  console.log(`✅ ${mainUnis.length} Ana Üniversite bulundu.`);
  console.log(`✅ ${unmatchedMyos.length} Eşleşmemiş MYO/Alt Kampüs bulundu.`);

  let matchCount = 0;
  let ambiguousCount = 0;
  let notFoundCount = 0;

  for (const myo of unmatchedMyos) {
    const normalizedMyoName = normalizeString(myo.name);
    
    if (myoMap.has(normalizedMyoName)) {
      const parentUnis = Array.from(myoMap.get(normalizedMyoName));
      
      let matchedUniName = null;

      if (parentUnis.length === 1) {
        // Kesin eşleşme
        matchedUniName = parentUnis[0];
      } else {
        // Aynı isimde birden fazla MYO varsa, şehre göre eşleştirmeyi deneyebiliriz
        // parentUnis içinde, db'deki ana üniversitelerden şehri uyuşanı bulalım
        let matchedByCity = null;
        for (const pUniName of parentUnis) {
          const dbUniMatch = mainUnis.find(m => extractUniName(m.name) === pUniName);
          if (dbUniMatch && normalizeString(dbUniMatch.city) === normalizeString(myo.city)) {
            matchedByCity = pUniName;
            break;
          }
        }
        
        if (matchedByCity) {
          matchedUniName = matchedByCity;
        } else {
          ambiguousCount++;
          console.log(`⚠️ Belirsiz Eşleşme: ${myo.name} (Birden fazla üniversitede var: ${parentUnis.join(', ')})`);
          continue;
        }
      }

      // Ana üniversite ID'sini bul
      const parentRecord = mainUnis.find(m => extractUniName(m.name) === matchedUniName);
      
      if (parentRecord) {
        const { error: updateError } = await supabase
          .from('universities')
          .update({ parent_id: parentRecord.id })
          .eq('id', myo.id);
          
        if (updateError) {
          console.error(`❌ Hata (${myo.name}):`, updateError.message);
        } else {
          matchCount++;
          console.log(`🔗 Eşleşti: ${myo.name} -> ${parentRecord.name}`);
        }
      } else {
        console.log(`⚠️ Ana Üniversite DB'de bulunamadı: ${matchedUniName}`);
      }
      
    } else {
      notFoundCount++;
    }
  }

  console.log(`\n🎉 İşlem Özeti:`);
  console.log(`✅ Başarıyla Eşleşen: ${matchCount}`);
  console.log(`⚠️ Belirsiz (Atlandı): ${ambiguousCount}`);
  console.log(`❌ CSV'de Bulunamayan: ${notFoundCount}`);
}

run();
