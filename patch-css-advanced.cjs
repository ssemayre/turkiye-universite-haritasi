const fs = require('fs');
let appCss = fs.readFileSync('src/App.css', 'utf8');

const additionalStyles = `
/* MOBILE FIRST OVERRIDES FOR BOTTOM SHEETS & NAV */

.mobile-bottom-bar.nav-hidden {
  transform: translateY(150px) !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

.mobile-bottom-bar {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease !important;
  bottom: env(safe-area-inset-bottom, 20px) !important;
}

@media (max-width: 800px) {
  /* Hide scrollbar for the modern filters bar */
  .modern-filters-bar {
    display: flex !important;
    overflow-x: auto !important;
    white-space: nowrap !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
    padding-top: max(15px, env(safe-area-inset-top)) !important;
  }
  .modern-filters-bar::-webkit-scrollbar {
    display: none !important;
  }
  
  /* Reset filter buttons so they don't break lines */
  .modern-filters-bar button {
    flex: 0 0 auto !important;
  }
  
  /* Make sure bottom sheets cover from bottom edge */
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
    width: 100% !important;
    max-width: 100% !important;
    max-height: 85dvh !important;
    border-radius: 1.5rem 1.5rem 0 0 !important; /* rounded-t-3xl */
    z-index: 10050 !important;
    padding: 20px 20px calc(20px + env(safe-area-inset-bottom)) !important;
    box-sizing: border-box !important;
    -webkit-overflow-scrolling: touch !important;
    transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1) !important;
  }
  
  /* Drag handle specifically for mobile bottom sheets */
  .program-detail::before,
  .university-panel::before,
  .kyk-detail::before,
  .filter-panel::before,
  .preference-drawer::before {
    content: '';
    display: block;
    width: 36px;
    height: 5px;
    background-color: #cbd5e1;
    border-radius: 3px;
    margin: -10px auto 16px auto;
  }

  /* Make map zoom controls easier to reach */
  .leaflet-control-zoom {
    position: absolute !important;
    bottom: 90px !important; 
    right: 15px !important;
    top: auto !important;
    left: auto !important;
  }
  
  /* Touch friendly buttons */
  button, .open-university-button, .close-button {
    min-height: 44px !important;
    touch-action: manipulation !important;
  }
}

/* Typography Hierarchy Enhancements */
.detail-label {
  font-size: 11px !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b !important;
  font-weight: 700 !important;
  margin-bottom: 8px !important;
}

.program-detail h2,
.kyk-detail h2,
.university-panel h2 {
  font-size: 1.125rem !important; /* text-lg */
  font-weight: 600 !important; /* font-semibold */
  line-height: 1.3 !important;
  color: #0f172a !important;
  margin-top: 0 !important;
  margin-bottom: 12px !important;
}
`;

fs.writeFileSync('src/App.css', appCss + '\n' + additionalStyles);
console.log('App.css patched with advanced mobile UI rules');
