const fs = require('fs');
let jsx = fs.readFileSync('src/App.jsx', 'utf8');

// Add the computed boolean
if (!jsx.includes('const isAnyModalOpen')) {
    jsx = jsx.replace('return (', 'const isAnyModalOpen = selectedUniversity || selectedProgram || selectedKyk || filtersOpen || selectedSubCampus || preferenceOpen || browseOpen || aboutOpen;\n\n  return (');
}

// Replace the nav class
jsx = jsx.replace('<nav className="mobile-bottom-bar">', '<nav className={`mobile-bottom-bar ${isAnyModalOpen ? \'nav-hidden\' : \'\'}`}>');

// Replace any small font size in search inputs to 16px to prevent zoom
jsx = jsx.replace(/fontSize:\s*['"]14px['"]/g, 'fontSize: "16px"');
jsx = jsx.replace(/fontSize:\s*['"]13px['"]/g, 'fontSize: "16px"');

// Delete manual handle div because we added it purely via CSS ::before
jsx = jsx.replace(/<div className="sheet-pull-handle-visual"><\/div>/g, '');

fs.writeFileSync('src/App.jsx', jsx);
console.log('App.jsx patched for mobile UI fixes');
