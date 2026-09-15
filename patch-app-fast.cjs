const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /const campuses = Array\.isArray\(record\?\.campuses\) \? record\.campuses : \[\];\s*if \(\!campuses\.length\) return null;/;

const replacement = `const campuses = Array.isArray(record?.campuses) ? record.campuses : [];
    if (!campuses.length) return null;

    // 0) Doğrudan campus_id eklenmişse (HIZLI EŞLEŞTİRME SİSTEMİ):
    if (program?.campus_id) {
       const exactCampus = campuses.find(c => c.id === program.campus_id);
       if (exactCampus) return { ...exactCampus, universityId: university.id, universityName: university.name };
    }`;

app = app.replace(regex, replacement);
fs.writeFileSync('src/App.jsx', app);
console.log("Injected fast path into findCampusForProgram");
