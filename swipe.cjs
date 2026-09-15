const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// We will add a global swipe down handler for full screen modals.
// If a user swipes down quickly on a modal header, it closes it.
const swipeLogic = `
  // Generic swipe to close for full-screen modals
  const swipeRef = useRef({ startY: 0, active: false });
  const startModalSwipe = (e) => {
    swipeRef.current = { startY: e.clientY || e.touches?.[0]?.clientY, active: true };
  };
  const moveModalSwipe = (e) => {
    if (!swipeRef.current.active) return;
    const y = e.clientY || e.touches?.[0]?.clientY;
    if (y - swipeRef.current.startY > 100) {
      // Swiped down! Close active modals
      setBrowseOpen(false);
      setFiltersOpen(false);
      setPreferenceOpen(false);
      setSelectedProgram(null);
      swipeRef.current.active = false;
    }
  };
  const endModalSwipe = () => { swipeRef.current.active = false; };
`;

// Insert the swipeLogic inside the component before `return`
app = app.replace('// ==================================================\n  // RETURN\n  // ==================================================', swipeLogic + '\n  // ==================================================\n  // RETURN\n  // ==================================================');

// Add the swipe handlers to the headers of the 4 modals
const attachTo = [
  { class: 'browse-panel-header', replacement: 'browse-panel-header" onPointerDown={startModalSwipe} onPointerMove={moveModalSwipe} onPointerUp={endModalSwipe} style={{touchAction:"none"}}' },
  { class: 'filters-header', replacement: 'filters-header" onPointerDown={startModalSwipe} onPointerMove={moveModalSwipe} onPointerUp={endModalSwipe} style={{touchAction:"none"}}' },
  { class: 'preference-header', replacement: 'preference-header" onPointerDown={startModalSwipe} onPointerMove={moveModalSwipe} onPointerUp={endModalSwipe} style={{touchAction:"none"}}' },
  { class: 'program-detail-header', replacement: 'program-detail-header" onPointerDown={startModalSwipe} onPointerMove={moveModalSwipe} onPointerUp={endModalSwipe} style={{touchAction:"none"}}' }
];

attachTo.forEach(item => {
  app = app.replace(new RegExp('className="' + item.class + '"', 'g'), 'className="' + item.replacement);
});

// Program detail doesn't have a header class, it's just <div className="detail-header-info"> inside <header>
// Let's attach to the <header> of program detail
app = app.replace(/<header>([\s\S]*?)<div className="detail-header-info">/g, '<header onPointerDown={startModalSwipe} onPointerMove={moveModalSwipe} onPointerUp={endModalSwipe} style={{touchAction:"none"}}>$1<div className="detail-header-info">');


fs.writeFileSync('src/App.jsx', app);
