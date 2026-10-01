import fs from 'fs';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GOOGLE_API_KEY) {
  console.error('❌ Hata: .env.local dosyasında SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY veya GOOGLE_API_KEY eksik!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const anaUniversiteler = [];

console.log("Terminatör Ana Kampüs Avcısı devrede! Tüm başlık kuralları iptal edildi...");

// headers: false diyerek dosyadaki HER hücreye tek tek bakıyoruz
fs.createReadStream('src/data/tablo-4.csv')
  .pipe(csv({ headers: false }))
  .on('data', (data) => {
    const hucreler = Object.values(data);
    
    // Satırdaki her hücreyi kontrol et
    for (let i = 0; i < hucreler.length; i++) {
      const hucreMetni = (hucreler[i] || '').toString().trim();
      const buyukMetin = hucreMetni.toUpperCase();

      // İçinde "ÜNİVERSİTE" kelimesi geçen hücreleri yakala
      if (buyukMetin.includes('ÜNİVERSİTE')) {
        
        let uniAdi = hucreMetni;
        
        // Genelde veriler KOCAELİ ÜNİVERSİTESİ/Mühendislik Fakültesi/Bilgisayar şeklindedir
        // Slash (/) veya Tire (-) işaretine kadar olan ilk kısmı alıyoruz
        if (hucreMetni.includes('/')) {
          uniAdi = hucreMetni.split('/')[0].trim();
        } else if (hucreMetni.includes('-')) {
          uniAdi = hucreMetni.split('-')[0].trim();
        }
        
        // Ayıkladığımız parçanın içinde gerçekten üniversite yazıyorsa listeye ekle
        if (uniAdi.toUpperCase().includes('ÜNİVERSİTE')) {
            const universiteZatenVarMi = anaUniversiteler.some(uni => uni.ad === uniAdi);
            
            if (!universiteZatenVarMi) {
              anaUniversiteler.push({ 
                ad: uniAdi,
                // Google'ın noktayı doğru koyması için "Merkez Kampüsü" ekliyoruz
                aramaMetni: `${uniAdi} Merkez Kampüsü, Türkiye` 
              });
            }
        }
        break; // Bu satırdan üniversiteyi bulduk, diğer hücrelerine bakmaya gerek yok
      }
    }
  })
  .on('end', async () => {
    console.log(`🎯 Boom! Toplam ${anaUniversiteler.length} adet farklı Ana Üniversite bulundu!`);
    console.log("⏳ Google Haritalar API'si ile koordinatlar çekiliyor, lütfen bekle...");

    for (let i = 0; i < anaUniversiteler.length; i++) {
      const uni = anaUniversiteler[i];

      try {
        const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(uni.aramaMetni)}&key=${GOOGLE_API_KEY}`);
        const geoData = await geoRes.json();

        if (geoData.results && geoData.results.length > 0) {
          const { lat, lng } = geoData.results[0].geometry.location;
          const tamAdres = geoData.results[0].formatted_address; 

          await supabase.from('universities').insert([{
            name: uni.ad,
            city: tamAdres,
            lat: lat,
            lng: lng,
            type: 'Ana Kampüs' 
          }]);
          console.log(`✅ [${i + 1}/${anaUniversiteler.length}] Kaydedildi: ${uni.ad}`);
        } else {
          console.log(`❌ [${i + 1}/${anaUniversiteler.length}] Haritada Bulunamadı: ${uni.ad}`);
        }
      } catch (err) {
        console.log(`⚠️ Hata (${uni.ad}):`, err.message);
      }
      await delay(500); 
    }
    console.log("🚀 Bütün Ana Kampüsler veritabanına başarıyla işlendi! Harita arayüzüne geçebiliriz.");
  });