const fs = require('fs');
const https = require('https');
const query = '[out:json][timeout:90];area["ISO3166-1"="TR"][admin_level="2"]->.searchArea;(way["amenity"="university"](area.searchArea);node["amenity"="university"](area.searchArea);relation["amenity"="university"](area.searchArea););out center;';

const options = {
  hostname: 'overpass-api.de',
  path: '/api/interpreter',
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
};
console.log('Overpass API ile OSM veritabanýndan üniversiteler çekiliyor...');
const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const elems = json.elements || [];
      console.log('Bulunan Kampüs/Bina Sayýsý: ' + elems.length);
      fs.writeFileSync('osm_universities.json', JSON.stringify(elems, null, 2));
    } catch(e) { console.error('Hata:', e); }
  });
});
req.write('data=' + encodeURIComponent(query));
req.end();
