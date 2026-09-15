/**
 * generate-from-osym-v2.cjs
 * =======================
 * Tablo-4 Fakültelerini TEK PİN ("Merkez Kampüs") altında birleştirir.
 * Sponsor isimlerini temizleyerek 3 aşamalı nokta atışı geocoding yapar.
 */

const fs = require('fs');
const xlsx = require('xlsx');
const https = require('https');

const API_KEY = 'pk.5e9a5a23a461f4ebf1bbb758930a0a64';
const SLEEP_MS = 650;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ÖSYM'nin eklediği gereksiz İL isimlerini ve statüleri temizle
function cleanUniName(name) {
    let clean = name.replace(/\(Devlet Üniversitesi\)/gi, '')
                    .replace(/\(Vakıf Üniversitesi\)/gi, '')
                    .replace(/\(.*?\)/g, '') // Parantez içindeki şehirleri sil
                    .trim();
    
    // Yaygın ÖSYM İsim Kirlilikleri
    const prefixesToRemove = [
        'AYDIN ADNAN MENDERES', 'KAYSERİ ERCİYES', 'ISPARTA SÜLEYMAN DEMİREL',
        'KÜTAHYA DUMLUPINAR', 'ZONGULDAK BÜLENT ECEVİT', 'SİVAS CUMHURİYET',
        'BOLU ABANT İZZET BAYSAL', 'BURDUR MEHMET AKİF ERSOY', 'TOKAT GAZİOSMANPAŞA',
        'YOZGAT BOZOK', 'KIRŞEHİR AHİ EVRAN', 'HATAY MUSTAFA KEMAL', 'KAHRAMANMARAŞ SÜTÇÜ İMAM',
        'NİĞDE ÖMER HALİSDEMİR', 'TRABZON KARADENİZ TEKNİK'
    ];

    for (const prefix of prefixesToRemove) {
        if (clean.toUpperCase().startsWith(prefix)) {
            const replacement = prefix.split(' ').slice(1).join(' ');
            clean = clean.replace(new RegExp('^' + prefix, 'i'), replacement);
        }
    }
    
    return clean.replace(/\s+/g, ' ').trim();
}

