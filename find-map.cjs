const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');
const lines = app.split('\n');
const idx = lines.findIndex(l => l.includes('className="map-area"'));
if (idx > -1) {
  console.log(lines.slice(idx, idx + 40).join('\n'));
}
