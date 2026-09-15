const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const oldIcons = `const kykKizIcon = L.divIcon({
  className: "kyk-marker kyk-kiz-marker",
  html: '<div class="kyk-marker-inner">👩‍🎓</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const kykErkekIcon = L.divIcon({
  className: "kyk-marker kyk-erkek-marker",
  html: '<div class="kyk-marker-inner">👨‍🎓</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});`;

const newIcons = `const kykKizIcon = L.divIcon({
  className: "kyk-marker kyk-kiz-marker",
  html: \`<div class="kyk-marker-inner" style="background:#ec4899; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(236,72,153,0.4); border: 2px solid white;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
  </div>\`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const kykErkekIcon = L.divIcon({
  className: "kyk-marker kyk-erkek-marker",
  html: \`<div class="kyk-marker-inner" style="background:#3b82f6; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(59,130,246,0.4); border: 2px solid white;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
  </div>\`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});`;

if (app.includes(oldIcons)) {
  app = app.replace(oldIcons, newIcons);
  fs.writeFileSync('src/App.jsx', app);
  console.log("Replaced Icons!");
} else {
  console.log("Could not find old icons exactly.");
}