function extractCity(uniName) {
    const match = uniName.match(/\((.*?)\)/);
    if (match && match[1]) {
        return match[1].split('-')[0].trim().toUpperCase();
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

// Tablo-4 Lisans Fakültesi Merkez Kampüs mü?
function isMainCampusFaculty(facultyName) {
    const upper = facultyName.toUpperCase();
    
    // İçinde Yüksekokul veya Meslek geçiyorsa muhtemelen dış kampüstür
    if (upper.includes('YÜKSEKOKUL') || upper.includes('MYO')) return false;
    
    // Parantez içinde özel bir ilçe/yer adı varsa (İngilizce hariç) dış kampüstür
    const bracketMatch = upper.match(/\((.*?)\)/);
    if (bracketMatch) {
        const inside = bracketMatch[1];
        if (!inside.includes('İNGİLİZCE') && !inside.includes('UÖ') && !inside.includes('AÇIKÖĞRETİM') && !inside.includes('ÜCRETLİ') && !inside.includes('BURSLU')) {
            return false;
        }
    }

    // İlk kelimesi standart fakülte olmayanlar (Örn: "ALİAĞA İKTİSADİ...")
    const genericStarts = [
        'TIP', 'DİŞ', 'ECZACILIK', 'HUKUK', 'MÜHENDİSLİK', 'MİMARLIK', 'EĞİTİM', 
        'İKTİSADİ', 'İŞLETME', 'FEN', 'EDEBİYAT', 'İLAHİYAT', 'SAĞLIK', 'SPOR', 
        'İLETİŞİM', 'GÜZEL', 'VETERİNER', 'ZİRAAT', 'ORMAN', 'HEMŞİRELİK', 
        'İNSAN', 'SANAT', 'DEVLET', 'SU', 'UYGULAMALI', 'TURİZM', 'HAVACILIK', 'DENİZCİLİK'
    ];
    
    const firstWord = upper.split(' ')[0];
    if (!genericStarts.includes(firstWord)) return false;

    return true; 
}

// Sponsor isimlerini temizle (Örn: "Karacasu Memnune İnci Meslek Yüksekokulu" -> "Karacasu Meslek Yüksekokulu")
function removeSponsorsFromMYO(name) {
    const upper = name.toUpperCase();
    if (upper.includes('MESLEK YÜKSEKOKULU') || upper.includes('MYO')) {
        const words = name.split(' ');
        // Sadece ilk kelimeyi (İlçe adını) ve "Meslek Yüksekokulu"nu tut
        // "Kocaeli Uzunçiftlik Nuh Çimento MYO" -> "Uzunçiftlik Meslek Yüksekokulu" (En basit yaklaşım ilk kelime + MYO)
        return `${words[0]} Meslek Yüksekokulu`;
    }
    return name;
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
        if (!row[1] && !row[2]) continue;

        const col1 = row[0] ? String(row[0]).trim() : '';
        const col2 = row[1] ? String(row[1]).trim() : '';

        if (!col1) {
            if (col2.includes('ÜNİVERSİTE')) {
                currentCity = extractCity(col2);
                currentUniName = cleanUniName(col2);
                currentFaculty = '';
                
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
            if (!currentFaculty) currentFaculty = 'REKTÖRLÜK';
            
            const programName = col2;
            
            let campusKey = currentFaculty;
            let campusName = currentFaculty;
            let isMain = false;

            if (isLisans) {
                if (isMainCampusFaculty(currentFaculty)) {
                    campusKey = 'MERKEZ';
                    campusName = 'Merkez Kampüs';
                    isMain = true;
                }
            }

            if (!parsedData[currentUniId].campuses[campusKey]) {
                parsedData[currentUniId].campuses[campusKey] = {
                    id: `${currentUniId}-${slugify(campusName)}`,
                    name: campusName,
                    isMain: isMain,
                    city: currentCity,
                    academicUnits: {},
                    searchName: currentFaculty
                };
            }
            
            const campusObj = parsedData[currentUniId].campuses[campusKey];
            
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

async function geocodeLocationIQ(query) {
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

        if (cls === 'amenity' && PREFERRED_TYPES.has(type)) {
            best = r;
            break;
        }
        if (!backup && (cls === 'building' || cls === 'office' || cls === 'amenity' || cls === 'place' || cls === 'boundary')) {
            backup = r;
        }
    }

    const finalMatch = best || backup;
    if (!finalMatch) return null;

    return {
        lat: parseFloat(finalMatch.lat), 
        lng: parseFloat(finalMatch.lon), 
        district: (finalMatch.address || {}).district || (finalMatch.address || {}).county || (finalMatch.address || {}).town || '',
        city: (finalMatch.address || {}).province || (finalMatch.address || {}).state || '',
        address: finalMatch.display_name,
        type: finalMatch.type,
        class: finalMatch.class
    };
}

async function main() {
    console.log('1. ÖSYM dosyaları okunuyor ve fakülteler birleştiriliyor...');
    let t3Data, t4Data;
    try {
        t3Data = parseOsymExcel('tablo-3.xls.xls', false);
        t4Data = parseOsymExcel('tablo-4.xls.xls', true);
    } catch (e) {
        console.error('Excel okuma hatası:', e.message);
        return;
    }

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

        if (uni4) {
            for (const [key, campus] of Object.entries(uni4.campuses)) {
                if (!combinedCampusesMap[key]) combinedCampusesMap[key] = { ...campus };
                else Object.assign(combinedCampusesMap[key].academicUnits, campus.academicUnits);
            }
        }
        if (uni3) {
            for (const [key, campus] of Object.entries(uni3.campuses)) {
                if (!combinedCampusesMap[key]) combinedCampusesMap[key] = { ...campus };
                else Object.assign(combinedCampusesMap[key].academicUnits, campus.academicUnits);
            }
        }

        for (const campus of Object.values(combinedCampusesMap)) {
            campus.academicUnits = Object.values(campus.academicUnits);
            finalData[uniId].campuses.push(campus);
        }
    }

    const allCampuses = [];
    for (const uni of Object.values(finalData)) {
        for (const campus of uni.campuses) {
            allCampuses.push({ uni, campus });
        }
    }
    
    console.log(`\nToplam Sorgulanacak Yerleşke / Birim: ${allCampuses.length} (Eski 1662'den düştü!)\n`);

    let geocodedCount = 0;
    let notFoundCount = 0;

    for (let i = 0; i < allCampuses.length; i++) {
        const { uni, campus } = allCampuses[i];
        const city = campus.city || uni.city || '';
        const cleanUni = uni.universityName;
        const targetName = campus.isMain ? 'Rektörlük' : campus.searchName.replace(/\(MYO\)/g, 'Meslek Yüksekokulu');
        
        // 3 Aşamalı Sorgu Stratejisi
        // 1. Sadece MYO/Fakülte adı + İl Adı (En verimli yöntem)
        const q1 = `${targetName}, ${city}`;
        
        // 2. Üniversite Adı + MYO Adı
        let q2 = `${cleanUni} ${targetName}`;
        if (campus.isMain) q2 = `${cleanUni} Merkez Kampüs ${city}`;
        
        // 3. Sponsor İsimsiz Sadeleştirilmiş MYO Adı (Eğer MYO ise)
        const noSponsorName = removeSponsorsFromMYO(targetName);
        const q3 = `${noSponsorName}, ${city}`;

        let result = null;

        try { await sleep(SLEEP_MS); result = await geocodeLocationIQ(q1); } catch(e) {}
        
        if (!result) {
            try { await sleep(SLEEP_MS); result = await geocodeLocationIQ(q2); } catch(e) {}
        }
        
        if (!result && noSponsorName !== targetName) {
            try { await sleep(SLEEP_MS); result = await geocodeLocationIQ(q3); } catch(e) {}
        }
        
        if (result) {
            campus.latitude = result.lat;
            campus.longitude = result.lng;
            campus.district = result.district;
            campus.address = result.address;
            campus.coordinateStatus = 'locationiq-exact';
            
            geocodedCount++;
            process.stdout.write(`🎯 [${i+1}/${allCampuses.length}] BULUNDU: "${targetName}" -> (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})\n`);
        } else {
            campus.coordinateStatus = 'not-found';
            notFoundCount++;
            process.stdout.write(`❌ [${i+1}/${allCampuses.length}] BULUNAMADI: "${targetName}"\n`);
        }

        if ((i + 1) % 25 === 0) {
            fs.writeFileSync('src/data/campuses.json', JSON.stringify(finalData, null, 2));
        }
    }

    fs.writeFileSync('src/data/campuses.json', JSON.stringify(finalData, null, 2));

    console.log('\n=== ÖSYM TABANLI ÜRETİM (V2) SONUÇLARI ===');
    console.log(`🎯 Başarıyla Bulunan: ${geocodedCount}`);
    console.log(`❌ Bulunamayan: ${notFoundCount}`);
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
