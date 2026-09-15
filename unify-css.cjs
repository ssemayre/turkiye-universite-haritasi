const fs = require('fs');
let css = fs.readFileSync('src/App.css', 'utf8');

const marker = '/* MOBILE FIRST OVERRIDES FOR BOTTOM SHEETS & NAV */';
const markerIdx = css.indexOf(marker);

if (markerIdx !== -1) {
    css = css.substring(0, markerIdx);
}

const unifiedCss = `
/* ========================================================
   UNIFIED MOBILE APP UI (CLEAN REFACTOR)
   ======================================================== */
html, body, #root, .app {
  width: 100%;
  height: 100dvh;
  margin: 0;
  padding: 0;
  overflow: hidden !important;
  overscroll-behavior-y: none;
  background-color: #F8FAFC;
}

/* Remove 300ms tap delay and disable selection */
button, a, input, select, .touchable {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Fix iOS Safari auto-zoom */
input[type="text"], input[type="search"] {
  font-size: 16px !important;
}

/* Hide scrollbars */
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* 1. Header Kapsayıcı (Sabit ve Tek Parça) */
.header-unified {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 2000 !important;
  background: rgba(255, 255, 255, 0.94) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid rgba(0,0,0,0.08) !important;
  padding: max(12px, env(safe-area-inset-top)) 16px 12px 16px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  pointer-events: auto !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04) !important;
}

.header-unified .logo-row {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

.header-unified .logo-row h1 {
  font-size: 16px !important;
  font-weight: 700 !important;
  margin: 0 !important;
  color: #1e293b !important;
}

.header-unified .search-row input {
  width: 100% !important;
  height: 44px !important;
  border-radius: 12px !important;
  border: 1px solid #cbd5e1 !important;
  padding: 0 16px !important;
  background: #f1f5f9 !important;
  color: #334155 !important;
  outline: none !important;
}
.header-unified .search-row input:focus {
  border-color: #6366f1 !important;
  background: #fff !important;
}

.header-unified .filters-row {
  display: flex !important;
  gap: 8px !important;
  overflow-x: auto !important;
  padding-bottom: 2px !important;
}

/* Standartlaştırılmış Hap Butonlar */
.pill-btn {
  flex: 0 0 auto !important;
  padding: 6px 14px !important;
  border-radius: 9999px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  white-space: nowrap !important;
  border: 1px solid #e2e8f0 !important;
  background: #fff !important;
  color: #475569 !important;
  min-height: 36px !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  transition: all 0.2s ease !important;
}
.pill-btn.active {
  background: #6366f1 !important;
  color: #fff !important;
  border-color: #6366f1 !important;
}

/* 2. Harita Kapsayıcı (Ekrana Tam Oturan, Zemin) */
.map-area-unified {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 10 !important; /* En altta */
  height: 100dvh !important;
  width: 100vw !important;
}

/* Harita zoom kontrollerini üst çubuğun altında kalmayacak şekilde taşı */
.leaflet-control-zoom {
  position: absolute !important;
  top: 190px !important; /* Header yüksekliğini kurtaracak kadar */
  right: 12px !important;
  left: auto !important;
  bottom: auto !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  border-radius: 8px !important;
  overflow: hidden !important;
}

/* 3. Alt Menü (Footer) */
.mobile-bottom-bar {
  position: fixed !important;
  left: 16px !important;
  right: 16px !important;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px)) !important;
  height: 64px !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(0,0,0,0.08) !important;
  border-radius: 20px !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
  display: flex !important;
  justify-content: space-around !important;
  align-items: center !important;
  z-index: 2000 !important;
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s !important;
}

.mobile-bottom-bar.nav-hidden {
  transform: translateY(150px) !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

.mobile-bottom-bar button {
  background: transparent !important;
  border: none !important;
  color: #475569 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 4px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  min-height: 44px !important;
  padding: 4px 12px !important;
}

/* 4. Bottom Sheets (Detay Kartları) */
.program-detail,
.university-panel,
.kyk-detail,
.filter-panel,
.preference-drawer {
  position: fixed !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  margin: 0 !important;
  width: 100vw !important;
  max-width: 100vw !important;
  max-height: 85dvh !important;
  border-radius: 24px 24px 0 0 !important;
  z-index: 3000 !important; /* Header'dan da üstte çıksın isterseniz yüksek tutun */
  background: #fff !important;
  padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px)) !important;
  box-shadow: 0 -10px 40px rgba(0,0,0,0.15) !important;
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch !important;
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1) !important;
}

/* Drag handle */
.program-detail::before,
.university-panel::before,
.kyk-detail::before,
.filter-panel::before,
.preference-drawer::before {
  content: '';
  display: block;
  width: 36px;
  height: 5px;
  background: #cbd5e1;
  border-radius: 3px;
  margin: -12px auto 16px auto;
}

/* Hide legacy headers on mobile if they still exist in JSX */
@media (max-width: 800px) {
  .header:not(.header-unified) { display: none !important; }
  .modern-filters-bar { display: none !important; }
}
`;

fs.writeFileSync('src/App.css', css + '\n' + unifiedCss);
console.log('App.css successfully cleaned and unified!');
