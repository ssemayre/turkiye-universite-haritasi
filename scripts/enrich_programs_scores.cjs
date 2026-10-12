require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("\x1b[31mHATA: SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik (.env.local).\x1b[0m");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const normalize = (s) => (s || '').toLocaleLowerCase('tr-TR').replace(/[^a-z0-9ğüşıöç]/gi, '').trim();

function extractTuitionType(programName) {
  const name = (programName || '').toLocaleLowerCase('tr-TR');
  if (name.includes('burslu')) return 'Burslu';
  if (name.includes('%50')) return '%50 İndirimli';
  if (name.includes('%25')) return '%25 İndirimli';
  if (name.includes('ücretli') || name.includes('ucretli')) return 'Ücretli';
  if (name.includes('ikinci öğretim') || name.includes('(iö)')) return 'İkinci Öğretim';
  return 'Genel';
}

async function runEnrichment() {
  console.log("================================================================================");
  console.log("🚀 BÖLÜM DETAYLARINI DOLDURMA (KONTENJAN, SIRALAMA, TABAN PUAN)");
  console.log("================================================================================\n");

  // 1. Sütunların varlığını test et
  const { error: testErr } = await supabase.from('programs').select('quota, base_score, rank, score_type, tuition_type').limit(1);
  if (testErr) {
    console.error("\x1b[31mHATA: 'programs' tablosunda detay sütunları bulunamadı!\x1b[0m");
    console.log("\nLütfen önce Supabase SQL Editor'de şu SQL komutunu çalıştırın:\n");
    console.log(`\x1b[33mALTER TABLE programs 
ADD COLUMN IF NOT EXISTS quota INT,
ADD COLUMN IF NOT EXISTS base_score FLOAT8,
ADD COLUMN IF NOT EXISTS rank INT,
ADD COLUMN IF NOT EXISTS score_type TEXT,
ADD COLUMN IF NOT EXISTS tuition_type TEXT;\x1b[0m\n`);
    process.exit(1);
  }

  // 2. programs-with-rank.json dosyasını oku
  const rankFile = path.join(__dirname, '../src/data/programs-with-rank.json');
  if (!fs.existsSync(rankFile)) {
    console.error("\x1b[31mHATA: programs-with-rank.json dosyası bulunamadı!\x1b[0m");
    process.exit(1);
  }

  const raw = fs.readFileSync(rankFile, 'utf8');
  const rankList = JSON.parse(raw);
  console.log(`ℹ️  programs-with-rank.json'dan ${rankList.length} kayıt okundu.`);

  // 3. Supabase'deki tüm programları çek
  console.log("📡 Supabase'den mevcut bölümler çekiliyor...");
  let dbPrograms = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('programs')
      .select('id, name, faculty, institution_id')
      .range(from, from + step - 1);
    if (error || !data || data.length === 0) break;
    dbPrograms = dbPrograms.concat(data);
    if (data.length < step) break;
    from += step;
  }
  console.log(`ℹ️  Supabase'de ${dbPrograms.length} bölüm bulundu.`);

  // Eşleştirme haritası oluştur (normName + '::' + normFaculty)
  const rankMap = new Map();
  for (const item of rankList) {
    const key = `${normalize(item.name)}::${normalize(item.faculty)}`;
    if (!rankMap.has(key)) {
      rankMap.set(key, item);
    }
    // Sadece bölüm adına göre de ikincil anahtar
    const fallbackKey = normalize(item.name);
    if (!rankMap.has(fallbackKey)) {
      rankMap.set(fallbackKey, item);
    }
  }

  // 4. Güncelleme paketlerini hazırla
  console.log("🔄 Detay verileri eşleştiriliyor...");
  const updates = [];
  for (const prog of dbPrograms) {
    const key = `${normalize(prog.name)}::${normalize(prog.faculty)}`;
    const match = rankMap.get(key) || rankMap.get(normalize(prog.name));

    if (match) {
      const quotaVal = match.quota && match.quota !== '--' ? parseInt(match.quota) : null;
      const rankVal = match.successRank ? parseInt(match.successRank) : null;
      const scoreVal = match.minScore && match.minScore !== '--' ? parseFloat(match.minScore) : (match.yokMinScore ? parseFloat(match.yokMinScore) : null);
      const scoreTypeVal = match.scoreType || null;
      const tuitionVal = extractTuitionType(match.name);

      updates.push({
        id: prog.id,
        quota: quotaVal,
        base_score: scoreVal,
        rank: rankVal,
        score_type: scoreTypeVal,
        tuition_type: tuitionVal
      });
    }
  }

  console.log(`📋 Eşleşen ve güncellenecek bölüm sayısı: ${updates.length}`);

  // 5. Batch update (50'şerli paralel paketler)
  console.log("🚀 Supabase güncellemeleri gönderiliyor...");
  const batchSize = 100;
  const totalBatches = Math.ceil(updates.length / batchSize);
  let updatedCount = 0;

  for (let i = 0; i < totalBatches; i++) {
    const batch = updates.slice(i * batchSize, (i + 1) * batchSize);
    
    // Her bir satırı güncelle
    await Promise.all(batch.map(item => 
      supabase.from('programs').update({
        quota: item.quota,
        base_score: item.base_score,
        rank: item.rank,
        score_type: item.score_type,
        tuition_type: item.tuition_type
      }).eq('id', item.id)
    ));

    updatedCount += batch.length;
    if ((i + 1) % 10 === 0 || i === totalBatches - 1) {
      const pct = Math.round((updatedCount / updates.length) * 100);
      console.log(`   ✅ [%${pct}] ${updatedCount}/${updates.length} bölüm güncellendi.`);
    }
    await sleep(50);
  }

  console.log("\n================================================================================");
  console.log("🎉 BÖLÜM DETAYLARI BAŞARIYLA DOLDURULDU!");
  console.log("================================================================================\n");
}

runEnrichment();
