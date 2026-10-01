import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Hata: .env.local dosyasında SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik!');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWikiData(uniName) {
  try {
    // 1. Wikipedia'da üniversiteyi ara
    const searchRes = await fetch(`https://tr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(uniName)}&utf8=&format=json`);
    const searchData = await searchRes.json();
    
    if (!searchData.query.search || searchData.query.search.length === 0) {
      return null;
    }
    
    const title = searchData.query.search[0].title;
    
    // 2. Sayfa özetini (history) ve Wikidata ID'sini al
    const detailRes = await fetch(`https://tr.wikipedia.org/w/api.php?action=query&prop=extracts|pageprops&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}&format=json`);
    const detailData = await detailRes.json();
    const pages = detailData.query.pages;
    const pageId = Object.keys(pages)[0];
    
    if (pageId === '-1') return null;
    
    const page = pages[pageId];
    const extract = page.extract || null;
    const wikidataId = page.pageprops?.wikibase_item;
    
    let website = null;
    
    // 3. Wikidata ID varsa web sitesini (P856) çek
    if (wikidataId) {
      const wikiRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikidataId}&property=P856&format=json`);
      const wikiData = await wikiRes.json();
      const claims = wikiData.claims?.P856;
      if (claims && claims.length > 0) {
        website = claims[0].mainsnak?.datavalue?.value || null;
      }
    }
    
    return { history: extract, website };
  } catch (error) {
    console.error(`Wikipedia API Hatası (${uniName}):`, error.message);
    return null;
  }
}

async function run() {
  console.log("⏳ Üniversiteler Supabase'den çekiliyor...");
  
  const { data: universities, error: fetchError } = await supabase
    .from('universities')
    .select('id, name');
    
  if (fetchError) {
    console.error("❌ Üniversiteler çekilirken hata:", fetchError);
    return;
  }
  
  console.log(`✅ Toplam ${universities.length} üniversite bulundu. İşlem başlıyor...`);
  
  let successCount = 0;
  
  for (let i = 0; i < universities.length; i++) {
    const uni = universities[i];
    console.log(`\n[${i + 1}/${universities.length}] İşleniyor: ${uni.name}`);
    
    const wikiData = await fetchWikiData(uni.name);
    
    if (wikiData && (wikiData.history || wikiData.website)) {
      const { error: updateError } = await supabase
        .from('universities')
        .update({
          history: wikiData.history,
          website: wikiData.website
        })
        .eq('id', uni.id);
        
      if (updateError) {
        console.error(`❌ Güncelleme hatası (${uni.name}):`, updateError.message);
      } else {
        console.log(`✅ Güncellendi! Web: ${wikiData.website || 'Bulunamadı'}`);
        successCount++;
      }
    } else {
      console.log(`⚠️ Bilgi bulunamadı: ${uni.name}`);
    }
    
    // API rate limitlerine takılmamak için kısa bir bekleme
    await delay(300);
  }
  
  console.log(`\n🎉 İşlem tamamlandı! Başarıyla güncellenen üniversite sayısı: ${successCount}/${universities.length}`);
}

run();
