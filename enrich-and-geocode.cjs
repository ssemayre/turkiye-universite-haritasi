const fs = require('fs');
const https = require('https');

function geocode(query) {
    return new Promise((resolve) => {
        const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query + ' Türkiye');
        const req = https.get(url, { headers: { 'User-Agent': 'UniversiteHaritasi/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    let json = JSON.parse(data);
                    if (json && json.length > 0) resolve({ lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) });
                    else resolve(null);
                } catch(e) { resolve(null); }
            });
        });
        req.on('error', () => resolve(null));
    });
}

(async () => {
    const progs = JSON.parse(fs.readFileSync('src/data/programs-with-rank.json', 'utf8'));
    const campuses = JSON.parse(fs.readFileSync('src/data/campuses.json', 'utf8'));

    const uniProgs = {};
    progs.forEach(p => {
        let uni = (p.placementUniversityName || p.universityName || p.university || '').trim().toUpperCase();
        let fac = (p.faculty || 'BİLİNMEYEN BİRİM').trim().toUpperCase();
        if (!uniProgs[uni]) uniProgs[uni] = {};
        if (!uniProgs[uni][fac]) uniProgs[uni][fac] = [];
        
        let unitType = "Birim";
        if (fac.includes("MESLEK YÜKSEK")) unitType = "MYO";
        else if (fac.includes("YÜKSEKOKUL")) unitType = "Yüksekokul";
        else if (fac.includes("FAKÜLTE")) unitType = "Fakülte";
        else if (fac.includes("ENSTİTÜ")) unitType = "Enstitü";
        else if (fac.includes("KONSERVATUVAR")) unitType = "Konservatuvar";
        
        uniProgs[uni][fac].push({
           name: p.name ? p.name.trim() : '',
           degree: p.duration === "2" ? "Önlisans" : "Lisans",
           unitType: unitType
        });
    });

    for (let uniKey in campuses) {
        let uni = campuses[uniKey];
        let programsMap = uniProgs[(uni.universityName || '').toUpperCase()] || {};
        let unassignedFaculties = Object.keys(programsMap);
        
        uni.campuses.forEach(c => {
           c.academicUnits = [];
           let matchedFaculties = [];
           
           unassignedFaculties.forEach(fName => {
               let matched = false;
               if ((c.facultyNames && c.facultyNames.includes(fName)) || (c.unitNames && c.unitNames.includes(fName))) {
                   matched = true;
               }
               if (!matched) {
                   let cleanCampus = c.name.toUpperCase().replace(' YERLEŞKESİ', '').replace(' KAMPÜSÜ', '').replace('MYO', '').trim();
                   let words = cleanCampus.split(' ').filter(w => w.length > 3);
                   for (let w of words) {
                       if (fName.includes(w)) { matched = true; break; }
                   }
               }
               if (matched) {
                   matchedFaculties.push(fName);
                   c.academicUnits.push({
                       name: fName,
                       type: programsMap[fName][0]?.unitType || "Birim",
                       programs: programsMap[fName]
                   });
               }
           });
           unassignedFaculties = unassignedFaculties.filter(f => !matchedFaculties.includes(f));
        });
        
        // Handle unassigned by geocoding or assigning to main
        for (let fName of unassignedFaculties) {
            let campusName = fName;
            if (fName.includes("MESLEK YÜKSEKOKULU")) {
                 campusName = fName.replace("MESLEK YÜKSEKOKULU", "Yerleşkesi (MYO)").trim();
            } else {
                 campusName = fName + " Yerleşkesi";
            }
            
            // Try geocode based on the first word (usually the district) + city
            let districtCandidate = fName.split(' ')[0];
            let mainCampus = uni.campuses.find(c => c.isMain);
            
            let coords = null;
            if (districtCandidate.length > 3) {
                coords = await geocode(districtCandidate + ' ' + (mainCampus ? mainCampus.city || '' : ''));
            }
            
            if (!coords && mainCampus) {
                // offset slightly
                coords = { lat: mainCampus.latitude + (Math.random() * 0.01 - 0.005), lon: mainCampus.longitude + (Math.random() * 0.01 - 0.005) };
            }
            
            if (coords) {
                let newId = uni.universityId + "-campus-" + Math.floor(Math.random()*1000000);
                uni.campuses.push({
                   id: newId,
                   name: campusName,
                   universityId: uni.universityId,
                   universityName: uni.universityName,
                   city: mainCampus ? mainCampus.city : "Türkiye",
                   district: districtCandidate,
                   address: districtCandidate,
                   isMain: false,
                   autoGenerated: true,
                   latitude: coords.lat,
                   longitude: coords.lon,
                   academicUnits: [{
                       name: fName,
                       type: programsMap[fName][0]?.unitType || "Birim",
                       programs: programsMap[fName]
                   }]
                });
            }
            // Sleep slightly to not hammer Nominatim
            await new Promise(r => setTimeout(r, 200));
        }
    }

    fs.writeFileSync('src/data/campuses.json', JSON.stringify(campuses, null, 2));
    console.log("Successfully enriched campuses!");
})();
