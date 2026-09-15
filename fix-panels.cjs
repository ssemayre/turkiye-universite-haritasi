const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Fix university-panel-header
app = app.replace(
  /<div className="university-panel-header">/,
  '<div className="university-panel-header" onPointerDown={startUniversitySheetDrag} onPointerMove={moveUniversitySheetDrag} onPointerUp={endUniversitySheetDrag} onPointerCancel={endUniversitySheetDrag} style={{touchAction:"none"}}>'
);

// 2. Fix filter-header
app = app.replace(
  /<div className="filter-header">/,
  '<div className="filter-header" onPointerDown={startModalSwipe} onPointerMove={moveModalSwipe} onPointerUp={endModalSwipe} style={{touchAction:"none"}}>\n              <div className="sheet-pull-handle"></div>'
);

// 3. Fix program detail top section
const pdTop = `            <div className="detail-label">
              PROGRAM DETAYI
            </div>`;

const pdReplacement = `            <div className="program-detail-handle" onPointerDown={startModalSwipe} onPointerMove={moveModalSwipe} onPointerUp={endModalSwipe} style={{touchAction:"none", paddingBottom: "10px"}}>
              <div className="sheet-pull-handle"></div>
              <div className="detail-label">
                PROGRAM DETAYI
              </div>
            </div>`;

app = app.replace(pdTop, pdReplacement);

fs.writeFileSync('src/App.jsx', app);
