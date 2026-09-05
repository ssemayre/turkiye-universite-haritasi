import fs from "fs";

const file = "src/data/universities-geocoded.json";

const universities = JSON.parse(
  fs.readFileSync(file, "utf8")
);

const fixes = {
  "ACIBADEM MEHMET ALİ AYDINLAR ÜNİVERSİTESİ": {
    city: "İstanbul",
    latitude: 40.9784913,
    longitude: 29.1103154
  },

  "BEZM-İ ÂLEM VAKIF ÜNİVERSİTESİ": {
    city: "İstanbul",
    latitude: 41.0183333,
    longitude: 28.9361111
  },

  "DEMİROĞLU BİLİM ÜNİVERSİTESİ": {
    city: "İstanbul",
    latitude: 41.0691667,
    longitude: 29.0122222
  },

  "TÜRK-JAPON BİLİM VE TEKNOLOJİ ÜNİVERSİTESİ": {
    city: "Ankara",
    latitude: 39.892,
    longitude: 32.825
  }
};

let fixed = 0;

for (const university of universities) {
  const fix = fixes[university.name];

  if (!fix) {
    continue;
  }

  university.city = fix.city;
  university.latitude = fix.latitude;
  university.longitude = fix.longitude;
  university.geocodingStatus = "manual-verified";

  fixed++;

  console.log(
    `✓ ${university.name} → ${fix.latitude}, ${fix.longitude}`
  );
}

fs.writeFileSync(
  file,
  JSON.stringify(universities, null, 2),
  "utf8"
);

console.log("\n=================================");
console.log("ÖZEL KOORDİNATLAR EKLENDİ");
console.log("=================================");
console.log("Düzeltilen:", fixed);
console.log("Dosya:", file);