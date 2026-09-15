const fs = require('fs');

const campusesData = JSON.parse(fs.readFileSync('src/data/campuses.json', 'utf8'));
const files = fs.readdirSync('public/programs').filter(f => f.endsWith('.json'));

function normalize(str) {
    if (!str) return '';
    return str.toLocaleLowerCase('tr-TR').replace(/['"]/g, '').trim();
}

function calculateScore(facName, campus) {
    let score = 0;
    let facWords = facName.toUpperCase().split(' ').filter(w => w.length > 2 && w !== 'MYO' && w !== 'MESLEK' && w !== 'YÜKSEKOKULU' && w !== 'FAKÜLTESİ' && w !== 'BİLİMLERİ' && w !== 'VE');
    
    let cleanCampusName = campus.name.replace(/\(MYO\)/gi, '').trim();
    let cNameWords = cleanCampusName.toUpperCase().split(' ').filter(w => w.length > 2 && w !== 'YERLEŞKESİ' && w !== 'KAMPÜSÜ' && w !== 'MYO');
    let addressWords = (campus.address || '').toUpperCase().split(/[\s,/]+/).filter(w => w.length > 2);
    
    let allCampusKeywords = [...cNameWords];
    (campus.facultyNames || []).forEach(f => {
       allCampusKeywords.push(...f.toUpperCase().split(' ').filter(w => w.length > 2 && w !== 'MYO' && w !== 'FAKÜLTESİ' && w !== 'MESLEK' && w !== 'YÜKSEKOKULU' && w !== 'BİLİMLERİ' && w !== 'VE'));
    });
    
    for (let w of facWords) {
        if (cNameWords.includes(w)) { score += 10; }
        else if (allCampusKeywords.includes(w)) { score += 5; }
        else if (addressWords.includes(w)) { score += 3; }
    }
    
    // Penalty
    for (let cw of cNameWords) {
        if (cw !== 'ÜNİVERSİTESİ' && !facWords.includes(cw) && !addressWords.includes(cw)) {
             score -= 2;
        }
    }
    
    return score;
}

let programsMatched = 0;
const campusProgramsMap = {};

for (let file of files) {
    let progs = JSON.parse(fs.readFileSync('public/programs/' + file, 'utf8'));
    let uniId = parseInt(file.replace('.json', ''));
    let uniRef = Object.values(campusesData).find(u => u.universityId == uniId);
    if (!uniRef) continue;
    
    let uniCampuses = uniRef.campuses || [];
    let isModified = false;
    
    progs.forEach(p => {
        let rawFac = (p.faculty || p.birimAdi || 'BİLİNMEYEN BİRİM').trim();
        let fac = normalize(rawFac);
        
        let bestCampus = null;
        let bestScore = -999;
        
        for (let c of uniCampuses) {
            let groupNames = [
              ...(Array.isArray(c.facultyNames) ? c.facultyNames : []),
              ...(Array.isArray(c.unitNames) ? c.unitNames : []),
              ...(Array.isArray(c.unitAliases) ? c.unitAliases : []),
            ].map(n => normalize(n));
            
            if (groupNames.includes(fac)) {
                bestCampus = c;
                bestScore = 999;
                break;
            }
        }
        
        if (!bestCampus) {
            for (let c of uniCampuses) {
                let score = calculateScore(rawFac, c);
                let cleanCampus = normalize(c.name).replace(' yerleşkesi', '').replace(' kampüsü', '').replace('myo', '').replace('(myo)', '').trim();
                
                if (fac === cleanCampus || fac.includes(cleanCampus)) {
                     score += 50;
                }
                
                if (score > bestScore && score > 0) {
                    bestScore = score;
                    bestCampus = c;
                }
            }
        }
        
        if (!bestCampus) {
            bestCampus = uniCampuses.find(c => c.isMain) || uniCampuses[0];
        }
        
        if (bestCampus) {
            if (p.campus_id !== bestCampus.id || p.campus_name !== bestCampus.name) {
                p.campus_id = bestCampus.id;
                p.campus_name = bestCampus.name;
                isModified = true;
            }
            programsMatched++;
            
            let cid = bestCampus.id;
            let degree = (p.duration === "2" || p.duration === "1" ? 'Önlisans' : 'Lisans');
            let progObj = {
                name: (p.name || p.program || "Bilinmeyen Program").trim(),
                degree: degree,
                unitType: rawFac.toUpperCase().includes('MYO') || rawFac.toUpperCase().includes('MESLEK YÜKSEK') ? 'MYO' : 'Fakülte'
            };
            
            if (!campusProgramsMap[cid]) campusProgramsMap[cid] = {};
            if (!campusProgramsMap[cid][rawFac]) campusProgramsMap[cid][rawFac] = [];
            if (!campusProgramsMap[cid][rawFac].find(existing => existing.name === progObj.name)) {
                 campusProgramsMap[cid][rawFac].push(progObj);
            }
        }
    });
    
    if (isModified) {
        fs.writeFileSync('public/programs/' + file, JSON.stringify(progs, null, 2));
    }
}

let totalProgramsLinked = 0;
for (let uni of Object.values(campusesData)) {
    (uni.campuses || []).forEach(c => {
        let facMap = campusProgramsMap[c.id];
        if (facMap) {
            let newUnits = [];
            for (let facName in facMap) {
                newUnits.push({
                    name: facName,
                    type: facName.toUpperCase().includes('MYO') || facName.toUpperCase().includes('MESLEK YÜKSEK') ? 'MYO' : 'Fakülte',
                    programs: facMap[facName]
                });
                totalProgramsLinked += facMap[facName].length;
            }
            newUnits.sort((a, b) => a.type.localeCompare(b.type));
            c.academicUnits = newUnits;
        } else {
            c.academicUnits = [];
        }
    });
}

fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));

console.log(`Bütün Türkiye çapında ${programsMatched} program kendi en iyi yerleşkesine puanlama sistemiyle (score) eşlendi.`);
console.log(`Detay kartlarında (modal) toplam ${totalProgramsLinked} unique bölüm görünür hale getirildi.`);
