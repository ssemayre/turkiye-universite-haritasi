const fs = require('fs');

// 1. App.jsx: Strict boolean for isAnyModalOpen
let jsx = fs.readFileSync('src/App.jsx', 'utf8');
jsx = jsx.replace(
  /const isAnyModalOpen = .*/,
  'const isAnyModalOpen = (selectedUniversity !== null) || (selectedProgram !== null) || (selectedKyk !== null) || (filtersOpen === true) || (selectedSubCampus !== null) || (preferenceOpen === true) || (browseOpen === true) || (aboutOpen === true);'
);
fs.writeFileSync('src/App.jsx', jsx);

// 2. App.css: Enforce high z-index and pointer-events for Header, Filters, and Nav
let css = fs.readFileSync('src/App.css', 'utf8');

const guaranteedCss = `
/* ========================================================
   GUARANTEED VISIBILITY & Z-INDEX (USER REQUESTED)
   ======================================================== */

/* 1. Üst Arama Çubuğu (Header) */
.header {
  z-index: 1100 !important;
  pointer-events: auto !important;
  display: flex !important;
  opacity: 1 !important;
  visibility: visible !important;
}
.logo-area, .search-area, .header-actions {
  pointer-events: auto !important;
  z-index: 1101 !important;
}

/* 2. Filtre Butonları (Modern Filters Bar) */
.modern-filters-bar {
  position: relative !important; /* Haritanın üzerinde kalması için relative/absolute/fixed şart */
  z-index: 1100 !important;
  pointer-events: auto !important;
  display: flex !important;
  opacity: 1 !important;
  visibility: visible !important;
}

/* 3. Alt Navigasyon Çubuğu (Mobile Bottom Bar) */
.mobile-bottom-bar {
  z-index: 1100 !important;
  pointer-events: auto !important;
  display: flex !important;
  opacity: 1 !important;
  visibility: visible !important;
  /* Alt tarafa güvenli alan hesaplaması */
  bottom: calc(20px + env(safe-area-inset-bottom, 0px)) !important;
}

/* Modal açıkken alt navigasyonu gizle */
.mobile-bottom-bar.nav-hidden {
  transform: translateY(150px) !important;
  opacity: 0 !important;
  pointer-events: none !important;
  visibility: hidden !important;
}

/* 4. Harita Bileşeni (Map Container) */
.leaflet-container {
  z-index: 400 !important;
}
`;

fs.writeFileSync('src/App.css', css + '\n' + guaranteedCss);
console.log('Applied strict visibility and z-index fixes.');
