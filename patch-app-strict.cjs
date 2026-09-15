const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Cache-busting
const oldFetch = "fetch(\n              `/programs/${universityId}.json`\n            );";
const newFetch = "fetch(\n              `/programs/${universityId}.json?v=` + Date.now()\n            );";
if (app.includes(oldFetch)) {
    app = app.replace(oldFetch, newFetch);
} else {
    // maybe it's on one line
    app = app.replace("fetch(`/programs/${universityId}.json`)", "fetch(`/programs/${universityId}.json?v=` + Date.now())");
}

// 2. Program detail UI fallback
const oldSmall = "<small>📍 {selectedCampus.name} · Haritada göster</small>";
const newSmall = "<small>📍 {selectedProgram.campus_name || selectedCampus.name || selectedProgram.faculty || \"Yerleşke Konumu Belirleniyor\"} · Haritada göster</small>";
if (app.includes(oldSmall)) {
    app = app.replace(oldSmall, newSmall);
}

// 3. Just to be totally sure, let's also update the tooltip title
const oldTitle = "title={`${selectedCampus.name} konumunu haritada göster`}";
const newTitle = "title={`${selectedProgram.campus_name || selectedCampus.name || selectedProgram.faculty} konumunu haritada göster`}";
if (app.includes(oldTitle)) {
    app = app.replace(oldTitle, newTitle);
}

fs.writeFileSync('src/App.jsx', app);
console.log("App.jsx patched for cache-busting and strict fallback UI");
