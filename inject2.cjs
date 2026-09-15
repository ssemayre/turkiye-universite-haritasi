const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const swipeLogic = `
  // Generic swipe to close for full-screen modals
  const swipeRef = useRef({ startY: 0, active: false });
  const startModalSwipe = (e) => {
    swipeRef.current = { startY: e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0), active: true };
  };
  const moveModalSwipe = (e) => {
    if (!swipeRef.current.active) return;
    const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    if (y - swipeRef.current.startY > 100) {
      setBrowseOpen(false);
      setFiltersOpen(false);
      setPreferenceOpen(false);
      setSelectedProgram(null);
      swipeRef.current.active = false;
    }
  };
  const endModalSwipe = () => { swipeRef.current.active = false; };
`;

if (!app.includes('startModalSwipe')) {
    app = app.replace(/\s*return \(\s*<div className="app-container/, '\n' + swipeLogic + '\n  return (\n    <div className="app-container');
}

if (!app.includes('className="filters-header" onPointerDown')) {
    app = app.replace(
      /<div className="filters-header">/,
      '<div className="filters-header" onPointerDown={startModalSwipe} onPointerMove={moveModalSwipe} onPointerUp={endModalSwipe} style={{touchAction:"none"}}>\n              <div className="sheet-pull-handle"></div>'
    );
}

if (!app.includes('<header onPointerDown')) {
    app = app.replace(
      /<header>\s*<div className="detail-header-info">/,
      '<header onPointerDown={startModalSwipe} onPointerMove={moveModalSwipe} onPointerUp={endModalSwipe} style={{touchAction:"none"}}>\n              <div className="sheet-pull-handle"></div>\n              <div className="detail-header-info">'
    );
}

if (!app.includes('<header className="university-panel-header" onPointerDown')) {
    app = app.replace(
      /<header className="university-panel-header">/,
      '<header className="university-panel-header" onPointerDown={startUniversitySheetDrag} onPointerMove={moveUniversitySheetDrag} onPointerUp={endUniversitySheetDrag} onPointerCancel={endUniversitySheetDrag} style={{touchAction:"none"}}>'
    );
}

fs.writeFileSync('src/App.jsx', app);
