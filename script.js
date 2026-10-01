const fs = require('fs');
const file = 'src/App.jsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

let start = -1;
let end = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('PROFIL VE TERC')) {
        start = i;
    }
    if (start !== -1 && i > start && lines[i].includes('COMPARISON')) {
        end = i;
        break;
    }
}
console.log('Start:', start + 1);
console.log('End:', end + 1);
