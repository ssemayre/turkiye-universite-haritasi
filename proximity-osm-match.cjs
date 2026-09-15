/**
 * PROXIMITY-FIRST OSM MATCHER
 * ===========================
 * For each campus that already has approximate coordinates:
 *   1. Find all OSM buildings within MAX_DIST_KM
 *   2. Among those, pick the one with the best name similarity
 *   3. Replace approximate coordinate with exact OSM building coordinate
 * 
 * This prevents cross-city / cross-university false matches.
 */

const fs = require('fs');

const campusesData = JSON.parse(fs.readFileSync('src/data/campuses.json', 'utf8'));
const osmBuildings = JSON.parse(fs.readFileSync('osm-buildings-cache.json', 'utf8'));

console.log('Campuses to process:', Object.values(campusesData).reduce((s, u) => s + (u.campuses || []).length, 0));
console.log('OSM buildings:', osmBuildings.length);

const MAX_DIST_KM = 2; // Only look at OSM buildings within 2km of the campus

// ============================================================
// KNOWN EXACT COORDINATES (highest priority - applied first)
// ============================================================
const KNOWN_COORDS = [
    { nameMatch: 'KOCAELİ Yerleşkesi (MYO)',  universityId: '1069', lat: 40.7303, lng: 29.9654, address: 'Kullar Mahallesi, İzmit/Kocaeli' },
    { nameMatch: 'ALİ RIZA VEZİROĞLU',         universityId: '1069', lat: 40.7315, lng: 29.9640, address: 'Kullar, İzmit/Kocaeli' },
    { nameMatch: 'Derbent Yerleşkesi',          universityId: '1069', lat: 40.6974, lng: 30.1032, address: 'Derbent, Kartepe/Kocaeli' },
    { nameMatch: 'GAZANFER BİLGE',              universityId: '1069', lat: 40.6865, lng: 29.6272, address: 'Karamürsel/Kocaeli' },
    { nameMatch: 'Hereke',                      universityId: '1069', lat: 40.7891, lng: 29.6234, address: 'Hereke, Körfez/Kocaeli' },
    { nameMatch: 'Gölcük',                      universityId: '1069', lat: 40.7161, lng: 29.8228, address: 'Gölcük/Kocaeli' },
    { nameMatch: 'Kandıra',                     universityId: '1069', lat: 41.0712, lng: 30.1501, address: 'Kandıra/Kocaeli' },
    { nameMatch: 'Umuttepe',                    universityId: '1069', lat: 40.8253, lng: 29.9181, address: 'Umuttepe, İzmit/Kocaeli' },
];

function haversineDist(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
              Math.sin(dLon/2)*Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function normalize(str) {
    return (str || '').toUpperCase()
        .replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ş/g, 'S')
        .replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ç/g, 'C')
        .replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

const STOPWORDS = new Set(['VE', 'BIR', 'ILE', 'BU', 'DA', 'DE', 'DEN', 'NIN']);

function significantWords(str) {
    return normalize(str).split(' ').filter(w => w.length > 3 && !STOPWORDS.has(w));
}

function nameSimilarity(a, b) {
    const wa = significantWords(a);
    const wb = significantWords(b);
    if (!wa.length || !wb.length) return 0;
    let matches = 0;
    for (const w of wa) { if (wb.includes(w)) matches++; }
    return matches / Math.max(wa.length, wb.length);
}

