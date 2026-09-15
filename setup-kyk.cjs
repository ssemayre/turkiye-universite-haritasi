const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(
  /import campusData from "\.\/data\/campuses\.json";/,
  'import campusData from "./data/campuses.json";\nimport kykData from "./data/kyk-yurtlari.json";'
);

const icons = `
const kykKizIcon = L.divIcon({
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
});

// Haversine distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = (lat2 - lat1) * (Math.PI / 180);
  var dLon = (lon2 - lon1) * (Math.PI / 180);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}
`;

app = app.replace(
  /const selectedUniversityIcon = new L\.Icon\(\{[\s\S]*?\}\);/,
  '$&\n' + icons
);

fs.writeFileSync('src/App.jsx', app);
