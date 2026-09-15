const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');
app = app.replace(
  /<div className="sheet-pull-handle"[\s\S]*?<div style=\{\{width: "40px", height: "5px", background: "#CBD5E1", borderRadius: "3px"\}\}><\/div><\/div>/,
  '<div className="university-sheet-drag-area"\n              onPointerDown={startUniversitySheetDrag}\n              onPointerMove={moveUniversitySheetDrag}\n              onPointerUp={endUniversitySheetDrag}\n              onPointerCancel={endUniversitySheetDrag}\n              role="slider"\n              aria-label="Üniversite panelini yukarı veya aşağı taşı"\n              tabIndex={0}\n              style={{touchAction:"none", width: "100%", height: "30px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "grab"}}\n            >\n               <div className="sheet-pull-handle" style={{margin: 0}}></div>\n            </div>'
);
fs.writeFileSync('src/App.jsx', app);
