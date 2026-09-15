const fs = require('fs');
let css = fs.readFileSync('src/App.css', 'utf8');

css += `

/* ================================================== */
/* FIXES FOR POP-ITS AND GLASSMORPHISM (APPENDED) */
/* ================================================== */

@media (max-width: 800px) {
  .program-detail, .filter-panel, .browse-panel, .preference-drawer {
    position: fixed !important;
    top: auto !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 65dvh !important;
    border-radius: 28px 28px 0 0 !important;
    background: rgba(255, 255, 255, 0.85) !important;
    backdrop-filter: blur(25px) !important;
    -webkit-backdrop-filter: blur(25px) !important;
    z-index: 10000 !important;
    box-shadow: 0 -10px 40px rgba(0,0,0,0.2) !important;
    padding-bottom: 100px !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  .university-panel {
    background: rgba(255, 255, 255, 0.85) !important;
    backdrop-filter: blur(25px) !important;
    -webkit-backdrop-filter: blur(25px) !important;
  }

  .university-panel .university-sheet-handle::before,
  .university-panel .university-sheet-handle::after {
    display: none !important;
  }

  .university-panel .university-sheet-handle {
    height: 36px !important;
    width: 100% !important;
    left: 0 !important;
    transform: none !important;
    background: transparent !important;
  }

  .sheet-pull-handle-visual {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 5px;
    background: #CBD5E1;
    border-radius: 3px;
    display: block;
    pointer-events: none;
    z-index: 9999;
  }
}
`;

fs.writeFileSync('src/App.css', css);
