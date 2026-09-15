const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(/ onPointerDown=\{startModalSwipe\}.*?style=\{\{touchAction:"none"\}\}/g, '');

fs.writeFileSync('src/App.jsx', app);
