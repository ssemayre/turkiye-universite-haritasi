const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const filterIdx = app.indexOf('filter-panel');
if (filterIdx > -1) console.log(app.substring(filterIdx - 100, filterIdx + 500));

const pdIdx = app.indexOf('program-detail');
if (pdIdx > -1) console.log(app.substring(pdIdx - 100, pdIdx + 500));
