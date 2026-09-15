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
      if (selectedProgram) {
        setSelectedProgram(null);
      }
      swipeRef.current.active = false;
    }
  };
  const endModalSwipe = () => { swipeRef.current.active = false; };
`;

// Inject into App component
app = app.replace(
  'export default function App() {',
  'export default function App() {\n' + swipeLogic
);

fs.writeFileSync('src/App.jsx', app);
