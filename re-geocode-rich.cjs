/**
 * re-geocode-rich.cjs
 * =======================
 * Re-runs LocationIQ geocoding with RICH queries (University + Campus + City + Turkey).
 * Implements fallback to city/district center if building is not found.
 */

const fs = require('fs');
const https = require('https');

const API_KEY = 'pk.5e9a5a23a461f4ebf1bbb758930a0a64';
const SLEEP_MS = 600;

// Hard override for Kullar (Kocaeli MYO)
const HARD_OVERRIDES = [
    { 
        oldNameIncludes: 'KOCAELİ Yerleşkesi', 
        newName: 'Kullar Yerleşkesi (Kocaeli MYO)', 
        lat: 40.7303, 
        lng: 29.9654, 
        district: 'Başiskele', 
        city: 'Kocaeli', 
        address: 'Kullar Mahallesi, Başiskele, Kocaeli' 
    }
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isTurkey(lat, lng) {
    return lat >= 35.9 && lat <= 42.1 && lng >= 25.6 && lng <= 44.8;
}

function cleanQueryString(str) {
    if (!str) return '';
    return str
        .replace(/\(MYO\)/g, 'Meslek Yüksekokulu')
        .replace(/\s+/g, ' ')
        .trim();
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

const REJECTED_TYPES = new Set(['industrial', 'commercial', 'residential', 'retail', 'industrial_estate', 'farmland', 'forest', 'wood']);
const PREFERRED_TYPES = new Set(['university', 'college', 'school', 'education', 'library']);

async function geocode(query, isFallback = false) {
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

        // If this is the administrative center fallback query, we WANT boundary/place
        if (isFallback && (cls === 'boundary' || cls === 'place')) {
            best = r;
            break;
        }

        // Normal query processing
        if (!isFallback) {
            // Strict reject
            if (REJECTED_TYPES.has(type) || REJECTED_TYPES.has(cls)) continue;
            if (cls === 'boundary' || cls === 'place' || cls === 'highway') continue;

            // Preferred educational
            if (cls === 'amenity' && PREFERRED_TYPES.has(type)) {
                best = r;
                break;
            }

            // Save as backup if it's at least a building or amenity
            if (!backup && (cls === 'building' || cls === 'amenity')) {
                backup = r;
            }
        }
    }

    const finalMatch = best || backup;
    if (!finalMatch) return null;

    const lat = parseFloat(finalMatch.lat), lng = parseFloat(finalMatch.lon);
    const addr = finalMatch.address || {};
    const district = addr.district || addr.county || addr.town || addr.suburb || addr.city_district || '';
    const city = addr.province || addr.state || addr.city || '';
    const displayAddress = finalMatch.display_name;

    return { lat, lng, district, city, address: displayAddress, class: finalMatch.class, type: finalMatch.type };
}

async function main() {
    const campusesData = JSON.parse(fs.readFileSync('src/data/campuses.json', 'utf8'));

    // 1. Rename and Hard Override Kocaeli MYO
    for (const uni of Object.values(campusesData)) {
        for (const campus of (uni.campuses || [])) {
            for (const override of HARD_OVERRIDES) {
                if (campus.name.includes(override.oldNameIncludes)) {
                    campus.name = override.newName;
                    campus.latitude = override.lat;
                    campus.longitude = override.lng;
                    campus.district = override.district;
                    campus.city = override.city;
                    campus.address = override.address;
                    campus.coordinateStatus = 'exact-building';
                }
            }
            // Reset failed ones
            if (campus.coordinateStatus === 'locationiq-strict' || campus.coordinateStatus === 'not-found') {
                campus.coordinateStatus = 'needs-geocode';
            }
        }
    }

    const toGeocode = [];
    for (const uni of Object.values(campusesData)) {
        for (const campus of (uni.campuses || [])) {
            if (campus.coordinateStatus === 'exact-building' || campus.coordinateStatus === 'osm-building') continue;
            toGeocode.push({ uni, campus });
        }
    }

    console.log(`\nCampuses to RICH geocode: ${toGeocode.length}`);
    let successExactCount = 0, successFallbackCount = 0, failCount = 0;

    for (let i = 0; i < toGeocode.length; i++) {
        const { uni, campus } = toGeocode[i];

        let realName = campus.name;
        if (campus.academicUnits && campus.academicUnits.length > 0) {
            // First unit is usually the anchor for the campus
            realName = campus.academicUnits[0].name;
        }

        const cleanUni = cleanQueryString(uni.universityName);
        const cleanName = cleanQueryString(realName);
        const city = campus.city || uni.city || '';
        const district = campus.district || '';

        // Query Strategy:
        // 1. FULL QUERY: University + Specific Unit + City + Turkey
        const q1 = `${cleanUni} ${cleanName} ${city} Türkiye`;
        
        // 2. UNIT ONLY + CITY
        const q2 = `${cleanName} ${city} Türkiye`;
        
        // 3. FALLBACK: District/City Center
        const q3 = district ? `${district}, ${city}, Türkiye` : `${city}, Türkiye`;
        
        let result = null;
        let isFallbackMatch = false;

        // Try Q1
        try { await sleep(SLEEP_MS); result = await geocode(q1, false); } catch(e) {}
        
        // Try Q2 if Q1 fails
        if (!result) {
            try { await sleep(SLEEP_MS); result = await geocode(q2, false); } catch(e) {}
        }
        
        // Try Q3 (Admin Fallback) if Q2 fails
        if (!result && city) {
            try { 
                await sleep(SLEEP_MS); 
                result = await geocode(q3, true); 
                isFallbackMatch = true; 
            } catch(e) {}
        }

        if (result) {
            campus.latitude = result.lat;
            campus.longitude = result.lng;
            campus.district = result.district || campus.district;
            campus.city = result.city || campus.city;
            campus.address = result.address || campus.address;
            
            if (isFallbackMatch) {
                campus.coordinateStatus = 'locationiq-fallback';
                successFallbackCount++;
                process.stdout.write(`⚠️ [${i+1}/${toGeocode.length}] "${cleanName.substring(0, 30)}" → FALLBACK CENTER (${result.type})\n`);
            } else {
                campus.coordinateStatus = 'locationiq-rich';
                successExactCount++;
                const tag = PREFERRED_TYPES.has(result.type) ? '🎯' : '📍';
                process.stdout.write(`${tag} [${i+1}/${toGeocode.length}] "${cleanName.substring(0, 30)}" → ${result.type}\n`);
            }
        } else {
            failCount++;
            campus.coordinateStatus = 'not-found';
            process.stdout.write(`❌ [${i+1}/${toGeocode.length}] "${cleanName.substring(0, 30)}" → COMPLETELY NOT FOUND\n`);
        }

        if ((i + 1) % 25 === 0) {
            fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));
        }
    }

    fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));
    
    console.log('\n=== FINAL REPORT ===');
    console.log(`🎯 Exact matches (Building/Edu): ${successExactCount}`);
    console.log(`⚠️ Fallback to City Center: ${successFallbackCount}`);
    console.log(`❌ Completely Not found: ${failCount}`);
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
