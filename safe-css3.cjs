const fs = require('fs');
let css = fs.readFileSync('src/App.css', 'utf8');

css = css.replace(
  /\.program-detail, \.filter-panel, \.browse-panel, \.preference-drawer \{\s*position: fixed !important;\s*top: 15vh !important;\s*bottom: 0 !important;\s*left: 0 !important;\s*right: 0 !important;\s*border-radius: 28px 28px 0 0 !important;\s*background: #fff !important;/g,
  '.program-detail, .filter-panel, .browse-panel, .preference-drawer {\n    position: fixed !important;\n    top: auto !important;\n    height: 65dvh !important;\n    bottom: 0 !important;\n    left: 0 !important;\n    right: 0 !important;\n    border-radius: 28px 28px 0 0 !important;\n    background: rgba(255, 255, 255, 0.85) !important;\n    backdrop-filter: blur(25px) !important;\n    -webkit-backdrop-filter: blur(25px) !important;'
);

css = css.replace(
  /\.university-panel \{\s*position: fixed !important;\s*left: 0 !important;\s*right: 0 !important;\s*bottom: 0 !important;\s*height: 100svh !important;\s*border-radius: 28px 28px 0 0 !important;\s*background: #fff !important;/g,
  '.university-panel {\n    position: fixed !important;\n    left: 0 !important;\n    right: 0 !important;\n    bottom: 0 !important;\n    height: 100svh !important;\n    border-radius: 28px 28px 0 0 !important;\n    background: rgba(255, 255, 255, 0.85) !important;\n    backdrop-filter: blur(25px) !important;\n    -webkit-backdrop-filter: blur(25px) !important;'
);

fs.writeFileSync('src/App.css', css);
