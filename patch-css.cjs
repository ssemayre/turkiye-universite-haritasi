const fs = require('fs');
let appCss = fs.readFileSync('src/App.css', 'utf8');
appCss = appCss.replace(/100vh/g, '100dvh');

const mobileStyles = `
/* Mobile-first enhancements */
html, body {
  overscroll-behavior-y: none;
}

.hide-scrollbar {
  -ms-overflow-style: none; 
  scrollbar-width: none; 
}
.hide-scrollbar::-webkit-scrollbar {
  display: none; 
}

button, a, input, select, .touchable {
  touch-action: manipulation;
}

/* Drag handle bar for bottom sheet */
.drag-handle {
  width: 36px;
  height: 5px;
  background-color: #cbd5e1;
  border-radius: 3px;
  margin: 10px auto 16px auto;
}
`;

if (!appCss.includes('hide-scrollbar')) {
    appCss += '\n' + mobileStyles;
}

fs.writeFileSync('src/App.css', appCss);
console.log('App.css updated with mobile-first CSS rules.');
