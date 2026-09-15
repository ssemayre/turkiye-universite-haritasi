const fs = require('fs');

// Add CSS
let css = fs.readFileSync('src/App.css', 'utf8');
const handleCss = '\n.sheet-pull-handle { width: 40px; height: 5px; background: #CBD5E1; border-radius: 3px; margin: 10px auto 15px auto; display: block; }\n';
if (!css.includes('.sheet-pull-handle')) {
    css += handleCss;
    fs.writeFileSync('src/App.css', css);
}

// Inject into App.jsx
let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(
  /<div className="browse-panel-header"(.*?)>/,
  '<div className="browse-panel-header"$1>\n              <div className="sheet-pull-handle"></div>'
);

app = app.replace(
  /<div className="filters-header"(.*?)>/,
  '<div className="filters-header"$1>\n              <div className="sheet-pull-handle"></div>'
);

app = app.replace(
  /<div className="preference-header"(.*?)>/,
  '<div className="preference-header"$1>\n              <div className="sheet-pull-handle"></div>'
);

app = app.replace(
  /<header(.*?)>([\s\S]*?)<div className="detail-header-info">/,
  '<header$1>\n              <div className="sheet-pull-handle"></div>$2<div className="detail-header-info">'
);

app = app.replace('<div className="university-sheet-handle" />', '<div className="sheet-pull-handle" style={{marginBottom: "10px"}}></div>');

fs.writeFileSync('src/App.jsx', app);
