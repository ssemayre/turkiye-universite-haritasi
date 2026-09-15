const fs = require('fs');
let appCss = fs.readFileSync('src/App.css', 'utf8');

// Replace all tiny font sizes for inputs with 16px to prevent iOS Safari auto-zoom
const extraStyles = `
/* Fix iOS Safari Auto-Zoom Bug */
input[type="text"], input[type="search"], .search-area > input {
  font-size: 16px !important;
}
`;

fs.writeFileSync('src/App.css', appCss + '\n' + extraStyles);
console.log('App.css patched for iOS Safari zoom bug');
