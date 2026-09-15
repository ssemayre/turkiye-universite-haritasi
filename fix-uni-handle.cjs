const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(
  /<div className="university-panel-header" onPointerDown={startUniversitySheetDrag} onPointerMove={moveUniversitySheetDrag} onPointerUp={endUniversitySheetDrag} onPointerCancel={endUniversitySheetDrag} style={{touchAction:"none"}}>/,
  '<div className="university-panel-header">'
);

app = app.replace(
  /<div className="sheet-pull-handle" style={{marginBottom: "10px"}}><\/div>/,
  '<div className="sheet-pull-handle"\n              onPointerDown={startUniversitySheetDrag}\n              onPointerMove={moveUniversitySheetDrag}\n              onPointerUp={endUniversitySheetDrag}\n              onPointerCancel={endUniversitySheetDrag}\n              role="slider"\n              aria-label="Üniversite panelini yukarı veya aşağı taşı"\n              tabIndex={0}\n              style={{touchAction:"none", marginBottom: "10px", width: "100%", height: "20px", display: "flex", justifyContent: "center", alignItems: "center"}}\n            ><div style={{width: "40px", height: "5px", background: "#CBD5E1", borderRadius: "3px"}}></div></div>'
);

fs.writeFileSync('src/App.jsx', app);
