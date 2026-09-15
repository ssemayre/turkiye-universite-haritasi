/**
 * STEP 1: Apply known exact building coordinates for Kocaeli campuses
 * STEP 2: Fetch all Turkish university/college buildings from OSM Overpass API
 * STEP 3: Match fetched buildings to campus records by name similarity
 * STEP 4: Save updated campuses.json
 */

const fs = require('fs');
const https = require('https');

// ============================================================
// KNOWN EXACT COORDINATES (manually verified bina koordinatları)
// ============================================================
const KNOWN_COORDS = [
    // Kocaeli Üniversitesi
    { campusId: '1069-campus-7',   name: 'Kocaeli MYO',         lat: 40.7303, lng: 29.9654, address: 'Kullar Mahallesi, İzmit/Kocaeli' },
    { nameMatch: 'KOCAELİ Yerleşkesi (MYO)', universityId: '1069', lat: 40.7303, lng: 29.9654, address: 'Kullar Mahallesi, İzmit/Kocaeli' },
    { nameMatch: 'ALİ RIZA VEZİROĞLU',        universityId: '1069', lat: 40.7315, lng: 29.9640, address: 'Kullar, İzmit/Kocaeli' },
    { nameMatch: 'Derbent Yerleşkesi',         universityId: '1069', lat: 40.6974, lng: 30.1032, address: 'Derbent, Kartepe/Kocaeli' },
    { nameMatch: 'GAZANFER BİLGE',             universityId: '1069', lat: 40.6865, lng: 29.6272, address: 'Karamürsel/Kocaeli' },
    { nameMatch: 'Hereke',                     universityId: '1069', lat: 40.7891, lng: 29.6234, address: 'Hereke, Körfez/Kocaeli' },
    { nameMatch: 'Gölcük',                     universityId: '1069', lat: 40.7161, lng: 29.8228, address: 'Gölcük/Kocaeli' },
    { nameMatch: 'Kandıra',                    universityId: '1069', lat: 41.0712, lng: 30.1501, address: 'Kandıra/Kocaeli' },
];

const campusesData = JSON.parse(fs.readFileSync('src/data/campuses.json', 'utf8'));

// Apply known coordinates
let knownApplied = 0;
for (const known of KNOWN_COORDS) {
    for (const uni of Object.values(campusesData)) {
        if (known.universityId && uni.universityId !== known.universityId) continue;
        for (const campus of (uni.campuses || [])) {
            const matchById = known.campusId && campus.id === known.campusId;
            const matchByName = known.nameMatch && campus.name.toUpperCase().includes(known.nameMatch.toUpperCase());
            if (matchById || matchByName) {
                campus.latitude = known.lat;
                campus.longitude = known.lng;
                campus.address = known.address;
                campus.coordinateStatus = 'exact-building';
                knownApplied++;
                console.log(`[KNOWN] "${campus.name}" → (${known.lat}, ${known.lng})`);
            }
        }
    }
}
console.log(`\nKnown coordinates applied: ${knownApplied}`);

// ============================================================
// OVERPASS API: Fetch all university/college buildings in Turkey
// ============================================================
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const overpassQuery = `
[out:json][timeout:120];
(
  node["amenity"="university"](35.9,25.6,42.1,44.8);
  node["amenity"="college"](35.9,25.6,42.1,44.8);
  way["amenity"="university"](35.9,25.6,42.1,44.8);
  way["amenity"="college"](35.9,25.6,42.1,44.8);
  node["building"="university"](35.9,25.6,42.1,44.8);
  node["building"="college"](35.9,25.6,42.1,44.8);
  way["building"="university"](35.9,25.6,42.1,44.8);
  way["building"="college"](35.9,25.6,42.1,44.8);
);
out center;
`;

