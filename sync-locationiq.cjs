/**
 * sync-locationiq.cjs
 * ====================
 * LocationIQ Geocoding API ile campuses.json'u günceller.
 * - Sadece exact-building ve osm-building olmayan kampüsleri yeniden sorgular
 * - Rate limit: 600ms aralık
 * - Hard override: bilinen kritik Kocaeli birimleri
 * - "undefined" içeren adres/alan temizliği
 */

const fs = require('fs');
const https = require('https');

const API_KEY = 'pk.5e9a5a23a461f4ebf1bbb758930a0a64';
const SLEEP_MS = 600;

// ====================================================
// HARD OVERRIDES — API beklenmeden doğrudan yazılır
// ====================================================
const HARD_OVERRIDES = [
    { universityId: '1069', nameMatch: 'ALİ RIZA VEZİROĞLU', lat: 40.7712, lng: 29.7468, district: 'Körfez', city: 'Kocaeli', address: 'Körfez, Kocaeli' },
    { universityId: '1069', nameMatch: 'KOCAELİ Yerleşkesi (MYO)', lat: 40.7303, lng: 29.9654, district: 'Başiskele', city: 'Kocaeli', address: 'Kullar Mahallesi, Başiskele, Kocaeli' },
    { universityId: '1069', nameMatch: 'Derbent Yerleşkesi', lat: 40.6974, lng: 30.1032, district: 'Kartepe', city: 'Kocaeli', address: 'Derbent, Kartepe, Kocaeli' },
    { universityId: '1069', nameMatch: 'GAZANFER BİLGE', lat: 40.6865, lng: 29.6272, district: 'Karamürsel', city: 'Kocaeli', address: 'Karamürsel, Kocaeli' },
    { universityId: '1069', nameMatch: 'Hereke', lat: 40.7891, lng: 29.6234, district: 'Körfez', city: 'Kocaeli', address: 'Hereke, Körfez, Kocaeli' },
    { universityId: '1069', nameMatch: 'Gölcük', lat: 40.7161, lng: 29.8228, district: 'Gölcük', city: 'Kocaeli', address: 'Gölcük, Kocaeli' },
    { universityId: '1069', nameMatch: 'Kandıra', lat: 41.0712, lng: 30.1501, district: 'Kandıra', city: 'Kocaeli', address: 'Kandıra, Kocaeli' },
    { universityId: '1069', nameMatch: 'Umuttepe', lat: 40.8253, lng: 29.9181, district: 'İzmit', city: 'Kocaeli', address: 'Umuttepe, İzmit, Kocaeli' },
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isTurkey(lat, lng) {
    return lat >= 35.9 && lat <= 42.1 && lng >= 25.6 && lng <= 44.8;
}

function cleanAddress(str) {
    if (!str) return '';
    return str.split(',').map(s => s.trim()).filter(s => s && s !== 'undefined' && s !== 'null').join(', ');
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

async function geocode(query) {
    const url = `https://us1.locationiq.com/v1/search?key=${API_KEY}&q=${encodeURIComponent(query)}&format=json&countrycodes=tr&addressdetails=1&limit=5`;
    const results = await getJson(url);
    if (!Array.isArray(results) || results.length === 0) return null;

    // Pick the best result: prefer class=amenity type=college/university
    let best = null;
    for (const r of results) {
        const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
        if (!isTurkey(lat, lng)) continue;
        // Prefer university/college class
        if (!best) { best = r; continue; }
        const isEdu = (r.class === 'amenity' && (r.type === 'university' || r.type === 'college'));
        const prevIsEdu = (best.class === 'amenity' && (best.type === 'university' || best.type === 'college'));
        // Also reject administrative/boundary results
        if (r.class === 'boundary' || r.class === 'place') continue;
        if (isEdu && !prevIsEdu) { best = r; }
    }

    if (!best) return null;

    const lat = parseFloat(best.lat), lng = parseFloat(best.lon);
    if (!isTurkey(lat, lng)) return null;

    const addr = best.address || {};
    const district = addr.district || addr.county || addr.town || addr.suburb || addr.city_district || '';
    const city = addr.province || addr.state || addr.city || '';
    const displayAddress = cleanAddress(
        [addr.road || addr.house_number, addr.suburb || addr.neighbourhood, district, city].filter(Boolean).join(', ')
    ) || cleanAddress(best.display_name);

    return { lat, lng, district, city, address: displayAddress, class: best.class, type: best.type };
}

async function main() {
    const campusesData = JSON.parse(fs.readFileSync('src/data/campuses.json', 'utf8'));

    // 1. Apply hard overrides first
    let hardApplied = 0;
    for (const override of HARD_OVERRIDES) {
        for (const uni of Object.values(campusesData)) {
            if (override.universityId && uni.universityId !== override.universityId) continue;
            for (const campus of (uni.campuses || [])) {
                if (campus.name.toUpperCase().includes(override.nameMatch.toUpperCase())) {
                    campus.latitude = override.lat;
                    campus.longitude = override.lng;
                    campus.district = override.district;
                    campus.city = override.city;
                    campus.address = override.address;
                    campus.coordinateStatus = 'exact-building';
                    hardApplied++;
                    console.log(`[HARD] "${campus.name}" → (${override.lat}, ${override.lng})`);
                }
            }
        }
    }
    console.log(`\nHard overrides applied: ${hardApplied}`);

    // 2. Clean "undefined" in address/name fields for all campuses
    let cleanedCount = 0;
    for (const uni of Object.values(campusesData)) {
        for (const campus of (uni.campuses || [])) {
            if (campus.address && (campus.address.includes('undefined') || campus.address.includes('null'))) {
                campus.address = cleanAddress(campus.address);
                cleanedCount++;
            }
            if (campus.name && campus.name.includes('undefined')) {
                campus.name = campus.name.replace(/undefined/g, '').replace(/\s+/g, ' ').trim();
                cleanedCount++;
            }
        }
    }
    console.log(`"undefined" fields cleaned: ${cleanedCount}`);

    // 3. Collect campuses that need LocationIQ geocoding
    const toGeocode = [];
    for (const uni of Object.values(campusesData)) {
        for (const campus of (uni.campuses || [])) {
            if (campus.coordinateStatus === 'exact-building' || campus.coordinateStatus === 'osm-building') continue;
            toGeocode.push({ uni, campus });
        }
    }
    console.log(`\nCampuses to geocode via LocationIQ: ${toGeocode.length}`);
    console.log(`Estimated time: ${Math.ceil(toGeocode.length * SLEEP_MS / 60000)} minutes\n`);

    // 4. Geocode each campus
    let successCount = 0, failCount = 0, retryCount = 0;
    const SAVE_INTERVAL = 50; // Save progress every 50 requests

    for (let i = 0; i < toGeocode.length; i++) {
        const { uni, campus } = toGeocode[i];

        // Primary query: university name + campus name + city
        const city = campus.city || uni.city || '';
        const q1 = `${uni.universityName} ${campus.name.replace('Yerleşkesi', '').replace('(MYO)', 'Meslek Yüksekokulu').trim()}, ${city}, Türkiye`;
        // Fallback query: campus name + city only
        const q2 = `${campus.name.replace('Yerleşkesi', '').replace('(MYO)', 'Meslek Yüksekokulu').trim()}, ${city}, Türkiye`;

        let result = null;
        let attempts = 0;

        while (attempts < 3 && !result) {
            try {
                await sleep(SLEEP_MS);
                const query = attempts === 0 ? q1 : q2;
                result = await geocode(query);
                if (!result && attempts === 0) {
                    // Try fallback immediately (still need to sleep)
                    await sleep(SLEEP_MS);
                    result = await geocode(q2);
                    attempts++;
                }
            } catch (e) {
                if (e.message === 'RATE_LIMIT') {
                    console.log(`[RATE LIMIT] Waiting 2s... (attempt ${attempts + 1})`);
                    await sleep(2000);
                    retryCount++;
                } else {
                    console.log(`[ERROR] "${campus.name}": ${e.message}`);
                }
            }
            attempts++;
        }

        if (result) {
            campus.latitude = result.lat;
            campus.longitude = result.lng;
            campus.district = result.district || campus.district;
            campus.city = result.city || campus.city;
            campus.address = result.address || campus.address;
            campus.coordinateStatus = 'locationiq';
            successCount++;

            const isEdu = result.class === 'amenity';
            const tag = isEdu ? '🎯' : '📍';
            process.stdout.write(`${tag} [${i+1}/${toGeocode.length}] "${campus.name.substring(0, 35)}" → (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}) [${result.type}]\n`);
        } else {
            failCount++;
            process.stdout.write(`❌ [${i+1}/${toGeocode.length}] "${campus.name.substring(0, 50)}" → NOT FOUND\n`);
        }

        // Save progress periodically
        if ((i + 1) % SAVE_INTERVAL === 0) {
            fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));
            console.log(`  💾 Progress saved (${i+1}/${toGeocode.length})`);
        }
    }

    // Final save
    fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));

    console.log('\n=== FINAL REPORT ===');
    console.log(`✅ Geocoded successfully: ${successCount}`);
    console.log(`❌ Not found: ${failCount}`);
    console.log(`🔁 Rate limit retries: ${retryCount}`);
    console.log(`🔒 Hard overrides: ${hardApplied}`);
    console.log(`🧹 Cleaned "undefined" fields: ${cleanedCount}`);

    // Final status breakdown
    let withExact = 0, withOSM = 0, withLIQ = 0, other = 0, none = 0;
    for (const uni of Object.values(campusesData)) {
        for (const c of (uni.campuses || [])) {
            if (!c.latitude) { none++; continue; }
            if (c.coordinateStatus === 'exact-building') withExact++;
            else if (c.coordinateStatus === 'osm-building') withOSM++;
            else if (c.coordinateStatus === 'locationiq') withLIQ++;
            else other++;
        }
    }
    console.log('\n📊 Coordinate status breakdown:');
    console.log(`  🎯 exact-building (manual): ${withExact}`);
    console.log(`  🗺️  osm-building: ${withOSM}`);
    console.log(`  📍 locationiq: ${withLIQ}`);
    console.log(`  🔄 other (approx): ${other}`);
    console.log(`  ❌ no coordinates: ${none}`);
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
