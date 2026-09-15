const https = require('https');
const fs = require('fs');

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
      
      let rawDorms = [];
      let idCounter = 1;

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

        if (name === "Bilinmeyen Yurt" && el.tags && el.tags.operator) {
            name = el.tags.operator + " Yurdu";
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
          rawDorms.push({
            id: idCounter++,
            name: name,
            gender: gender,
            city: city,
            district: district,
            address: address,
            coordinates: { lat: Number(lat), lng: Number(lon) }
          });
        }
      });
      
      // 1. Strict Filtering
      const badWords = ["talebe", "özel", "vakıf", "dernek", "derneği", "ilim yayma", "türgev", "tügva", "ensar", "cemaat", "apart", "rezidans", "pansiyon", "lise", "kurs", "ortaokul", "ilköğretim", "kolej", "tekstil", "sanayi", "şirket", "anaokulu", "ilkokul", "akademi"];
      let filtered = rawDorms.filter(d => {
          let n = d.name.toLowerCase();
          return !badWords.some(w => n.includes(w));
      });

      // 2. Address & Name cleanup
      filtered.forEach(d => {
          let n = d.name;
          // Clean address
          if (d.address) {
             d.address = d.address.replace(/Türkiye/g, "").replace(/, ,/g, ",").trim();
             if (d.address === "," || d.address === "") d.address = "";
             if (d.address.startsWith(",")) d.address = d.address.substring(1).trim();
             if (d.address.endsWith(",")) d.address = d.address.substring(0, d.address.length - 1).trim();
          }
          
          if (!d.district && d.address && d.address.length > 5) {
             // We'll just leave it empty if no district.
          } else if (!d.district) {
             d.district = "Merkez";
          }
          
          if (n.toLowerCase() === "kyk yurdu" || n.toLowerCase() === "öğrenci yurdu" || n.toLowerCase() === "bilinmeyen yurt" || n.toLowerCase() === "kyk" || n.toLowerCase() === "yurt" || n.toLowerCase() === "yurdu") {
              let prefix = d.district ? d.district : d.city;
              d.name = `${prefix} KYK ${d.gender !== 'Karma' ? d.gender + ' ' : ''}Yurdu`;
          }
      });

      // 3. Deduplication (Merge dorms < 200m apart with same gender)
      let merged = [];
      filtered.forEach(d => {
          let duplicate = merged.find(m => {
              let dist = getDistanceFromLatLonInKm(d.coordinates.lat, d.coordinates.lng, m.coordinates.lat, m.coordinates.lng);
              return dist < 0.2 && d.gender === m.gender && d.city === m.city;
          });
          
          if (!duplicate) {
              merged.push(d);
          }
      });
      
      fs.writeFileSync('src/data/kyk-yurtlari.json', JSON.stringify(merged, null, 2));
      console.log(`Success! Fetched ${rawDorms.length}, after strict filter & deduplication: ${merged.length} dorms saved.`);

    } catch (e) {
      console.error("Error:", e.message);
    }
  });
});

req.on('error', (e) => console.error("Request error:", e));
req.write(postData);
req.end();
