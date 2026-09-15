const fs = require('fs');

// Fix JSX
let jsx = fs.readFileSync('src/App.jsx', 'utf8');

// Ensure boolean coercion
jsx = jsx.replace(
  'const isAnyModalOpen = selectedUniversity || selectedProgram || selectedKyk || filtersOpen || selectedSubCampus || preferenceOpen || browseOpen || aboutOpen;',
  'const isAnyModalOpen = Boolean(selectedUniversity || selectedProgram || selectedKyk || filtersOpen || selectedSubCampus || preferenceOpen || browseOpen || aboutOpen);'
);

// Add position: relative and high z-index to modern filters bar so it sits on top of MapContainer
jsx = jsx.replace(
  '<div className="modern-filters-bar" style={{ display: \'flex\', gap: \'10px\', padding: \'15px 20px\', alignItems: \'center\', background: \'#fff\', borderBottom: \'1px solid #e0e0e0\', overflowX: \'auto\', zIndex: 10 }}>',
  '<div className="modern-filters-bar" style={{ position: \'relative\', display: \'flex\', gap: \'10px\', padding: \'15px 20px\', alignItems: \'center\', background: \'#fff\', borderBottom: \'1px solid #e0e0e0\', overflowX: \'auto\', zIndex: 2000 }}>'
);

fs.writeFileSync('src/App.jsx', jsx);

// Fix CSS
let css = fs.readFileSync('src/App.css', 'utf8');

const safetyCss = `
/* SAFETY Z-INDEX FIXES FOR MISSING UI */
.header {
  position: fixed !important;
  z-index: 10000 !important;
  pointer-events: none !important; /* let clicks pass through to map below it */
}

.logo-area, .search-area, .header-actions {
  pointer-events: auto !important; /* but keep these clickable */
  z-index: 10001 !important;
}

.modern-filters-bar {
  position: relative !important;
  z-index: 2000 !important;
  pointer-events: auto !important;
}

.mobile-bottom-bar {
  z-index: 10000 !important;
}
`;

fs.writeFileSync('src/App.css', css + '\n' + safetyCss);

console.log('Fixed z-index, visibility, and boolean conversion');
