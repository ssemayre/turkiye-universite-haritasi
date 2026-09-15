const fs = require('fs');

const campusesData = JSON.parse(fs.readFileSync('src/data/campuses.json', 'utf8'));
const unis = JSON.parse(fs.readFileSync('src/data/universities.json', 'utf8'));

function normalize(str) {
    if (!str) return '';
    return str.toLocaleLowerCase('tr-TR').replace(/['"]/g, '').trim();
}

function getCampusGroupNames(campus) {
    let extraUnits = [];
    if (campus?.academicUnits) extraUnits = campus.academicUnits.map(u => u.name);
    return [
      ...(Array.isArray(campus?.facultyNames) ? campus.facultyNames : []),
      ...(Array.isArray(campus?.unitNames) ? campus.unitNames : []),
      ...(Array.isArray(campus?.unitAliases) ? campus.unitAliases : []),
      ...extraUnits
    ].map(n => normalize(n));
}

let totalPrograms = 0;
let unmatchedPrograms = 0;

const files = fs.readdirSync('public/programs').filter(f => f.endsWith('.json'));
for (let file of files) {
    let progs = JSON.parse(fs.readFileSync('public/programs/' + file, 'utf8'));
    let uniId = parseInt(file.replace('.json', ''));
    let uni = unis.find(u => u.id === uniId);
    if (!uni) continue;
    
    let key = normalize(uni.name);
    let uniCampuses = [];
    if (campusesData[key]) {
        uniCampuses = campusesData[key].campuses || [];
    }
    
    progs.forEach(p => {
        totalPrograms++;
        let fac = normalize(p.faculty || p.birimAdi || 'BİLİNMEYEN BİRİM');
        
        let matched = false;
        for (let c of uniCampuses) {
            if (getCampusGroupNames(c).includes(fac)) { matched = true; break; }
        }
        
        if (!matched) {
            for (let c of uniCampuses) {
                let cleanCampus = normalize(c.name).replace(' yerleşkesi', '').replace(' kampüsü', '').replace('myo', '').trim();
                let words = cleanCampus.split(' ').filter(w => w.length > 3);
                for (let w of words) {
                    if (fac.includes(w)) { matched = true; break; }
                }
                if (matched) break;
            }
        }
        
        if (!matched) unmatchedPrograms++;
    });
}
console.log('Total programs:', totalPrograms);
console.log('Unmatched:', unmatchedPrograms);
