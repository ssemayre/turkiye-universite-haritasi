import fs from "fs";

const programs = JSON.parse(
  fs.readFileSync("src/data/programs.json", "utf8")
);

const universities = JSON.parse(
  fs.readFileSync("src/data/universities.json", "utf8")
);

const SPECIAL_SBU_NAME =
  "İÇİŞLERİ BAKANLIĞI VE MİLLİ SAVUNMA BAKANLIĞI ADINA SAĞLIK BİLİMLERİ ÜNİVERSİTESİNDE EĞİTİM ALACAKLAR (Devlet Üniversitesi)";

const SPECIAL_MYO_NAME =
  "İSTANBUL SAĞLIK VE SOSYAL BİLİMLER MESLEK YÜKSEKOKULU (Vakıf Üniversitesi)";

function normalize(value) {
  return String(value || "")
    .toLocaleUpperCase("tr-TR")
    .replace(/\([^)]*\)/g, "")
    .replace(/İ/g, "I")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/\s+/g, " ")
    .trim();
}

// Üniversite adı → üniversite kaydı
const universityMap = new Map();

for (const university of universities) {
  universityMap.set(
    normalize(university.name),
    university
  );
}

console.log("Üniversite haritası:", universityMap.size);

const finalPrograms = [];

let normalLinked = 0;
let sbuLinked = 0;
let myoLinked = 0;
let unmatched = 0;

for (const program of programs) {
  const rawUniversity = String(
    program.university || ""
  ).trim();

  // --------------------------------------------------
  // 1. Sağlık Bilimleri Üniversitesi özel programları
  // --------------------------------------------------

  if (rawUniversity === SPECIAL_SBU_NAME) {
    const sbu = universities.find((u) =>
      normalize(u.name) ===
      normalize("SAĞLIK BİLİMLERİ ÜNİVERSİTESİ")
    );

    if (sbu) {
      finalPrograms.push({
        ...program,

        universityId: sbu.id,
        universityName: sbu.name,
        city: sbu.city,

        specialQuota: true,
        specialQuotaNote:
          "İçişleri Bakanlığı / Millî Savunma Bakanlığı adına"
      });

      sbuLinked++;
      continue;
    }
  }

  // --------------------------------------------------
  // 2. İstanbul Sağlık ve Sosyal Bilimler MYO
  // --------------------------------------------------

  if (rawUniversity === SPECIAL_MYO_NAME) {
    finalPrograms.push({
      ...program,

      universityId: null,

      institutionType: "Meslek Yüksekokulu",

      institutionName:
        "İstanbul Sağlık ve Sosyal Bilimler Meslek Yüksekokulu",

      institutionCity: "İstanbul",

      institutionOwnership: "Vakıf",

      specialInstitution: true
    });

    myoLinked++;
    continue;
  }

  // --------------------------------------------------
  // 3. Normal üniversite programları
  // --------------------------------------------------

  const normalizedName = normalize(rawUniversity);

  const university =
    universityMap.get(normalizedName);

  if (!university) {
    unmatched++;

    finalPrograms.push({
      ...program,
      universityId: null,
      matchStatus: "unmatched"
    });

    continue;
  }

  finalPrograms.push({
    ...program,

    universityId: university.id,

    universityName: university.name,

    city: university.city,

    matchStatus: "matched"
  });

  normalLinked++;
}

// --------------------------------------------------
// Dosyaları kaydet
// --------------------------------------------------

fs.writeFileSync(
  "src/data/programs-final.json",
  JSON.stringify(finalPrograms, null, 2),
  "utf8"
);

const unmatchedPrograms =
  finalPrograms.filter(
    (program) =>
      program.matchStatus === "unmatched"
  );

fs.writeFileSync(
  "src/data/unmatched-programs.json",
  JSON.stringify(
    unmatchedPrograms,
    null,
    2
  ),
  "utf8"
);

// --------------------------------------------------
// Sonuç
// --------------------------------------------------

console.log("\n=================================");
console.log("PROGRAM EŞLEŞTİRME TAMAMLANDI");
console.log("=================================");

console.log(
  "Toplam program:",
  finalPrograms.length
);

console.log(
  "Normal üniversite eşleşmesi:",
  normalLinked
);

console.log(
  "SBU özel programları:",
  sbuLinked
);

console.log(
  "MYO programları:",
  myoLinked
);

console.log(
  "Eşleşmeyen:",
  unmatched
);

console.log(
  "Toplam dağıtılmış program:",
  normalLinked + sbuLinked + myoLinked
);

console.log(
  "\nDosya:",
  "src/data/programs-final.json"
);