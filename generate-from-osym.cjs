/**
 * generate-from-osym.cjs
 * =======================
 * ÖSYM Tablo-3 ve Tablo-4 verilerinden harita noktalarını (campuses.json) BAŞTAN YARATIR.
 * "Yerleşke" isimleri uydurmaz, sadece resmi kurum adlarını kullanır.
 * Ana kampüs fakültelerini tek bir "Merkez Kampüs" pininde birleştirir.
 * İlçe MYO'ları ve Dış Fakülteleri bağımsız pinler olarak ayırır.
 * LocationIQ ile resmi isimler üzerinden koordinat bulur.
 */

const fs = require('fs');
const xlsx = require('xlsx');
const https = require('https');

const API_KEY = 'pk.5e9a5a23a461f4ebf1bbb758930a0a64';
const SLEEP_MS = 650; // Rate limit (2 req/sec)

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanUniName(name) {
    return name.replace(/\(Devlet Üniversitesi\)/g, '')
               .replace(/\(Vakıf Üniversitesi\)/g, '')
               .replace(/\s+/g, ' ')
               .trim();
}

function extractCity(uniName) {
    const match = uniName.match(/\((.*?)\)/);
    if (match && match[1]) {
        const city = match[1].split('-')[0].trim();
        return city.replace('ÜNİVERSİTESİ', '').trim();
    }
    return '';
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
        .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// Genel "Merkez" fakültesi olarak kabul edilecek standart isim başlangıçları
const GENERIC_FACULTY_PREFIXES = [
    'TIP FAKÜLTESİ', 'DİŞ HEKİMLİĞİ', 'ECZACILIK', 'HUKUK FAKÜLTESİ',
    'MÜHENDİSLİK', 'MİMARLIK', 'EĞİTİM FAKÜLTESİ', 'İKTİSADİ VE İDARİ',
    'İŞLETME FAKÜLTESİ', 'FEN FAKÜLTESİ', 'EDEBİYAT FAKÜLTESİ', 'FEN-EDEBİYAT',
    'İLAHİYAT FAKÜLTESİ', 'SAĞLIK BİLİMLERİ', 'SPOR BİLİMLERİ', 'İLETİŞİM FAKÜLTESİ',
    'GÜZEL SANATLAR', 'VETERİNER FAKÜLTESİ', 'ZİRAAT FAKÜLTESİ', 'ORMAN FAKÜLTESİ',
    'HEMŞİRELİK', 'İNSAN VE TOPLUM', 'SANAT VE TASARIM', 'DEVLET KONSERVATUVARI',
    'SU ÜRÜNLERİ', 'UYGULAMALI BİLİMLER', 'TURİZM FAKÜLTESİ'
];

function isMainCampusFaculty(facultyName) {
    // Eğer isminde parantez içi ilçe vs varsa dış kampüstür
    if (facultyName.includes('(') && !facultyName.includes('(İngilizce)')) return false;
    
    for (const prefix of GENERIC_FACULTY_PREFIXES) {
        if (facultyName.startsWith(prefix)) return true;
    }
    return false; // Standart dışı isimse bağımsız kampüs olarak düşün
}

function parseOsymExcel(filename, isLisans) {
    const wb = xlsx.readFile(filename);
    const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1});
    
    const parsedData = {};
    let currentUniId = null;
    let currentUniName = '';
    let currentCity = '';
    let currentFaculty = '';

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Boş satırları atla
        if (!row[1] && !row[2]) continue;

        const col1 = row[0] ? String(row[0]).trim() : '';
        const col2 = row[1] ? String(row[1]).trim() : '';

        // Eğer kod (sütun 1) boşsa, Sütun 2 başlık (Üniversite veya Fakülte)
        if (!col1) {
            if (col2.includes('ÜNİVERSİTE')) {
                currentUniName = cleanUniName(col2);
                currentCity = extractCity(currentUniName);
                currentFaculty = '';
                
                // İleriye bakıp uni ID bul (ilk program kodunun ilk 4 hanesi)
                for (let j = i + 1; j < Math.min(i + 50, data.length); j++) {
                    const nextCode = data[j][0] ? String(data[j][0]).trim() : '';
                    if (nextCode.length >= 9) {
                        currentUniId = nextCode.substring(0, 4);
                        if (!parsedData[currentUniId]) {
                            parsedData[currentUniId] = {
                                universityId: currentUniId,
                                universityName: currentUniName,
                                city: currentCity,
                                campuses: {}
                            };
                        }
                        break;
                    }
                }
            } else if (col2 && !col2.startsWith('PROGRAM') && !col2.startsWith('KODU')) {
                currentFaculty = col2;
            }
        } else if (col1.length >= 9 && currentUniId) {
            // Bu bir program
            if (!currentFaculty) currentFaculty = 'REKTÖRLÜK'; // Fakülte başlığı unutulmuşsa
            
            const programName = col2;
            
            // Tablo-4 (Lisans) ise fakülte birleştirme mantığı uygula
            let campusKey = currentFaculty;
            let campusName = currentFaculty;
            let isMain = false;

            if (isLisans) {
                if (isMainCampusFaculty(currentFaculty)) {
                    campusKey = 'MERKEZ';
                    campusName = 'Merkez Kampüs';
                    isMain = true;
                } else {
                    isMain = false;
                }
            } else {
                // Tablo-3 (Önlisans) tüm MYO'lar ayrı bir pin
                isMain = false;
            }

            if (!parsedData[currentUniId].campuses[campusKey]) {
                parsedData[currentUniId].campuses[campusKey] = {
                    id: `${currentUniId}-${slugify(campusName)}`,
                    name: campusName,
                    isMain: isMain,
                    city: currentCity,
                    academicUnits: {},
                    searchNames: new Set()
                };
            }
            
            const campusObj = parsedData[currentUniId].campuses[campusKey];
            campusObj.searchNames.add(currentFaculty); // Aramada kullanmak üzere orijinal isimleri sakla
            
            if (!campusObj.academicUnits[currentFaculty]) {
                campusObj.academicUnits[currentFaculty] = {
                    name: currentFaculty,
                    type: isLisans ? 'Fakülte' : 'MYO',
                    programs: []
                };
            }
            
            campusObj.academicUnits[currentFaculty].programs.push({
                code: col1,
                name: programName,
                degree: isLisans ? 'Lisans' : 'Önlisans'
            });
        }
    }
    return parsedData;
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        const opts = new URL(url);
        const req = https.get({
            hostname: opts.hostname,
            path: opts.pathname + opts.search,
            headers: { 'User-Agent': 'TurkiyeUniversiteHaritasi/1.0' }
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode === 429) { reject(new Error('RATE_LIMIT')); return; }
                if (res.statusCode !== 200) { reject(new Error('HTTP_' + res.statusCode)); return; }
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('JSON_PARSE')); }
            });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => { req.destroy(); reject(new Error('TIMEOUT')); });
    });
}