// Apply known exact coordinates
let knownApplied = 0;
for (const known of KNOWN_COORDS) {
    for (const uni of Object.values(campusesData)) {
        if (known.universityId && uni.universityId !== known.universityId) continue;
        for (const campus of (uni.campuses || [])) {
            if (campus.name.toUpperCase().includes(known.nameMatch.toUpperCase())) {
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
console.log(`\nKnown exact coords applied: ${knownApplied}`);

// Build spatial bucket index for fast OSM lookup
// Divide Turkey into 0.5° cells
const CELL_SIZE = 0.5;
const spatialIndex = new Map();

for (const osm of osmBuildings) {
    const cellLat = Math.floor(osm.lat / CELL_SIZE);
    const cellLng = Math.floor(osm.lng / CELL_SIZE);
    const key = `${cellLat}_${cellLng}`;
    if (!spatialIndex.has(key)) spatialIndex.set(key, []);
    spatialIndex.get(key).push(osm);
}

function getNearbyOSM(lat, lng, maxDistKm) {
    const results = [];
    const spread = Math.ceil(maxDistKm / (CELL_SIZE * 111));
    const cellLat = Math.floor(lat / CELL_SIZE);
    const cellLng = Math.floor(lng / CELL_SIZE);
    
    for (let dLat = -spread; dLat <= spread; dLat++) {
        for (let dLng = -spread; dLng <= spread; dLng++) {
            const key = `${cellLat + dLat}_${cellLng + dLng}`;
            const cell = spatialIndex.get(key) || [];
            for (const osm of cell) {
                const d = haversineDist(lat, lng, osm.lat, osm.lng);
                if (d <= maxDistKm) results.push({ ...osm, dist: d });
            }
        }
    }
    return results.sort((a, b) => a.dist - b.dist);
}

// Proximity-first matching
let osmMatched = 0;
let noNearby = 0;
let noNameMatch = 0;

for (const uni of Object.values(campusesData)) {
    for (const campus of (uni.campuses || [])) {
        if (campus.coordinateStatus === 'exact-building') continue;
        const lat = parseFloat(campus.latitude);
        const lng = parseFloat(campus.longitude);
        if (!lat || !lng) continue;
        
        const nearby = getNearbyOSM(lat, lng, MAX_DIST_KM);
        
        if (!nearby.length) {
            noNearby++;
            continue;
        }
        
        // Among nearby buildings, find the one with best name similarity
        let bestMatch = null;
        let bestSim = 0;
        let bestDist = Infinity;
        
        for (const osm of nearby) {
            // Try matching against both campus name and university name
            const simCampus = nameSimilarity(campus.name, osm.name);
            const simUni = nameSimilarity(uni.universityName, osm.name) * 0.5;
            const sim = simCampus + simUni;
            
            // Prefer higher similarity, then proximity
            if (sim > bestSim || (sim === bestSim && osm.dist < bestDist)) {
                bestSim = sim;
                bestDist = osm.dist;
                bestMatch = osm;
            }
        }
        
        // Only apply if similarity is meaningful (>0.3 = at least 30% word overlap)
        if (bestMatch && bestSim >= 0.3) {
            console.log(`[OSM ${bestDist.toFixed(0)}m sim=${bestSim.toFixed(2)}] "${campus.name}" → "${bestMatch.name}" (${bestMatch.lat.toFixed(4)}, ${bestMatch.lng.toFixed(4)})`);
            campus.latitude = bestMatch.lat;
            campus.longitude = bestMatch.lng;
            campus.coordinateStatus = 'osm-building';
            campus.osmId = bestMatch.id;
            osmMatched++;
        } else {
            noNameMatch++;
        }
    }
}

// Final stats
let withExact = 0, withOSM = 0, withOther = 0, noCoords = 0;
for (const uni of Object.values(campusesData)) {
    for (const campus of (uni.campuses || [])) {
        if (!campus.latitude) { noCoords++; continue; }
        if (campus.coordinateStatus === 'exact-building') withExact++;
        else if (campus.coordinateStatus === 'osm-building') withOSM++;
        else withOther++;
    }
}

console.log('\n=== FINAL STATS ===');
console.log('Exact building coords (manual):', withExact);
console.log('Refined via proximity-first OSM:', withOSM);
console.log('Kept original approx coords:', withOther);
console.log('No nearby OSM buildings:', noNearby);
console.log('No name match within radius:', noNameMatch);
console.log('No coordinates:', noCoords);

fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));
console.log('\ncampuses.json saved with proximity-first OSM building coordinates.');
