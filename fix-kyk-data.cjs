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

const rawData = fs.readFileSync('src/data/kyk-yurtlari.json', 'utf8');
let dorms = JSON.parse(rawData);

const initialCount = dorms.length;

// 1. Filter out high schools, middle schools, etc.
const badWords = ["lise", "pansiyon", "imam hatip", "ortaokul", "özel", "vakıf", "ilköğretim", "meslek", "kolej", "tekstil", "sanayi", "şirket", "anaokulu", "ilkokul", "akademi", "derneği", "dernek"];
dorms = dorms.filter(d => {
    let n = d.name.toLowerCase();
    return !badWords.some(w => n.includes(w));
});

// 2. Address & Name cleanup
dorms.forEach(d => {
    let n = d.name;
    if (n.toLowerCase() === "kyk yurdu" || n.toLowerCase() === "öğrenci yurdu" || n.toLowerCase() === "bilinmeyen yurt" || n.toLowerCase() === "kyk" || n.toLowerCase() === "yurt") {
        let prefix = d.district ? d.district : d.city;
        d.name = `${prefix} KYK ${d.gender !== 'Karma' ? d.gender + ' ' : ''}Yurdu`;
    }
    
    if (!d.address || d.address.replace(/[\s,]/g, '') === "Türkiye" || d.address.trim() === ", Türkiye") {
        d.address = `${d.district ? d.district + ' Mah/İlçe, ' : ''}${d.city}`;
    } else {
        d.address = d.address.replace(", Türkiye", "").replace("Türkiye", "").trim();
        if (d.address.startsWith(",")) d.address = d.address.substring(1).trim();
        if (d.address.endsWith(",")) d.address = d.address.substring(0, d.address.length - 1).trim();
    }
    
    // Sometimes district is missing but city is there
    if (!d.district) {
        d.district = "Merkez";
    }
});

// 3. Deduplication (Merge dorms < 200m apart with same gender)
let merged = [];
dorms.forEach(d => {
    let duplicate = merged.find(m => {
        let dist = getDistanceFromLatLonInKm(d.coordinates.lat, d.coordinates.lng, m.coordinates.lat, m.coordinates.lng);
        // Same gender and very close (< 0.2km)
        return dist < 0.2 && d.gender === m.gender && d.city === m.city;
    });
    
    if (!duplicate) {
        merged.push(d);
    }
});

console.log(`Original: ${initialCount}, Filtered & Deduplicated: ${merged.length}`);
fs.writeFileSync('src/data/kyk-yurtlari.json', JSON.stringify(merged, null, 2));