function isTurkey(lat, lng) {
    return lat >= 35.9 && lat <= 42.1 && lng >= 25.6 && lng <= 44.8;
}

const PREFERRED_TYPES = new Set(['university', 'college', 'school', 'education', 'library', 'hospital']);
const REJECTED_TYPES = new Set(['industrial', 'industrial_estate', 'farmland', 'forest', 'wood', 'residential', 'commercial']);

async function geocodeLocationIQ(query, allowDistrict = false) {
    const url = `https://us1.locationiq.com/v1/search?key=${API_KEY}&q=${encodeURIComponent(query)}&format=json&countrycodes=tr&addressdetails=1&limit=5`;
    const results = await getJson(url);
    if (!Array.isArray(results) || results.length === 0) return null;

    let best = null;
    let backup = null;

    for (const r of results) {
        const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
        if (!isTurkey(lat, lng)) continue;

        const type = r.type ? r.type.toLowerCase() : '';
        const cls = r.class ? r.class.toLowerCase() : '';

        if (REJECTED_TYPES.has(type) || REJECTED_TYPES.has(cls)) continue;

        if (allowDistrict && (cls === 'boundary' || cls === 'place')) {
            best = r;
            break;
        }

        if (!allowDistrict) {
            if (cls === 'amenity' && PREFERRED_TYPES.has(type)) {
                best = r;
                break;
            }
            if (!backup && (cls === 'building' || cls === 'office' || cls === 'amenity')) {
                backup = r;
            }
        }
    }

    const finalMatch = best || backup;
    if (!finalMatch) return null;

    const lat = parseFloat(finalMatch.lat), lng = parseFloat(finalMatch.lon);
    const addr = finalMatch.address || {};
    const district = addr.district || addr.county || addr.town || addr.suburb || '';
    const city = addr.province || addr.state || addr.city || '';
    
    return {
        lat, lng, district, city,
        address: finalMatch.display_name,
        type: finalMatch.type,
        class: finalMatch.class
    };
}

