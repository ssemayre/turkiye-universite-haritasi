const fs = require('fs');

const campusesData = JSON.parse(fs.readFileSync('src/data/campuses.json', 'utf8'));
const files = fs.readdirSync('public/programs').filter(f => f.endsWith('.json'));

const campusProgramsMap = {};

for (let file of files) {
    let progs = JSON.parse(fs.readFileSync('public/programs/' + file, 'utf8'));
    progs.forEach(p => {
        let cid = p.campus_id;
        if (!cid) return;
        
        let fac = (p.faculty || p.birimAdi || 'BİLİNMEYEN BİRİM').trim();
        let degree = (p.duration === "2" || p.duration === "1" ? 'Önlisans' : 'Lisans');
        
        let progObj = {
            name: (p.name || p.program || "Bilinmeyen Program").trim(),
            degree: degree,
            unitType: fac.toUpperCase().includes('MYO') || fac.toUpperCase().includes('MESLEK YÜKSEK') ? 'MYO' : 'Fakülte'
        };
        
        if (!campusProgramsMap[cid]) campusProgramsMap[cid] = {};
        if (!campusProgramsMap[cid][fac]) campusProgramsMap[cid][fac] = [];
        
        if (!campusProgramsMap[cid][fac].find(existing => existing.name === progObj.name)) {
             campusProgramsMap[cid][fac].push(progObj);
        }
    });
}

let matchedCampusCount = 0;
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
            matchedCampusCount++;
        } else {
            c.academicUnits = [];
        }
    });
}

fs.writeFileSync('src/data/campuses.json', JSON.stringify(campusesData, null, 2));

console.log(`Successfully mapped programs back to ${matchedCampusCount} campuses.`);
console.log(`Total unique programs embedded inside modals across Turkey: ${totalProgramsLinked}`);
