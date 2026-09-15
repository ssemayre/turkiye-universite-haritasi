const fs = require('fs');
let css = fs.readFileSync('src/App.css', 'utf8');

css = css.replace(/\.program-detail, \.filter-panel, \.browse-panel, \.preference-drawer \{\n    position: fixed !important;\n    top: 15vh !important;\n    bottom: 0 !important;/g, '.program-detail, .filter-panel, .browse-panel, .preference-drawer {\n    position: fixed !important;\n    top: auto !important;\n    height: 65dvh !important;\n    bottom: 0 !important;');

css = css.replace(/\.program-detail \{\n    position: fixed !important;\n    top: 15vh !important;\n    bottom: 0 !important;/g, '.program-detail {\n    position: fixed !important;\n    top: auto !important;\n    height: 65dvh !important;\n    bottom: 0 !important;');

fs.writeFileSync('src/App.css', css);
