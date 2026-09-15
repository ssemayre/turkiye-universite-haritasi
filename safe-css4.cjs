const fs = require('fs');
let css = fs.readFileSync('src/App.css', 'utf8');

css = css.replace(
  /\.university-panel \{\s*position: fixed !important;\s*bottom: 0 !important;\s*border-radius: 28px 28px 0 0 !important;/g,
  '.university-panel {\n    position: fixed !important;\n    bottom: 0 !important;\n    border-radius: 28px 28px 0 0 !important;\n    background: rgba(255, 255, 255, 0.85) !important;\n    backdrop-filter: blur(25px) !important;\n    -webkit-backdrop-filter: blur(25px) !important;'
);

fs.writeFileSync('src/App.css', css);
