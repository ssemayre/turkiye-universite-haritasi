/**
 * geocode-strict-districts-v2.cjs
 * =======================
 * Dış ilçe okullarını tam olarak kendi isimlerinden çıkarılan ilçelere bağlar.
 * Üniversite adını aramadan çıkarır (LocationIQ'nun kafasının karışmasını önler).
 */

const fs = require('fs');
const https = require('https');

const API_KEY = 'pk.5e9a5a23a461f4ebf1bbb758930a0a64';
const SLEEP_MS = 600;

const HARD_OVERRIDES = [
    { oldNameIncludes: 'KOCAELİ Yerleşkesi', newName: 'Kullar Yerleşkesi (Kocaeli MYO)', lat: 40.7303, lng: 29.9654, district: 'Başiskele', city: 'Kocaeli' },
    { oldNameIncludes: 'ALİ RIZA VEZİROĞLU', newName: 'Ali Rıza Veziroğlu Yerleşkesi (Körfez)', lat: 40.7712, lng: 29.7468, district: 'Körfez', city: 'Kocaeli' },
    { oldNameIncludes: 'Derbent Yerleşkesi', newName: 'Derbent Yerleşkesi (Turizm)', lat: 40.6974, lng: 30.1032, district: 'Kartepe', city: 'Kocaeli' },
    { oldNameIncludes: 'GAZANFER BİLGE', newName: 'Gazanfer Bilge Yerleşkesi (Karamürsel)', lat: 40.6865, lng: 29.6272, district: 'Karamürsel', city: 'Kocaeli' },
    { oldNameIncludes: 'Hereke', newName: 'Hereke Yerleşkesi', lat: 40.7891, lng: 29.6234, district: 'Körfez', city: 'Kocaeli' },
    { oldNameIncludes: 'Gölcük', newName: 'Gölcük Yerleşkesi', lat: 40.7161, lng: 29.8228, district: 'Gölcük', city: 'Kocaeli' },
    { oldNameIncludes: 'Kandıra', newName: 'Kandıra Yerleşkesi', lat: 41.0712, lng: 30.1501, district: 'Kandıra', city: 'Kocaeli' },
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isTurkey(lat, lng) {
    return lat >= 35.9 && lat <= 42.1 && lng >= 25.6 && lng <= 44.8;
}

// Okul adından ilçe ismini otomatik çıkaran Regex (Örn: "Finike Meslek Yüksekokulu" -> "Finike")
function extractDistrictFromName(name) {
    const match = name.match(/^([A-ZÇĞİÖŞÜa-zçğıöşü]+(?:\s[A-ZÇĞİÖŞÜa-zçğıöşü]+)?)\s+(Meslek Yüksekokulu|MYO|Fakültesi|Yerleşkesi|Kampüsü|Yüksekokulu|Enstitüsü|Sağlık|Turizm|Ziraat|Sosyal)/i);
    if (match) {
        const extracted = match[1].trim();
        // Eğer gereksiz bir kelime çıkarsa filtrele
        if (!['Uygulamalı', 'Meslek', 'Yüksekokul', 'Fakülte', 'Sağlık', 'Merkez'].includes(extracted)) {
            return extracted;
        }
    }
    // Regex tutmazsa, ismin ilk kelimesini al
    const firstWord = name.split(' ')[0].trim();
    if (firstWord.length > 3) return firstWord;
    return null;
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

const REJECTED_TYPES = new Set(['industrial', 'industrial_estate', 'farmland', 'forest', 'wood', 'residential', 'commercial']);
const PREFERRED_TYPES = new Set(['university', 'college', 'school', 'education', 'library', 'hospital']);

async function geocode(query, isDistrictFallback = false) {
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

        if (isDistrictFallback) {
            if (cls === 'boundary' || cls === 'place') {
                best = r;
                break;
            }
        } else {
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

async function main() {
    const campusesData = JSON.parse(fs.readFileSync('src/data/campuses.json', 'utf8'));

    // Durumları Sıfırla ve Override'ları Uygula
    for (const uni of Object.values(campusesData)) {
        for (const campus of (uni.campuses || [])) {
            for (const override of HARD_OVERRIDES) {
                if (campus.name.includes(override.oldNameIncludes)) {
                    campus.name = override.newName;
                    campus.latitude = override.lat;
                    campus.longitude = override.lng;
                    campus.district = override.district;
                    campus.city = override.city;
                    campus.coordinateStatus = 'exact-building';
                }
            }
            if (!['exact-building', 'osm-building'].includes(campus.coordinateStatus)) {
                campus.coordinateStatus = 'needs-geocode';
                // Yanlış atanmış olabilecek merkez ilçelerini sil
                campus.district = ''; 
            }
        }
    }

    const toGeocode = [];
    for (const uni of Object.values(campusesData)) {
        for (const campus of (uni.campuses || [])) {
            if (campus.coordinateStatus === 'needs-geocode') {
                toGeocode.push({ uni, campus });
            }
        }
    }

    console.log(`\nİlçe Odaklı (V2) Sorgulanacak Kampüs Sayısı: ${toGeocode.length}\n`);
    
    let exactCount = 0;
    let distFallbackCount = 0;
    let failCount = 0;

    for (let i = 0; i < toGeocode.length; i++) {
        const { uni, campus } = toGeocode[i];
        
        let realName = campus.name;
        if (campus.academicUnits && campus.academicUnits.length > 0) {
            realName = campus.academicUnits[0].name;
        }

        const cleanName = realName.replace(/\(MYO\)/g, 'Meslek Yüksekokulu').trim();
        const city = campus.city || uni.city || '';
        
        // 1. İsimden İlçeyi Çıkar
        const extractedDistrict = extractDistrictFromName(cleanName);
        if (extractedDistrict) {
            campus.district = extractedDistrict; // Doğrudan ilçeyi ez
        }

        // 2. Tam Okul Adı + Şehir (Üniversite Adı YOK)
        const q1 = `${cleanName}, ${city}, Türkiye`;
        
        // 3. Bulunamazsa Kendi İlçesinin Merkezi
        const q2 = extractedDistrict ? `${extractedDistrict}, ${city}, Türkiye` : null;
        
        let result = null;
        let isFallback = false;

        // Try Q1 (Exact Building)
        try { await sleep(SLEEP_MS); result = await geocode(q1, false); } catch(e) {}
        
        // Try Q2 (District Center Fallback)
        if (!result && q2) {
            try { 
                await sleep(SLEEP_MS); 
                result = await geocode(q2, true); 
                isFallback = true;
            } catch(e) {}
        }

        if (result) {
            campus.latitude = result.lat;
            campus.longitude = result.lng;
            campus.district = extractedDistrict || result.district || campus.district;
            campus.city = result.city || campus.city;
            campus.address = result.address;
            
            if (isFallback) {
                campus.coordinateStatus = 'district-fallback';
                distFallbackCount++;
                process.stdout.write(`⚠️ [${i+1}/${toGeocode.length}] İLÇE MERKEZİ: "${q2}" -> (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})\n`);
            } else {
                campus.coordinateStatus = 'locationiq-exact';
                exactCount++;
                const tag = PREFERRED_TYPES.has(result.type) ? '🎯' : '📍';
                process.stdout.write(`${tag} [${i+1}/${toGeocode.length}] BİNA BULUNDU: "${q1}" -> (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})\n`);
            }
        } else {
            failCount++;
            campus.coordinateStatus = 'not-found';
            process.stdout.write(`❌ [${i+1}/${toGeocode.length}] BULUNAMADI: "${q1}"\n`);
        }

        if ((i + 1) % 20 === 0) {
            fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));
        }
    }

    fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));

    console.log('\n=== YENİ SORGULAMA SONUÇLARI ===');
    console.log(`🎯 Doğrudan Kendi Binası/Arazisi Bulunan: ${exactCount}`);
    console.log(`⚠️ Binası Bulunamayıp KENDİ İLÇESİNE Atanan: ${distFallbackCount}`);
    console.log(`❌ Hiç Bulunamayan: ${failCount}`);
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
