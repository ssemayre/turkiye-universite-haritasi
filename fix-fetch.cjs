const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(/`\/programs\/\$\{universityId\}\.json`/g, '`/programs/${universityId}.json?v=` + Date.now()');

fs.writeFileSync('src/App.jsx', app);
console.log('Cache-busting added securely!');
