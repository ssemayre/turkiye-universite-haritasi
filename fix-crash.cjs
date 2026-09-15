const fs = require('fs');
let jsx = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Remove the bad injection
const badString = 'const isAnyModalOpen = selectedUniversity || selectedProgram || selectedKyk || filtersOpen || selectedSubCampus || preferenceOpen || browseOpen || aboutOpen;\n\n  return (';
jsx = jsx.replace(badString, 'return (');

// 2. Find the main App component's return
const appReturnMarker = '    <div className={`app ${universityViewOpen ? "has-university-view" : ""} ${campusViewOpen ? "has-campus-view" : ""} ${aboutOpen ? "has-about-view" : ""} ${kykViewOpen ? "has-kyk-view" : ""}`}>';

const goodString = `
  const isAnyModalOpen = selectedUniversity || selectedProgram || selectedKyk || filtersOpen || selectedSubCampus || preferenceOpen || browseOpen || aboutOpen;

  return (
${appReturnMarker}`;

jsx = jsx.replace('  return (\n' + appReturnMarker, goodString);

fs.writeFileSync('src/App.jsx', jsx);
console.log('Fixed the white screen crash!');
