/**
 * generate-from-osym-v4.cjs
 * =======================
 * Tablo-4 (Lisans) Fakültelerini TEK PİN ("Merkez Kampüs") altında birleştirir.
 * Temizlenmiş VE Orijinal Üniversite isimleriyle 4 aşamalı arama yapar.
 */

const fs = require('fs');
const xlsx = require('xlsx');
const https = require('https');

const API_KEY = 'pk.5e9a5a23a461f4ebf1bbb758930a0a64';
const SLEEP_MS = 1100; // 60 requests/minute limitine takılmamak için 1.1 saniye

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getOriginalUniName(name) {
    return name.replace(/\(Devlet Üniversitesi\)/gi, '')
               .replace(/\(Vakıf Üniversitesi\)/gi, '')
               .replace(/\(.*?\)/g, '')
               .replace(/\s+/g, ' ').trim();
}

function cleanUniName(name) {
    let clean = getOriginalUniName(name);
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

function isMainCampusFaculty(facultyName) {
    const upper = facultyName.toUpperCase();
    if (upper.includes('YÜKSEKOKUL') || upper.includes('MYO')) return false;
    const bracketMatch = upper.match(/\((.*?)\)/);
    if (bracketMatch) {
        const inside = bracketMatch[1];
        if (!inside.includes('İNGİLİZCE') && !inside.includes('UÖ') && !inside.includes('AÇIKÖĞRETİM') && !inside.includes('ÜCRETLİ') && !inside.includes('BURSLU')) {
            return false;
        }
    }
    return true; 
}

function removeSponsorsFromMYO(name) {
    const upper = name.toUpperCase();
    if (upper.includes('MESLEK YÜKSEKOKULU') || upper.includes('MYO')) {
        const words = name.split(' ');
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
    let currentOriginalUniName = '';
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
                currentOriginalUniName = getOriginalUniName(col2);
                currentFaculty = '';
                
                for (let j = i + 1; j < Math.min(i + 50, data.length); j++) {
                    const nextCode = data[j][0] ? String(data[j][0]).trim() : '';
                    if (nextCode.length >= 9) {
                        currentUniId = nextCode.substring(0, 4);
                        if (!parsedData[currentUniId]) {
                            parsedData[currentUniId] = {
                                universityId: currentUniId,
                                universityName: currentUniName,
                                originalUniName: currentOriginalUniName,
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
    if (!Array.isArray(results)) {
        if (results && results.error && results.error.includes('Rate Limited')) {
            throw new Error('RATE_LIMIT');
        }
        return null;
    }
    if (results.length === 0) return null;

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

async function geocodeWithRetry(query) {
    let result = null;
    let attempts = 0;
    while (attempts < 3) {
        try {
            await sleep(SLEEP_MS);
            result = await geocodeLocationIQ(query);
            break;
        } catch (e) {
            if (e.message === 'RATE_LIMIT') {
                console.log('⚠️ Rate Limit aşıldı! 61 saniye bekleniyor...');
                await sleep(61000); // 61 Saniye bekle (Minute limitine tam garantili çözüm)
                attempts++;
            } else {
                break;
            }
        }
    }
    return result;
}

// İlçe adını okul adından çıkar
function extractDistrictFromName(name) {
    let lower = name.toUpperCase();
    let idx = lower.indexOf(' MESLEK YÜKSEKOKULU');
    if (idx > 0) return name.substring(0, idx).trim();
    idx = lower.indexOf(' MYO');
    if (idx > 0) return name.substring(0, idx).trim();
    idx = lower.indexOf(' FAKÜLTESİ');
    if (idx > 0) return name.substring(0, idx).trim();
    idx = lower.indexOf(' YÜKSEKOKULU');
    if (idx > 0) return name.substring(0, idx).trim();
    return null;
}

async function main() {
    console.log('1. ÖSYM dosyaları okunuyor ve fakülteler BİRLEŞTİRİLİYOR...');
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
            originalUniName: baseUni.originalUniName,
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
    
    console.log(`\nToplam Sorgulanacak PİN (Yerleşke) Sayısı: ${allCampuses.length} (Tahmini ~1300 olmalıdır. Her Tablo-3 MYO'su bir pindir.)\n`);

    let geocodedCount = 0;
    let notFoundCount = 0;

    for (let i = 0; i < allCampuses.length; i++) {
        const { uni, campus } = allCampuses[i];
        const city = campus.city || uni.city || '';
        const cleanUni = uni.universityName;
        const origUni = uni.originalUniName;
        const targetName = campus.isMain ? 'Rektörlük' : campus.searchName.replace(/\(MYO\)/g, 'Meslek Yüksekokulu');
        
        const cityStr = city ? `, ${city}` : '';
        
        // 1. Sadece MYO/Fakülte Adı + İl
        const q1 = `${targetName}${cityStr}`;
        
        // 2. Orijinal Üniversite Adı + MYO (Gerede MYO'yu bu bulur!)
        let q2 = `${origUni} ${targetName}`;
        if (campus.isMain) q2 = `${origUni} Merkez Kampüsü`;
        
        // 3. Temiz Üniversite Adı + MYO
        let q3 = `${cleanUni} ${targetName}`;
        if (campus.isMain) q3 = `${cleanUni} Merkez Kampüsü`;
        
        // 4. Sponsor İsimsiz
        const noSponsorName = removeSponsorsFromMYO(targetName);
        const q4 = `${noSponsorName}${cityStr}`;
        
        // 5. En Kötü İhtimalle Sadece İlçe Merkezi
        const extDist = extractDistrictFromName(targetName);
        const q5 = extDist ? `${extDist}${cityStr}` : null;

        let result = null;
        let queryUsed = '';

        try { result = await geocodeWithRetry(q1); queryUsed = 'Q1'; } catch(e) {}
        
        if (!result) { try { result = await geocodeWithRetry(q2); queryUsed = 'Q2'; } catch(e) {} }
        
        if (!result) { try { result = await geocodeWithRetry(q3); queryUsed = 'Q3'; } catch(e) {} }
        
        if (!result && noSponsorName !== targetName) {
            try { result = await geocodeWithRetry(q4); queryUsed = 'Q4'; } catch(e) {}
        }
        
        if (!result && q5 && !campus.isMain) {
            try { result = await geocodeWithRetry(q5); queryUsed = 'Q5 (İlçe Merkezi)'; } catch(e) {}
        }

        if (result) {
            campus.latitude = result.lat;
            campus.longitude = result.lng;
            campus.district = extDist || result.district;
            campus.address = result.address;
            campus.coordinateStatus = 'locationiq-exact';
            
            geocodedCount++;
            const tag = PREFERRED_TYPES.has(result.type) ? '🎯' : '📍';
            process.stdout.write(`${tag} [${i+1}/${allCampuses.length}] [${queryUsed}] BULUNDU: "${targetName}" -> (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})\n`);
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

    console.log('\n=== ÖSYM TABANLI KADEMELİ ÜRETİM (V4) SONUÇLARI ===');
    console.log(`🎯 Başarıyla Bulunan: ${geocodedCount}`);
    console.log(`❌ Bulunamayan: ${notFoundCount}`);
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
