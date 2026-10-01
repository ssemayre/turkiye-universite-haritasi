import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  'https://qoambngledgzdcstkopr.supabase.co', 
  'sb_publishable_JtfPLdYQZBmjio3tzIg1rg_sOSI62FH'
);

const normalize = (str) => {
  if (!str) return '';
  return str.split('(')[0]
    .toLocaleUpperCase('tr-TR')
    .replace(/İ/g, 'I').replace(/I/g, 'I').replace(/ı/g, 'I').replace(/i/g, 'I')
    .replace(/Ü/g, 'U').replace(/ü/g, 'U')
    .replace(/Ö/g, 'O').replace(/ö/g, 'O')
    .replace(/Ş/g, 'S').replace(/ş/g, 'S')
    .replace(/Ç/g, 'C').replace(/ç/g, 'C')
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'G')
    .replace(/[^A-Z]/g, '');
};

async function importPrograms() {
  console.log("🚀 Supabase'den Üniversiteler ve MYO'lar çekiliyor...");
  
  const { data: universities, error: uniError } = await supabase.from('universities').select('id, name');
  if (uniError) return console.error("❌ Hata:", uniError);

  const uniMap = new Map(universities.map(u => [normalize(u.name), u.id]));
  const programsToInsert = [];

  const readCSV = (filePath, degreeLevel) => {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) return resolve();

      let currentUniId = null;
      let currentFacultyName = '';

      fs.createReadStream(filePath)
        .pipe(csv({ separator: ',', headers: false })) 
        .on('data', (row) => {
          const col0 = row['0'] ? row['0'].trim() : '';
          const col1 = row['1'] ? row['1'].trim() : '';

          if (!col0 && col1.includes('ÜNİVERSİTE') && !col1.includes('PROGRAM')) {
              currentUniId = uniMap.get(normalize(col1)) || null;
              currentFacultyName = '';
          } 
          else if (!col0 && col1 && currentUniId && !col1.includes('PUAN') && !col1.includes('KODU')) {
              currentFacultyName = col1;
          }
          else if (col0.length === 9 && !isNaN(col0) && currentUniId) {
              
              // MYO veya Fakülte adını haritada arayıp gerçek Campus ID'sini buluyoruz
              let resolvedCampusId = currentUniId; // Varsayılan olarak ana kampüs
              if (currentFacultyName) {
                  const normalizedFaculty = normalize(currentFacultyName);
                  if (uniMap.has(normalizedFaculty)) {
                      resolvedCampusId = uniMap.get(normalizedFaculty);
                  }
              }

              programsToInsert.push({
                university_id: currentUniId,
                campus_id: resolvedCampusId, // Artık dinamik ve doğru yeri gösteriyor!
                name: col1,
                faculty: currentFacultyName || 'Belirtilmemiş',
                degree_level: degreeLevel,
                score_type: row['3'] ? row['3'].trim() : '',
                quota: row['4'] ? row['4'].trim() : '',
                rank: row['9'] ? row['9'].trim() : '',
                base_score: row['10'] ? row['10'].trim() : ''
              });
          }
        })
        .on('end', resolve).on('error', reject);
    });
  };

  await readCSV('tablo-3.csv', 'Önlisans');
  await readCSV('tablo-4.csv', 'Lisans');

  const BATCH_SIZE = 1000;
  for (let i = 0; i < programsToInsert.length; i += BATCH_SIZE) {
    const batch = programsToInsert.slice(i, i + BATCH_SIZE);
    await supabase.from('programs').insert(batch);
    console.log(`✔️  ${Math.min(i + BATCH_SIZE, programsToInsert.length)} bölüm yazıldı.`);
  }
  console.log("\n🎯 OPERASYON TAMAMLANDI!");
}
importPrograms();