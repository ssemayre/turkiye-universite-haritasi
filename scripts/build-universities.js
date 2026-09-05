import fs from "fs";

const programs = JSON.parse(
  fs.readFileSync("src/data/programs.json", "utf8")
);

// Üniversite olmayan özel kayıtlar
const excludedPrefixes = [
  "İÇİŞLERİ BAKANLIĞI VE MİLLİ SAVUNMA BAKANLIĞI ADINA SAĞLIK BİLİMLERİ ÜNİVERSİTESİNDE EĞİTİM ALACAKLAR",
  "İSTANBUL SAĞLIK VE SOSYAL BİLİMLER MESLEK YÜKSEKOKULU",
];

const universityMap = new Map();

function parseUniversityInfo(fullName) {
  let name = String(fullName || "").trim();

  let type = "";
  let city = "";

  // Üniversite türünü ayır
  const typeMatch = name.match(
    /\((Devlet Üniversitesi|Vakıf Üniversitesi|KKTC)\)\s*$/i
  );

  if (typeMatch) {
    type = typeMatch[1];

    name = name
      .replace(typeMatch[0], "")
      .trim();
  }

  // Üniversite adına eklenmiş şehir bilgisini ayır
  const cityMatch = name.match(/\(([^()]+)\)\s*$/);

  if (cityMatch) {
    city = cityMatch[1].trim();

    name = name
      .replace(cityMatch[0], "")
      .trim();
  }

  return {
    name,
    city,
    type,
  };
}

for (const program of programs) {
  const rawUniversity = String(program.university || "").trim();

  if (!rawUniversity) {
    continue;
  }

  // Üniversite olmayan kayıtları çıkar
  const isExcluded = excludedPrefixes.some((prefix) =>
    rawUniversity.startsWith(prefix)
  );

  if (isExcluded) {
    continue;
  }

  const parsed = parseUniversityInfo(rawUniversity);

  if (!universityMap.has(parsed.name)) {
    universityMap.set(parsed.name, {
      id: universityMap.size + 1,
      name: parsed.name,
      city: parsed.city,
      type: parsed.type,
      latitude: null,
      longitude: null,
    });
  }
}

const universities = Array.from(universityMap.values());

fs.writeFileSync(
  "src/data/universities-generated.json",
  JSON.stringify(universities, null, 2),
  "utf8"
);

console.log("=================================");
console.log("ÜNİVERSİTE VERİSİ OLUŞTURULDU");
console.log("=================================");
console.log("Toplam kayıt:", programs.length);
console.log("Gerçek üniversite:", universities.length);

console.log("\nİlk 10 üniversite:\n");

for (const university of universities.slice(0, 10)) {
  console.log(university);
}

console.log("\nDosya:");
console.log("src/data/universities-generated.json");