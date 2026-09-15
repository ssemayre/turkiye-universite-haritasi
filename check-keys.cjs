const fs = require('fs');
const campusesData = JSON.parse(fs.readFileSync('src/data/campuses.json', 'utf8'));
const unis = JSON.parse(fs.readFileSync('src/data/universities.json', 'utf8'));

function normalize(str) {
    if (!str) return '';
    return str.toLocaleLowerCase('tr-TR').replace(/['"]/g, '').trim();
}

console.log('Uni 0 name:', unis[0].name, '->', normalize(unis[0].name));
console.log('Campuses keys:', Object.keys(campusesData).slice(0, 3));
