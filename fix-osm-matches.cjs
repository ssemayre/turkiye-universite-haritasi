/**
 * FIX-OSM-MATCHES.CJS
 * ====================
 * The previous script had false cross-university matches (e.g. "Batman Üniversitesi Merkez Yerleşkesi"
 * assigned to ALL universities' "Merkez Yerleşkesi" campuses).
 * 
 * This script re-applies Overpass data with STRICT university name matching:
 * - OSM building name MUST contain either the campus name words OR the university name words
 *   from the SAME university - not just generic words like "Merkez" or "Sağlık"
 */

const fs = require('fs');

const campusesData = JSON.parse(fs.readFileSync('src/data/campuses.json', 'utf8'));
const osmBuildings = JSON.parse(fs.readFileSync('osm-buildings-cache.json', 'utf8'));

console.log('OSM buildings in cache:', osmBuildings.length);

// ============================================================
// KNOWN EXACT COORDINATES (re-apply first - highest priority)
// ============================================================
const KNOWN_COORDS = [
    { nameMatch: 'KOCAELİ Yerleşkesi (MYO)',  universityId: '1069', lat: 40.7303, lng: 29.9654, address: 'Kullar Mahallesi, İzmit/Kocaeli' },
    { nameMatch: 'ALİ RIZA VEZİROĞLU',         universityId: '1069', lat: 40.7315, lng: 29.9640, address: 'Kullar, İzmit/Kocaeli' },
    { nameMatch: 'Derbent Yerleşkesi',          universityId: '1069', lat: 40.6974, lng: 30.1032, address: 'Derbent, Kartepe/Kocaeli' },
    { nameMatch: 'GAZANFER BİLGE',              universityId: '1069', lat: 40.6865, lng: 29.6272, address: 'Karamürsel/Kocaeli' },
    { nameMatch: 'Hereke',                      universityId: '1069', lat: 40.7891, lng: 29.6234, address: 'Hereke, Körfez/Kocaeli' },
    { nameMatch: 'Gölcük',                      universityId: '1069', lat: 40.7161, lng: 29.8228, address: 'Gölcük/Kocaeli' },
    { nameMatch: 'Kandıra',                     universityId: '1069', lat: 41.0712, lng: 30.1501, address: 'Kandıra/Kocaeli' },
];

function normalize(str) {
    return (str || '').toUpperCase()
        .replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ş/g, 'S')
        .replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ç/g, 'C')
        .replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

// Generic words that appear in MANY campus names and should not alone drive matching
const STOPWORDS = new Set([
    'MERKEZ', 'KAMPUSU', 'YERLESKE', 'MYO', 'FAKULTESI', 'YUKSEKOKULU',
    'BOLUMU', 'VE', 'BIR', 'ENSTITUSU', 'BILIMLERI', 'HIZMETLERI',
    'SAGLIK', 'SOSYAL', 'TEKNIK', 'EGITIM', 'VE', 'ILE', 'YA', 'BIRIM'
]);

function getSignificantWords(str) {
    return normalize(str).split(' ').filter(w => w.length > 3 && !STOPWORDS.has(w));
}

// Re-apply known coords
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
            }
        }
    }
}
console.log('Known exact coords re-applied:', knownApplied);

// Reset all OSM matches that were applied before (to re-run with strict algorithm)
let resetCount = 0;
for (const uni of Object.values(campusesData)) {
    for (const campus of (uni.campuses || [])) {
        if (campus.coordinateStatus === 'osm-building') {
            // Clear previous bad OSM match - keep the original pre-Overpass coordinate
            campus.coordinateStatus = 'needs-geocode';
            resetCount++;
        }
    }
}
console.log('Reset previous OSM matches:', resetCount);

// STRICT matching: university name must appear in OSM entry OR campus name words must be highly specific
let strictMatched = 0;
let skipped = 0;

for (const uni of Object.values(campusesData)) {
    const uniWords = getSignificantWords(uni.universityName);
    
    for (const campus of (uni.campuses || [])) {
        if (campus.coordinateStatus === 'exact-building') continue;
        
        const campusWords = getSignificantWords(campus.name);
        
        // Skip generic campuses with no significant distinguishing words
        if (campusWords.length === 0) {
            skipped++;
            continue;
        }
        
        let bestMatch = null;
        let bestScore = 0;
        
        for (const osm of osmBuildings) {
            const osmNorm = normalize(osm.name);
            const osmWords = osmNorm.split(' ').filter(w => w.length > 3);
            
            // STRICT RULE 1: OSM entry must contain at least 1 significant university word
            const uniWordInOSM = uniWords.filter(w => osmWords.includes(w)).length;
            
            // STRICT RULE 2: Count campus word matches in OSM name
            const campusWordMatches = campusWords.filter(w => osmWords.includes(w)).length;
            
            // Require: at least 1 university word AND at least 1 specific campus word in OSM
            if (uniWordInOSM < 1 || campusWordMatches < 1) continue;
            
            const score = uniWordInOSM * 15 + campusWordMatches * 10;
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = osm;
            }
        }
        
        if (bestMatch && bestScore >= 25) {
            campus.latitude = bestMatch.lat;
            campus.longitude = bestMatch.lng;
            campus.coordinateStatus = 'osm-building';
            campus.osmId = bestMatch.id;
            strictMatched++;
            console.log(`[STRICT MATCH ${bestScore}] "${campus.name}" [${uni.universityName.substring(0, 30)}]`);
            console.log(`  -> "${bestMatch.name}" (${bestMatch.lat.toFixed(4)}, ${bestMatch.lng.toFixed(4)})`);
        }
    }
}

// Stats
let withCoords = 0, withExact = 0, withOSM = 0, noCoords = 0;
for (const uni of Object.values(campusesData)) {
    for (const campus of (uni.campuses || [])) {
        if (!campus.latitude) { noCoords++; continue; }
        withCoords++;
        if (campus.coordinateStatus === 'exact-building') withExact++;
        else if (campus.coordinateStatus === 'osm-building') withOSM++;
    }
}

console.log('\n=== FINAL STATS ===');
console.log('Exact building coords (manual):', withExact);
console.log('OSM strict matches:', withOSM, '(new:', strictMatched, ')');
console.log('Total with coordinates:', withCoords);
console.log('No coordinates:', noCoords);
console.log('Skipped (no significant words):', skipped);

fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));
console.log('\ncampuses.json saved with strict OSM building coordinates.');
