const https = require('https');
const fs = require('fs');

const query = `
[out:json][timeout:90];
area["name"="Türkiye"]->.searchArea;
(
  node["amenity"="dormitory"](area.searchArea);
  way["amenity"="dormitory"](area.searchArea);
  relation["amenity"="dormitory"](area.searchArea);
  
  node["building"="dormitory"](area.searchArea);
  way["building"="dormitory"](area.searchArea);
  relation["building"="dormitory"](area.searchArea);

  node["amenity"="student_accommodation"](area.searchArea);
  way["amenity"="student_accommodation"](area.searchArea);
  relation["amenity"="student_accommodation"](area.searchArea);
);
out center;
`;

const postData = 'data=' + encodeURIComponent(query);

const options = {
  hostname: 'overpass-api.de',
  path: '/api/interpreter',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'UniversiteHaritasi/1.0'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const elements = json.elements || [];
      
      let formattedDorms = [];
      let idCounter = 1;
      
      let seenCoords = new Set();

      elements.forEach(el => {
        let name = "Bilinmeyen Yurt";
        let city = "Türkiye";
        let district = "";
        let address = "";
        
        if (el.tags) {
          if (el.tags.name) name = el.tags.name;
          if (el.tags['addr:province']) city = el.tags['addr:province'];
          else if (el.tags['addr:city']) city = el.tags['addr:city'];
          
          if (el.tags['addr:district']) district = el.tags['addr:district'];
          
          if (el.tags['addr:street']) address += el.tags['addr:street'] + " ";
          if (el.tags['addr:housenumber']) address += el.tags['addr:housenumber'];
        }

        if (name === "Bilinmeyen Yurt") {
            if (el.tags && el.tags.operator) {
                name = el.tags.operator + " Yurdu";
            }
        }
        name = name.trim();
        
        let gender = "Karma";
        const lowerName = name.toLowerCase();
        if (lowerName.includes(" kız ") || lowerName.includes("kız ") || lowerName.includes(" kız") || lowerName.includes("kızlar")) {
          gender = "Kız";
        } else if (lowerName.includes(" erkek ") || lowerName.includes("erkek ") || lowerName.includes(" erkek") || lowerName.includes("erkekler")) {
          gender = "Erkek";
        }

        let lat = el.lat;
        let lon = el.lon;
        
        if (!lat && el.center) {
          lat = el.center.lat;
          lon = el.center.lon;
        }

        if (lat && lon) {
          // Avoid duplicates
          const coordKey = lat.toFixed(4) + "," + lon.toFixed(4);
          if (!seenCoords.has(coordKey) && name !== "Bilinmeyen Yurt") {
             seenCoords.add(coordKey);
             formattedDorms.push({
               id: idCounter++,
               name: name,
               gender: gender,
               city: city,
               district: district,
               address: address || (district + (district && city ? ", " : "") + city),
               coordinates: { lat: lat, lng: lon },
               nearby_campus: "Hesaplanıyor..."
             });
          }
        }
      });
      
      fs.writeFileSync('src/data/kyk-yurtlari.json', JSON.stringify(formattedDorms, null, 2));
      console.log("Successfully written " + formattedDorms.length + " dorms to kyk-yurtlari.json");

    } catch (e) {
      console.error("Error parsing Overpass JSON:", e.message);
    }
  });
});

req.on('error', (e) => {
  console.error("Request error:", e);
});

req.write(postData);
req.end();
