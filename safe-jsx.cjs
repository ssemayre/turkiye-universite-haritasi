const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(
  /<div className="browse-panel-header">/g,
  '<div className="browse-panel-header">\n              <div className="sheet-pull-handle-visual"></div>'
);

app = app.replace(
  /<div className="filter-header">/g,
  '<div className="filter-header">\n              <div className="sheet-pull-handle-visual"></div>'
);

app = app.replace(
  /<div className="preference-header">/g,
  '<div className="preference-header">\n              <div className="sheet-pull-handle-visual"></div>'
);

app = app.replace(
  /<div className="detail-label">\s*PROGRAM DETAYI\s*<\/div>/g,
  '<div className="sheet-pull-handle-visual"></div>\n            <div className="detail-label">\n              PROGRAM DETAYI\n            </div>'
);

fs.writeFileSync('src/App.jsx', app);
