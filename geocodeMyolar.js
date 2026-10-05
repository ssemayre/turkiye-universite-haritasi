import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Hata: .env.local dosyasında SUPABASE anahtarları eksik!");
    process.exit(1);
}

if (!GOOGLE_API_KEY) {
    console.error("Hata: .env.local dosyasında GOOGLE_MAPS_API_KEY eksik!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function geocodeMyolar() {
    console.log("🔍 Supabase'den lat değeri NULL olan MYO'lar çekiliyor...");
    
    const { data: myolar, error } = await supabase
        .from('myolar')
        .select('id, isim, universite_id, universiteler(isim)')
        .is('lat', null);

    if (error) {
        console.error("❌ Veri çekme hatası:", error.message);
        return;
    }

    if (!myolar || myolar.length === 0) {
        console.log("✅ Koordinatı eksik MYO bulunamadı!");
        return;
    }

    console.log(`📌 Toplam ${myolar.length} adet eksik MYO bulundu. Google Geocoding API'ye sorgu başlatılıyor...`);

    let successCount = 0;
    let notFoundCount = 0;

    for (let i = 0; i < myolar.length; i++) {
        const myo = myolar[i];
        const uniName = Array.isArray(myo.universiteler) ? myo.universiteler[0]?.isim : myo.universiteler?.isim;
        
        if (!uniName) {
            console.log(`⚠️ Üniversite ismi bulunamadı, atlanıyor: ${myo.isim}`);
            continue;
        }

        const addressQuery = `${myo.isim}, ${uniName}, Türkiye`;
        
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressQuery)}&key=${GOOGLE_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                const lat = location.lat;
                const lng = location.lng;

                const { error: updateError } = await supabase
                    .from('myolar')
                    .update({ lat, lng })
                    .eq('id', myo.id);

                if (updateError) {
                    console.error(`❌ Güncelleme hatası [${myo.isim}]:`, updateError.message);
                } else {
                    console.log(`✅ [${i + 1}/${myolar.length}] Eklendi: ${myo.isim} -> ${lat}, ${lng}`);
                    successCount++;
                }
            } else {
                console.log(`⚠️ [${i + 1}/${myolar.length}] Bulunamadı (Google): ${addressQuery}`);
                notFoundCount++;
            }
        } catch (err) {
            console.error(`❌ İstek hatası [${myo.isim}]:`, err.message);
        }

        await delay(200);
    }

    console.log(`\n🎉 İşlem tamamlandı! Toplam ${successCount} MYO güncellendi, ${notFoundCount} MYO bulunamadı.`);
}

geocodeMyolar();
