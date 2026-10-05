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
    const charMap = { '\u00e7': 'c', '\u011f': 'g', '\u0131': 'i', '\u00f6': 'o', '\u015f': 's', '\u00fc': 'u', '\u00e2': 'a', '\u00ee': 'i' };
        n = n.replace(/[\u00e7\u011f\u0131\u00f6\u015f\u00fc\u00e2\u00ee]/g, match => charMap[match]);
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

    // -------------------------------------------------------------
    // YARDIMCI FONKSİYON: MYO İsim Normalizasyonu
    // -------------------------------------------------------------
    function normalizeMyoName(name) {
        if (!name) return "";
        let n = name.toLocaleLowerCase('tr-TR');
        const charMap = { '\u00e7': 'c', '\u011f': 'g', '\u0131': 'i', '\u00f6': 'o', '\u015f': 's', '\u00fc': 'u', '\u00e2': 'a', '\u00ee': 'i' };
        n = n.replace(/[\u00e7\u011f\u0131\u00f6\u015f\u00fc\u00e2\u00ee]/g, match => charMap[match]);
        n = n.replace(/[.,\/#!$%\^&\*;:{}=\-_~()]/g, " ");
        n = n.replace(/\s{2,}/g, " ");
        const wordsToRemove = ["meslek", "yuksekokulu", "myo", "ve", "okulu", "yuksek", "hizmetleri", "bilimler"];
        let words = n.split(" ").filter(w => !wordsToRemove.includes(w.trim()) && w.trim().length > 1);
        return words.join(" ").trim();
    }

    // Adım 4: YÖK Verisinden (programs-complete.json) Benzersiz MYO'ları Çıkar ve campuses.json ile Eşleştir
    console.log("🏫 YÖK verilerinden MYO'lar çıkarılıyor ve koordinat eşleştirmesi yapılıyor...");
    
    // 1. programs-complete.json içinden tüm eşsiz MYO'ları bul
    const myoMap = new Map();
    bolumData.forEach(b => {
        const rawUniName = b.universityName || b.university;
        const normName = normalizeUniversityName(rawUniName);
        const uniId = uniIdMap.get(normName) || null;
        const fakulte = b.faculty;
        
        if (uniId && fakulte) {
            const isMyo = fakulte.toLocaleLowerCase('tr-TR').includes('meslek') || fakulte.toLocaleLowerCase('tr-TR').includes('myo');
            if (isMyo) {
                const key = `${uniId}_${fakulte}`;
                if (!myoMap.has(key)) {
                    myoMap.set(key, {
                        universite_id: uniId,
                        isim: fakulte,
                        lat: null,
                        lng: null,
                        ilce: null,
                        rawUniName: rawUniName
                    });
                }
            }
        }
    });

    // 2. campuses.json üzerinden aranabilir bir indeks oluştur
    const campusIndex = [];
    Object.values(campusesObj).forEach(uniNode => {
        const normUni = normalizeUniversityName(uniNode.universityName || uniNode.originalUniName);
        if (uniNode.campuses) {
            uniNode.campuses.forEach(campus => {
                let possibleNames = [campus.name, campus.searchName];
                if (campus.academicUnits) {
                    campus.academicUnits.forEach(u => possibleNames.push(u.name));
                }
                possibleNames = possibleNames.filter(Boolean);
                
                campusIndex.push({
                    uniNorm: normUni,
                    normNames: possibleNames.map(normalizeMyoName).filter(Boolean),
                    lat: campus.latitude || campus.lat || null,
                    lng: campus.longitude || campus.lng || null,
                    district: campus.district || campus.ilce || campus.city || null
                });
            });
        }
    });

    // 3. Her bir MYO için Esnek (Fuzzy) Eşleştirme yap
    let matchedCount = 0;
    for (const myo of myoMap.values()) {
        const myoNorm = normalizeMyoName(myo.isim);
        if (!myoNorm) continue;
        
        const uniNormStr = normalizeUniversityName(myo.rawUniName);
        const uniCampuses = campusIndex.filter(c => c.uniNorm === uniNormStr);
        
        let matchedCampus = null;
        for (const c of uniCampuses) {
            const myoWords = myoNorm.split(' ');
            
            for (const cNorm of c.normNames) {
                if (!cNorm) continue;
                
                // Tam kelime geçişi kontrolü
                if (cNorm.includes(myoNorm) || myoNorm.includes(cNorm)) {
                    matchedCampus = c;
                    break;
                }
                
                // Kök kelime (intersection) kontrolü
                const cWords = cNorm.split(' ');
                const intersection = myoWords.filter(w => cWords.includes(w));
                if (intersection.length > 0 && intersection.length >= Math.min(myoWords.length, cWords.length)) {
                    matchedCampus = c;
                    break;
                }
            }
            if (matchedCampus) break;
        }
        
        if (matchedCampus && matchedCampus.lat && matchedCampus.lng) {
            myo.lat = matchedCampus.lat;
            myo.lng = matchedCampus.lng;
            myo.ilce = matchedCampus.district;
            matchedCount++;
        }
    }

    const myoList = Array.from(myoMap.values()).map(m => {
        delete m.rawUniName;
        return m;
    });

    if (myoList.length > 0) {
        console.log(`✅ Toplam ${myoList.length} eşsiz MYO bulundu.`);
        console.log(`📍 ${matchedCount} tanesinin harita koordinatları (campuses.json üzerinden) başarıyla eşleştirildi.`);
        
        // Önce eski MYO'ları temizle
        console.log("🧹 Eski MYO'lar temizleniyor...");
        await supabase.from('myolar').delete().neq('id', 0);
        
        const { error: myoError } = await supabase.from('myolar').insert(myoList);
        if (myoError) {
            console.error("❌ MYO ekleme hatası:", myoError.message);
        } else {
            console.log("✅ MYO'lar başarıyla yüklendi.");
        }
    }

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
                puan: (b.minScore || null)?.toString(), 
                siralama: (b.successRank || null)?.toString(),
                kontenjan: (b.quota || null)?.toString()
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