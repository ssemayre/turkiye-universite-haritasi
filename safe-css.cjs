const fs = require('fs');
let css = fs.readFileSync('src/App.css', 'utf8');

// Add glassmorphism
css = css.replace(
  /\.program-detail, \.filter-panel, \.browse-panel, \.preference-drawer \{\n    position: fixed !important;\n    top: 15vh !important;\n    bottom: 0 !important;/g,
  '.program-detail, .filter-panel, .browse-panel, .preference-drawer {\n    position: fixed !important;\n    top: auto !important;\n    bottom: 0 !important;\n    height: 65dvh !important;\n    background: rgba(255, 255, 255, 0.85) !important;\n    backdrop-filter: blur(25px) !important;\n    -webkit-backdrop-filter: blur(25px) !important;'
);

css = css.replace(
  /\.university-panel \{\n    position: fixed !important;/g,
  '.university-panel {\n    position: fixed !important;\n    background: rgba(255, 255, 255, 0.85) !important;\n    backdrop-filter: blur(25px) !important;\n    -webkit-backdrop-filter: blur(25px) !important;'
);

// Fix university drag handle
css = css.replace(
  /\.university-sheet-handle \{\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    height: 24px;\n    z-index: 10;\n    cursor: grab;\n  \}/g,
  '.university-sheet-handle {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    height: 36px;\n    z-index: 10;\n    cursor: grab;\n  }'
);

css += `\n
.sheet-pull-handle-visual {
  width: 40px;
  height: 5px;
  background: #CBD5E1;
  border-radius: 3px;
  margin: 10px auto 15px auto;
  display: block;
}
.university-sheet-handle::before {
  content: "";
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 5px;
  background: #CBD5E1;
  border-radius: 3px;
}
`;

fs.writeFileSync('src/App.css', css);
