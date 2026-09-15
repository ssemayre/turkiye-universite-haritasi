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

app = app.replace(/(\s*return\s*\(\s*<div\s+className="app-container)/, '\n' + swipeLogic + '$1');

// Let's also attach to filters and program detail since they didn't match before
app = app.replace(
  /<div className="filters-header"(.*?)>/,
  '<div className="filters-header"$1 onPointerDown={startModalSwipe} onPointerMove={moveModalSwipe} onPointerUp={endModalSwipe} style={{touchAction:"none"}}>\n              <div className="sheet-pull-handle"></div>'
);

app = app.replace(
  /<header([^>]*)>([\s\S]*?)<div className="detail-header-info">/,
  '<header$1 onPointerDown={startModalSwipe} onPointerMove={moveModalSwipe} onPointerUp={endModalSwipe} style={{touchAction:"none"}}>\n              <div className="sheet-pull-handle"></div>$2<div className="detail-header-info">'
);

fs.writeFileSync('src/App.jsx', app);
