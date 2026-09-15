/**
 * geocode-smart.cjs
 * =======================
 * Akıllı Sorgu Formatı ve Ana Kampüs (Parent Fallback) Mimarisi.
 */

const fs = require('fs');
const https = require('https');

const API_KEY = 'pk.5e9a5a23a461f4ebf1bbb758930a0a64';
const SLEEP_MS = 600;

// Kocaeli için kesin doğrulanan nokta atışı (Hard Override)
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

// İzin verilen tam eğitim kurumu tipleri
const EDU_TYPES = new Set(['university', 'college', 'school', 'education', 'library', 'hospital']);

async function smartGeocode(query) {
    const url = `https://us1.locationiq.com/v1/search?key=${API_KEY}&q=${encodeURIComponent(query)}&format=json&countrycodes=tr&addressdetails=1&limit=5`;
    const results = await getJson(url);
    if (!Array.isArray(results) || results.length === 0) return null;

    for (const r of results) {
        const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
        if (!isTurkey(lat, lng)) continue;

        const type = r.type ? r.type.toLowerCase() : '';
        const cls = r.class ? r.class.toLowerCase() : '';

        // Sadece eğitim kurumu veya bina etiketli olanları kabul et (Rastgele boş arazi veya boundary RED)
        if ((cls === 'amenity' && EDU_TYPES.has(type)) || cls === 'building') {
            const addr = r.address || {};
            const district = addr.district || addr.county || addr.town || addr.suburb || '';
            const city = addr.province || addr.state || addr.city || '';
            
            return {
                lat, lng, district, city,
                address: r.display_name,
                type: r.type,
                class: r.class
            };
        }
    }
    return null; // Tam bina eşleşmesi bulunamadı
}

async function main() {
    const campusesData = JSON.parse(fs.readFileSync('src/data/campuses.json', 'utf8'));

    // 1. Manuel Override'ları uygula ve LocationIQ hatalı sonuçları sıfırla
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
            if (campus.coordinateStatus === 'locationiq' || campus.coordinateStatus === 'locationiq-fallback' || campus.coordinateStatus === 'not-found') {
                campus.coordinateStatus = 'needs-geocode';
            }
        }
    }

    // 2. Yeniden Geocode Edilecekleri Bul
    const toGeocode = [];
    for (const uni of Object.values(campusesData)) {
        const mainCampus = (uni.campuses || []).find(c => c.isMain) || (uni.campuses || [])[0];
        
        for (const campus of (uni.campuses || [])) {
            if (campus.coordinateStatus === 'exact-building' || campus.coordinateStatus === 'osm-building') continue;
            toGeocode.push({ uni, campus, mainCampus });
        }
    }

    console.log(`\nYeniden Tam İsimle Sorgulanacak Kampüs Sayısı: ${toGeocode.length}\n`);
    
    let successCount = 0;
    let fallbackCount = 0;

    for (let i = 0; i < toGeocode.length; i++) {
        const { uni, campus, mainCampus } = toGeocode[i];
        
        // Zengin Arama Sorgusu Kurulumu: Üniversite Adı + Kampüs Adı + Şehir + Türkiye
        // Örn: "Hakkari Üniversitesi Yüksekova Meslek Yüksekokulu Hakkari Türkiye"
        const city = campus.city || uni.city || '';
        const query = `${uni.universityName} ${campus.name} ${city} Türkiye`.replace(/\s+/g, ' ').trim();
        
        let result = null;
        let attempts = 0;

        while (attempts < 3 && !result) {
            try {
                await sleep(SLEEP_MS);
                result = await smartGeocode(query);
                break;
            } catch (e) {
                if (e.message === 'RATE_LIMIT') {
                    await sleep(2500); // 429 gelirse 2.5 sn bekle
                    attempts++;
                } else {
                    break;
                }
            }
        }

        if (result) {
            // BAŞARILI BİNA/OKUL EŞLEŞMESİ
            campus.latitude = result.lat;
            campus.longitude = result.lng;
            campus.district = result.district || campus.district;
            campus.city = result.city || campus.city;
            campus.address = result.address;
            campus.coordinateStatus = 'locationiq-smart';
            successCount++;
            
            // Logu kesmeden tam metin olarak göster
            process.stdout.write(`🎯 [${i+1}/${toGeocode.length}] BİNA BULUNDU: "${query}" -> (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})\n`);
        
        } else {
            // ANA KAMPÜS (PARENT CAMPUS) FALLBACK
            // Bulunamayan fakülteyi doğrudan Ana Kampüs'e (Rektörlük) bağla
            if (mainCampus && mainCampus.latitude && mainCampus.longitude) {
                campus.latitude = mainCampus.latitude;
                campus.longitude = mainCampus.longitude;
                campus.district = mainCampus.district || campus.district;
                campus.city = mainCampus.city || campus.city;
                campus.address = mainCampus.address || `${uni.universityName} Merkez Kampüsü`;
                campus.coordinateStatus = 'parent-fallback';
                fallbackCount++;
                
                process.stdout.write(`🔗 [${i+1}/${toGeocode.length}] ANA KAMPÜSE BAĞLANDI: "${query}" -> Merkez Kampüs Koordinatı\n`);
            } else {
                // Eğer ana kampüsün bile koordinatı yoksa (çok nadir)
                campus.coordinateStatus = 'unresolved';
                process.stdout.write(`❌ [${i+1}/${toGeocode.length}] ÇÖZÜLEMEDİ: "${query}"\n`);
            }
        }

        if ((i + 1) % 20 === 0) {
            fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));
        }
    }

    // Nihai kaydetme
    fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));

    console.log('\n=== AKILLI SORGULAMA SONUÇLARI ===');
    console.log(`🎯 Doğrudan Binası Bulunan (Nokta Atışı): ${successCount}`);
    console.log(`🔗 Ana Kampüse Bağlanan (Parent Fallback): ${fallbackCount}`);
    
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
