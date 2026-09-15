const fs = require('fs');
let jsx = fs.readFileSync('src/App.jsx', 'utf8');

// The error is that isAnyModalOpen is NOT defined. Let's define it right before return (.
// Let's find the LAST 'return (' inside the App component.
// The easiest way is to look for the place where the main JSX is returned.
// Let's look for `<div className="app">`
const lines = jsx.split('\n');
const appDivIdx = lines.findIndex(l => l.includes('<div className="app">'));

if (appDivIdx !== -1) {
    // The line before `<div className="app">` should be `return (`
    // Let's inject `const isAnyModalOpen = ...` right before the `return (`
    let returnIdx = appDivIdx - 1;
    while(returnIdx > 0 && !lines[returnIdx].includes('return (')) {
        returnIdx--;
    }
    
    if (returnIdx > 0) {
        lines.splice(returnIdx, 0, '  const isAnyModalOpen = selectedUniversity || selectedProgram || selectedKyk || filtersOpen || selectedSubCampus || preferenceOpen || browseOpen || aboutOpen;');
        fs.writeFileSync('src/App.jsx', lines.join('\n'));
        console.log('Fixed: Injected isAnyModalOpen before main return');
    } else {
        console.log('Could not find main return');
    }
} else {
    console.log('Could not find <div className="app">');
}
