const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// Filters panel
app = app.replace(
  '<div className="filters-header">',
  '<div className="filters-header" onPointerDown={startModalSwipe} onPointerMove={moveModalSwipe} onPointerUp={endModalSwipe} style={{touchAction:"none"}}>\n              <div className="sheet-pull-handle"></div>'
);

// Program detail
app = app.replace(
  '<header>\n\n              <div className="detail-header-info">',
  '<header onPointerDown={startModalSwipe} onPointerMove={moveModalSwipe} onPointerUp={endModalSwipe} style={{touchAction:"none"}}>\n              <div className="sheet-pull-handle"></div>\n\n              <div className="detail-header-info">'
);

// University panel header drag
app = app.replace(
  '<header className="university-panel-header">',
  '<header className="university-panel-header" onPointerDown={startUniversitySheetDrag} onPointerMove={moveUniversitySheetDrag} onPointerUp={endUniversitySheetDrag} onPointerCancel={endUniversitySheetDrag} style={{touchAction:"none"}}>'
);

fs.writeFileSync('src/App.jsx', app);