// İlçe adını okul adından çıkar (örn: "Finike Meslek Yüksekokulu" -> "Finike")
function extractDistrictFromName(name) {
    const match = name.match(/^([A-ZÇĞİÖŞÜa-zçğıöşü]+(?:\s[A-ZÇĞİÖŞÜa-zçğıöşü]+)?)\s+(Meslek Yüksekokulu|MYO|Fakültesi|Yüksekokulu|Sağlık|Turizm|Ziraat|Sosyal)/i);
    if (match) {
        const extracted = match[1].trim();
        if (!['Uygulamalı', 'Meslek', 'Yüksekokul', 'Fakülte', 'Sağlık', 'Merkez', 'Adalet', 'Sivil'].includes(extracted)) {
            return extracted;
        }
    }
    return null;
}

async function main() {
    console.log('1. ÖSYM dosyaları okunuyor...');
    let t3Data, t4Data;
    try {
        t3Data = parseOsymExcel('tablo-3.xls.xls', false);
        t4Data = parseOsymExcel('tablo-4.xls.xls', true);
    } catch (e) {
        console.error('Excel okuma hatası:', e.message);
        return;
    }

    // Verileri Birleştir
    const finalData = {};
    const allUniIds = new Set([...Object.keys(t3Data), ...Object.keys(t4Data)]);

    for (const uniId of allUniIds) {
        const uni3 = t3Data[uniId];
        const uni4 = t4Data[uniId];
        
        const baseUni = uni4 || uni3;
        finalData[uniId] = {
            universityId: baseUni.universityId,
            universityName: baseUni.universityName,
            city: baseUni.city,
            campuses: []
        };

        const combinedCampusesMap = {};

        // Tablo-4 (Lisans) Kampüsleri ekle
        if (uni4) {
            for (const [key, campus] of Object.entries(uni4.campuses)) {
                if (!combinedCampusesMap[key]) combinedCampusesMap[key] = { ...campus };
                else {
                    // Merkez kampüs gibi zaten varsa, academic unitleri birleştir
                    Object.assign(combinedCampusesMap[key].academicUnits, campus.academicUnits);
                    campus.searchNames.forEach(n => combinedCampusesMap[key].searchNames.add(n));
                }
            }
        }
        
        // Tablo-3 (Önlisans) Kampüsleri ekle
        if (uni3) {
            for (const [key, campus] of Object.entries(uni3.campuses)) {
                if (!combinedCampusesMap[key]) combinedCampusesMap[key] = { ...campus };
                else {
                    Object.assign(combinedCampusesMap[key].academicUnits, campus.academicUnits);
                    campus.searchNames.forEach(n => combinedCampusesMap[key].searchNames.add(n));
                }
            }
        }

        // Map'i Array'e çevir ve set'i array yap
        for (const campus of Object.values(combinedCampusesMap)) {
            campus.academicUnits = Object.values(campus.academicUnits);
            const searchNames = Array.from(campus.searchNames);
            delete campus.searchNames;
            
            // Arama sorgusunda kullanılacak birincil hedef adı seç
            campus.searchTargetName = campus.isMain ? 'Rektörlük' : searchNames[0];
            
            finalData[uniId].campuses.push(campus);
        }
    }

    console.log(`Toplam ${Object.keys(finalData).length} Üniversite birleştirildi.`);

    // 3. Geocoding Aşaması
    let geocodedCount = 0;
    let fallbackCount = 0;
    let notFoundCount = 0;
    
    // İşlenecek tüm kampüsleri düz liste yapalım
    const allCampuses = [];
    for (const uni of Object.values(finalData)) {
        for (const campus of uni.campuses) {
            allCampuses.push({ uni, campus });
        }
    }
    
    console.log(`\nToplam Sorgulanacak Yerleşke / Birim: ${allCampuses.length}\n`);

    for (let i = 0; i < allCampuses.length; i++) {
        const { uni, campus } = allCampuses[i];
        const city = campus.city || uni.city || '';
        const cleanUni = uni.universityName.trim();
        const searchTarget = campus.searchTargetName;
        
        // Sorgu 1: Tam Üniversite + Okul Adı
        let q1 = `${cleanUni} ${searchTarget}`;
        if (campus.isMain) {
            q1 = `${cleanUni} Merkez Kampüs ${city} Türkiye`;
        }
        
        // Sorgu 2: Sadece Okul Adı + Şehir (Üniversite adı kafa karıştırıyorsa)
        const q2 = `${searchTarget}, ${city}, Türkiye`;
        
        // Sorgu 3: İlçe Merkezi (Fallback)
        const extractedDist = extractDistrictFromName(searchTarget);
        const q3 = extractedDist ? `${extractedDist}, ${city}, Türkiye` : null;

        let result = null;
        let isFallback = false;

        try { await sleep(SLEEP_MS); result = await geocodeLocationIQ(q1, false); } catch(e) {}
        
        if (!result) {
            try { await sleep(SLEEP_MS); result = await geocodeLocationIQ(q2, false); } catch(e) {}
        }
        
        if (!result && q3) {
            try { 
                await sleep(SLEEP_MS); 
                result = await geocodeLocationIQ(q3, true); 
                isFallback = true;
            } catch(e) {}
        }
        
        // Eğer merkez kampüs bulunamazsa son çare şehrin rektörlüğüne/şehir merkezine at
        if (!result && campus.isMain) {
            try { 
                await sleep(SLEEP_MS); 
                result = await geocodeLocationIQ(`${cleanUni} Rektörlük`, true); 
                if (!result) result = await geocodeLocationIQ(`${city}, Türkiye`, true);
                isFallback = true;
            } catch(e) {}
        }

        if (result) {
            campus.latitude = result.lat;
            campus.longitude = result.lng;
            campus.district = extractedDist || result.district;
            campus.address = result.address;
            campus.coordinateStatus = isFallback ? 'district-fallback' : 'locationiq-exact';
            
            if (isFallback) {
                fallbackCount++;
                process.stdout.write(`⚠️ [${i+1}/${allCampuses.length}] İLÇE/ŞEHİR MERKEZİ: "${searchTarget}" -> (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})\n`);
            } else {
                geocodedCount++;
                const tag = PREFERRED_TYPES.has(result.type) ? '🎯' : '📍';
                process.stdout.write(`${tag} [${i+1}/${allCampuses.length}] BİNA BULUNDU: "${q1}" -> (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})\n`);
            }
        } else {
            campus.coordinateStatus = 'not-found';
            notFoundCount++;
            process.stdout.write(`❌ [${i+1}/${allCampuses.length}] BULUNAMADI: "${q1}"\n`);
        }

        if ((i + 1) % 25 === 0) {
            fs.writeFileSync('src/data/campuses.json', JSON.stringify(finalData, null, 2));
        }
    }

    fs.writeFileSync('src/data/campuses.json', JSON.stringify(finalData, null, 2));

    console.log('\n=== ÖSYM TABANLI ÜRETİM SONUÇLARI ===');
    console.log(`🎯 Doğrudan Binası Bulunan: ${geocodedCount}`);
    console.log(`⚠️ İlçe Merkezine Atanan: ${fallbackCount}`);
    console.log(`❌ Bulunamayan: ${notFoundCount}`);
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