function normalize(str) {
    return (str || '').toUpperCase()
        .replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ş/g, 'S').replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ç/g, 'C')
        .replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function wordOverlap(a, b) {
    const wordsA = normalize(a).split(' ').filter(w => w.length > 3);
    const wordsB = normalize(b).split(' ').filter(w => w.length > 3);
    let matches = 0;
    for (const w of wordsA) {
        if (wordsB.includes(w)) matches++;
    }
    return matches;
}

function postRequest(url, data) {
    return new Promise((resolve, reject) => {
        const body = 'data=' + encodeURIComponent(data);
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body),
                'User-Agent': 'TurkiyeUniversiteHaritasi/1.0 (educational project)',
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('JSON parse error: ' + data.substring(0, 200))); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('\nFetching OSM Overpass data for Turkey universities...');
    
    let osmData;
    try {
        osmData = await postRequest(OVERPASS_URL, overpassQuery);
    } catch (e) {
        console.error('Overpass API error:', e.message);
        console.log('Skipping Overpass matching, saving with known coords only...');
        fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));
        console.log('campuses.json saved with known exact coordinates.');
        return;
    }
    
    const elements = osmData.elements || [];
    console.log(`Fetched ${elements.length} OSM buildings/nodes`);
    
    // Build OSM lookup: extract lat/lng for nodes and way centers
    const osmBuildings = [];
    for (const el of elements) {
        const name = el.tags && (el.tags['name'] || el.tags['name:tr'] || el.tags['alt_name']);
        if (!name) continue;
        let lat, lng;
        if (el.type === 'node') { lat = el.lat; lng = el.lon; }
        else if (el.type === 'way' && el.center) { lat = el.center.lat; lng = el.center.lon; }
        if (!lat || !lng) continue;
        osmBuildings.push({ name, lat, lng, id: el.id });
    }
    console.log(`OSM buildings with names: ${osmBuildings.length}`);
    
    // Save cache for inspection
    fs.writeFileSync('osm-buildings-cache.json', JSON.stringify(osmBuildings, null, 2));
    
    // Match each campus to OSM buildings
    let osmMatched = 0;
    let alreadyExact = 0;
    
    for (const uni of Object.values(campusesData)) {
        for (const campus of (uni.campuses || [])) {
            // Skip if already has exact building coordinate
            if (campus.coordinateStatus === 'exact-building') {
                alreadyExact++;
                continue;
            }
            
            // Try to match with OSM
            let bestMatch = null;
            let bestScore = 0;
            
            const campusNameNorm = normalize(campus.name);
            const uniNameNorm = normalize(uni.universityName);
            
            for (const osm of osmBuildings) {
                const osmNorm = normalize(osm.name);
                
                // Score: direct word overlap between campus name and OSM name
                const campusOverlap = wordOverlap(campus.name, osm.name);
                const uniOverlap = wordOverlap(uni.universityName, osm.name);
                
                // At least 2 words must match for campus name OR university name + 1 campus word
                const score = campusOverlap * 10 + uniOverlap * 3;
                
                if (campusOverlap >= 2 && score > bestScore) {
                    bestScore = score;
                    bestMatch = osm;
                }
            }
            
            if (bestMatch && bestScore >= 20) {
                campus.latitude = bestMatch.lat;
                campus.longitude = bestMatch.lng;
                campus.coordinateStatus = 'osm-building';
                campus.osmId = bestMatch.id;
                osmMatched++;
                console.log(`[OSM MATCH ${bestScore}] "${campus.name}" → "${bestMatch.name}" (${bestMatch.lat.toFixed(4)}, ${bestMatch.lng.toFixed(4)})`);
            }
        }
    }
    
    console.log(`\n=== OVERPASS RESULTS ===`);
    console.log(`Already had exact coords: ${alreadyExact}`);
    console.log(`Matched via OSM: ${osmMatched}`);
    
    // Save
    fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));
    console.log('campuses.json saved with exact building coordinates.');
}

main().catch(e => {
    console.error('Fatal error:', e);
    // Save whatever we have (known coords at least)
    fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));
    console.log('Saved partial results to campuses.json');
    process.exit(1);
});
