const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(
    '<header className="university-panel-header">', 
    '<header className="university-panel-header" onPointerDown={startUniversitySheetDrag} onPointerMove={moveUniversitySheetDrag} onPointerUp={endUniversitySheetDrag} onPointerCancel={endUniversitySheetDrag} style={{ touchAction: "none" }}>'
);

app = app.replace(
    /<div\s+className="university-sheet-handle"[\s\S]*?\/>/,
    '<div className="university-sheet-handle" />'
);

fs.writeFileSync('src/App.jsx', app);
