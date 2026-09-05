import fs from "fs";

const programsFile = "src/data/programs.json";
const universitiesFile = "src/data/universities.json";

const programs = JSON.parse(
  fs.readFileSync(programsFile, "utf8")
);

const universities = JSON.parse(
  fs.readFileSync(universitiesFile, "utf8")
);

const sbuUniversity = universities.find(
  (u) =>
    u.name
      .toLocaleUpperCase("tr-TR")
      .includes("SAĞLIK BİLİMLERİ ÜNİVERSİTESİ")
);

if (!sbuUniversity) {
  throw new Error(
    "Sağlık Bilimleri Üniversitesi bulunamadı."
  );
}

const SPECIAL_SBU_NAME =
  "İÇİŞLERİ BAKANLIĞI VE MİLLİ SAVUNMA BAKANLIĞI ADINA SAĞLIK BİLİMLERİ ÜNİVERSİTESİNDE EĞİTİM ALACAKLAR (Devlet Üniversitesi)";

const SPECIAL_MYO_NAME =
  "İSTANBUL SAĞLIK VE SOSYAL BİLİMLER MESLEK YÜKSEKOKULU (Vakıf Üniversitesi)";

const fixedPrograms = [];

for (const program of programs) {
  const universityName = String(
    program.university || ""
  ).trim();

  // SBU özel kontenjanları
  if (universityName === SPECIAL_SBU_NAME) {
    fixedPrograms.push({
      ...program,

      universityId: sbuUniversity.id,
      universityName: sbuUniversity.name,
      city: sbuUniversity.city,

      specialQuota: true,
      specialQuotaNote:
        "İçişleri Bakanlığı / Millî Savunma Bakanlığı adına"
    });

    continue;
  }

  // Diğer programlar aynen kalır
  fixedPrograms.push(program);
}

fs.writeFileSync(
  "src/data/programs-final.json",
  JSON.stringify(fixedPrograms, null, 2),
  "utf8"
);

console.log("=================================");
console.log("ÖZEL PROGRAMLAR DÜZELTİLDİ");
console.log("=================================");

console.log(
  "Sağlık Bilimleri Üniversitesi ID:",
  sbuUniversity.id
);

console.log(
  "Dosya oluşturuldu:",
  "src/data/programs-final.json"
);

console.log(
  "İstanbul Sağlık ve Sosyal Bilimler MYO için ayrı kurum kaydı oluşturacağız."
);