import fs from "fs";

const inputFile = "src/data/universities-generated.json";
const outputFile = "src/data/universities-geocoded.json";

const universities = JSON.parse(
  fs.readFileSync(inputFile, "utf8")
);

const cityHints = {
  "ANKARA HACI BAYRAM VELİ ÜNİVERSİTESİ": "Ankara",
  "GAZİANTEP İSLAM BİLİM VE TEKNOLOJİ ÜNİVERSİTESİ": "Gaziantep",
  "KİLİS 7 ARALIK ÜNİVERSİTESİ": "Kilis",
  "KÜTAHYA DUMLUPINAR ÜNİVERSİTESİ": "Kütahya",
  "TOKAT GAZİOSMANPAŞA ÜNİVERSİTESİ": "Tokat",
  "VAN YÜZÜNCÜ YIL ÜNİVERSİTESİ": "Van",
  "ACIBADEM MEHMET ALİ AYDINLAR ÜNİVERSİTESİ": "İstanbul",
  "ANKARA MEDİPOL ÜNİVERSİTESİ": "Ankara",
  "BEZM-İ ÂLEM VAKIF ÜNİVERSİTESİ": "İstanbul",
  "DEMİROĞLU BİLİM ÜNİVERSİTESİ": "İstanbul",
  "İSTANBUL 29 MAYIS ÜNİVERSİTESİ": "İstanbul",
  "İSTANBUL NİŞANTAŞI ÜNİVERSİTESİ": "İstanbul",
  "İSTANBUL OKAN ÜNİVERSİTESİ": "İstanbul",
  "İSTANBUL TOPKAPI ÜNİVERSİTESİ": "İstanbul",
  "TÜRK-JAPON BİLİM VE TEKNOLOJİ ÜNİVERSİTESİ": "Ankara",
  "İSTANBUL SABAHATTİN ZAİM ÜNİVERSİTESİ": "İstanbul"
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanName(name) {
  return name
    .replace(
      /^(ANKARA|İSTANBUL|İZMİR|BURSA|ANTALYA|ADANA|GAZİANTEP|KONYA|KOCAELİ|SAKARYA|KAYSERİ|MERSİN|ESKİŞEHİR|SAMSUN|TRABZON|VAN|TOKAT|KÜTAHYA|KİLİS|AMASYA|ADIYAMAN|AĞRI)\s+/,
      ""
    )
    .trim();
}

async function searchNominatim(query) {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: "1",
      countrycodes: "tr",
    });

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "universite-haritasi/1.0 (university-map-project)",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
}

const results = [];

for (let i = 0; i < universities.length; i++) {
  const university = universities[i];

  console.log(
    `\n${i + 1}/${universities.length} → ${university.name}`
  );

  const city =
    cityHints[university.name] ||
    university.city ||
    "";

  const shortName = cleanName(university.name);

  const queries = [
    `${university.name}, ${city}, Türkiye`,
    `${shortName}, ${city}, Türkiye`,
    `${shortName}, Türkiye`,
  ];

  let found = null;

  for (const query of queries) {
    try {
      console.log(`   Aranıyor: ${query}`);

      const data = await searchNominatim(query);

      if (data.length > 0) {
        found = data[0];
        break;
      }

      await sleep(1200);
    } catch (error) {
      console.log("   API hatası:", error.message);
      await sleep(2000);
    }
  }

  if (found) {
    const address = found.address || {};

    const foundCity =
      address.city ||
      address.town ||
      address.municipality ||
      address.province ||
      city;

    results.push({
      ...university,
      city: foundCity,
      latitude: Number(found.lat),
      longitude: Number(found.lon),
      displayName: found.display_name,
      geocodingStatus: "found",
    });

    console.log(
      `   ✓ BULUNDU → ${foundCity} | ${found.lat}, ${found.lon}`
    );
  } else {
    results.push({
      ...university,
      city,
      latitude: null,
      longitude: null,
      geocodingStatus: "not-found",
    });

    console.log("   ✗ Bulunamadı");
  }

  await sleep(1200);
}

fs.writeFileSync(
  outputFile,
  JSON.stringify(results, null, 2),
  "utf8"
);

const foundCount = results.filter(
  (x) => x.geocodingStatus === "found"
).length;

const notFoundCount = results.filter(
  (x) => x.geocodingStatus === "not-found"
).length;

console.log("\n=================================");
console.log("GEOCODING TAMAMLANDI");
console.log("=================================");

console.log("Toplam:", results.length);
console.log("Bulunan:", foundCount);
console.log("Bulunamayan:", notFoundCount);
console.log("Hatalı: 0");

console.log("\nDosya:");
console.log(outputFile);