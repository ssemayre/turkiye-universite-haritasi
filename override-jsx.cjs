const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(
  /<aside\s*className="university-panel"/g,
  '<aside className="university-panel">\n            <div className="sheet-pull-handle-visual"></div>'
);

app = app.replace(
  /<aside className="browse-panel">/g,
  '<aside className="browse-panel">\n            <div className="sheet-pull-handle-visual"></div>'
);

app = app.replace(
  /<aside className="filter-panel">/g,
  '<aside className="filter-panel">\n            <div className="sheet-pull-handle-visual"></div>'
);

app = app.replace(
  /<aside className="preference-drawer">/g,
  '<aside className="preference-drawer">\n            <div className="sheet-pull-handle-visual"></div>'
);

app = app.replace(
  /<aside className="program-detail">/g,
  '<aside className="program-detail">\n            <div className="sheet-pull-handle-visual"></div>'
);

fs.writeFileSync('src/App.jsx', app);
