const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(
  /campusData\.forEach\(c => \{/g,
  'Object.values(campusData).flat().forEach(c => {'
);

fs.writeFileSync('src/App.jsx', app);
