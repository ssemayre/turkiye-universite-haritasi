const fs = require('fs');
let css = fs.readFileSync('src/App.css', 'utf8');

css = css.replace(
  '  .program-detail, .filter-panel, .browse-panel, .preference-drawer {\n    position: fixed !important;\n    top: 15vh !important;\n    bottom: 0 !important;\n    left: 0 !important;\n    right: 0 !important;\n    border-radius: 28px 28px 0 0 !important;\n    background: #fff !important;',
  '  .program-detail, .filter-panel, .browse-panel, .preference-drawer {\n    position: fixed !important;\n    top: auto !important;\n    bottom: 0 !important;\n    height: 65dvh !important;\n    left: 0 !important;\n    right: 0 !important;\n    border-radius: 28px 28px 0 0 !important;\n    background: rgba(255, 255, 255, 0.85) !important;\n    backdrop-filter: blur(25px) !important;\n    -webkit-backdrop-filter: blur(25px) !important;'
);

css = css.replace(
  '  .university-panel {\n    position: fixed !important;\n    left: 0 !important;\n    right: 0 !important;\n    bottom: 0 !important;\n    height: 100svh !important;\n    border-radius: 28px 28px 0 0 !important;\n    background: #fff !important;',
  '  .university-panel {\n    position: fixed !important;\n    left: 0 !important;\n    right: 0 !important;\n    bottom: 0 !important;\n    height: 100svh !important;\n    border-radius: 28px 28px 0 0 !important;\n    background: rgba(255, 255, 255, 0.85) !important;\n    backdrop-filter: blur(25px) !important;\n    -webkit-backdrop-filter: blur(25px) !important;'
);

fs.writeFileSync('src/App.css', css);
