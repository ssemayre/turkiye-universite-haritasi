/**
 * DİKKAT: Bu scriptin çalışması için '.env.local' dosyasında:
 * SUPABASE_URL ve SUPABASE_ANON_KEY (veya yetki sorunu yaşamamak için SUPABASE_SERVICE_ROLE_KEY) 
 * değişkenlerinin bulunması gerekir.
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY; 

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Hata: .env.local dosyasında SUPABASE anahtarları eksik!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// -------------------------------------------------------------
// 1. GERÇEK PROJE DOSYA YOLLARI
// -------------------------------------------------------------
const UNIVERSITELER_JSON = 'src/data/universities.json';
const CAMPUSES_JSON = 'src/data/campuses.json';
const BOLUMLER_JSON = 'src/data/programs-complete.json';

// -------------------------------------------------------------
// 2. GELİŞMİŞ STRİNG NORMALİZASYON FONKSİYONU
// -------------------------------------------------------------
function normalizeUniversityName(name) {
    if (!name) return "";
    let n = name.replace(/\([^)]*\)/g, '').trim();
    n = n.toLocaleLowerCase('tr-TR');
    const charMap = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i' };
    n = n.replace(/[çğıöşüâî]/g, match => charMap[match]);
    n = n.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
    n = n.replace(/\s{2,}/g, " ");
    const wordsToRemove = ["universitesi", "universite", "unv", "uni", "u"];
    let words = n.split(" ").filter(w => !wordsToRemove.includes(w.trim()));
    return words.join(" ").trim();
}

// -------------------------------------------------------------
// 3. ANA SEED (AKTARIM) FONKSİYONU
// -------------------------------------------------------------
async function seedDatabase() {
    console.log("🚀 Veritabanı aktarımı başlıyor...\n");

    let uniData = [], campusesObj = {}, bolumData = [];
    try {
        if (fs.existsSync(UNIVERSITELER_JSON)) uniData = JSON.parse(fs.readFileSync(UNIVERSITELER_JSON, 'utf-8'));
        if (fs.existsSync(CAMPUSES_JSON)) campusesObj = JSON.parse(fs.readFileSync(CAMPUSES_JSON, 'utf-8'));
        if (fs.existsSync(BOLUMLER_JSON)) bolumData = JSON.parse(fs.readFileSync(BOLUMLER_JSON, 'utf-8'));
        console.log(`📦 Veriler Okundu: \({uniData.length} Üniversite, Campuses Anahtarı:\){Object.keys(campusesObj).length}, ${bolumData.length} Bölüm.\n`);
    } catch (error) {
        console.error("❌ JSON dosyaları okunamadı! Yolları kontrol edin.", error.message);
        return;
    }

    // Adım 2: Üniversiteleri Ekle
    if (uniData.length > 0) {
        console.log("🏢 Üniversiteler Supabase'e ekleniyor...");
        const uniInsertData = uniData.map(u => ({
            isim: u.name, 
            sehir: u.city,
            tur: u.type, // Bizim veritabanındaki sütun adı 'tur'
            lat: u.latitude,
            lng: u.longitude
        }));

        const { error: uniError } = await supabase.from('universiteler').insert(uniInsertData);
        if (uniError) {
            console.error("❌ Üniversiteler eklenirken hata:", uniError.message);
            return;
        }
    }

    // Adım 3: Gerçek ID'leri Supabase'den Çek ve Sözlük Oluştur
    console.log("🔄 İlişkiler için üniversite ID'leri eşleştiriliyor...");
    const { data: savedUnis, error: fetchError } = await supabase.from('universiteler').select('id, isim');
    if (fetchError || !savedUnis) return console.error("❌ Supabase'den üniversiteler çekilemedi:", fetchError?.message);

    const uniIdMap = new Map();
    for (const uni of savedUnis) {
        uniIdMap.set(normalizeUniversityName(uni.isim), uni.id);
    }

    // Adım 4: campuses.json'dan MYO'ları Ayıkla ve Ekle
    const myoList = [];
    Object.values(campusesObj).forEach(uniNode => {
        const uniName = uniNode.universityName || uniNode.originalUniName;
        const normName = normalizeUniversityName(uniName);
        const uniId = uniIdMap.get(normName) || null;

        if (uniNode.campuses) {
            uniNode.campuses.forEach(campus => {
                if (campus.academicUnits) {
                    campus.academicUnits.forEach(unit => {
                        const isMyo = (unit.type && unit.type.toLowerCase().includes('meslek')) || 
                                      (unit.name && unit.name.toLowerCase().includes('meslek')) || 
                                      (unit.name && unit.name.toLowerCase().includes('myo'));
                        
                        if (isMyo && uniId) {
                            myoList.push({
                                universite_id: uniId,
                                isim: unit.name,
                                // ilce, lat, lng verisi JSON içinde varsa eklenebilir, yoksa boş kalır
                            });
                        }
                    });
                }
            });
        }
    });

    if (myoList.length > 0) {
        console.log(`🏫 Toplam ${myoList.length} MYO eşleştirildi ve aktarılıyor...`);
        const { error: myoError } = await supabase.from('myolar').insert(myoList);
        if (myoError) {
            console.error("❌ MYO ekleme hatası:", myoError.message);
        } else {
            console.log("✅ MYO'lar başarıyla yüklendi.");
        }
    }

    // Önce eski bölümleri temizle
    console.log("🧹 Eski bölümler temizleniyor...");
    await supabase.from('bolumler').delete().neq('id', 0);
    
    // Adım 5: Bölümleri programs-complete.json'dan Oku ve Batch Ekle
    if (bolumData.length > 0) {
        console.log("📚 Bölümler eşleştiriliyor...");
        
        const bolumInsertData = bolumData.map(b => {
            const rawUniName = b.universityName || b.university;
            const normName = normalizeUniversityName(rawUniName);
            const uniId = uniIdMap.get(normName) || null;

            return {
                universite_id: uniId,
                program_kodu: b.programCode || null,
                isim: b.department || b.name,
                fakulte: b.faculty || null,
                puan: (b.minScore || b.minPuan || b.base_score || null)?.toString(), 
                siralama: (b.successRank || b.basariSirasi || b.rank || null)?.toString(),
                kontenjan: (b.quota || b.kontenjan || null)?.toString()
            };
        }).filter(b => b.universite_id !== null);

        console.log(`🚀 ${bolumInsertData.length} adet geçerli bölüm Supabase'e (1000'er 1000'er) yükleniyor...`);
        
        const BATCH_SIZE = 1000;
        for (let i = 0; i < bolumInsertData.length; i += BATCH_SIZE) {
            const batch = bolumInsertData.slice(i, i + BATCH_SIZE);
            const { error: bolumError } = await supabase.from('bolumler').insert(batch);
            
            if (bolumError) {
                console.error(`❌ Bölüm ekleme hatası (Batch ${i}):`, bolumError.message);
            } else {
                console.log(`   -> \({i + batch.length} /\){bolumInsertData.length} bölüm yüklendi.`);
            }
        }
    }

    console.log("\n✅ Tüm ilişkisel veritabanı kurulumu başarıyla tamamlandı!");
}

seedDatabase();