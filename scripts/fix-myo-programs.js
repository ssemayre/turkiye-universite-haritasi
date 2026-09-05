import fs from "fs";

const programsFile = "src/data/programs-final.json";

const programs = JSON.parse(
  fs.readFileSync(programsFile, "utf8")
);

const SPECIAL_MYO_NAME =
  "İSTANBUL SAĞLIK VE SOSYAL BİLİMLER MESLEK YÜKSEKOKULU (Vakıf Üniversitesi)";

const myoPrograms = programs.filter(
  (program) =>
    String(program.university || "").trim() === SPECIAL_MYO_NAME
);

const updatedPrograms = programs.map((program) => {
  const universityName = String(
    program.university || ""
  ).trim();

  if (universityName === SPECIAL_MYO_NAME) {
    return {
      ...program,

      institutionType: "Meslek Yüksekokulu",

      institutionName:
        "İstanbul Sağlık ve Sosyal Bilimler Meslek Yüksekokulu",

      institutionCity: "İstanbul",

      institutionOwnership: "Vakıf",

      specialInstitution: true
    };
  }

  return program;
});

fs.writeFileSync(
  "src/data/programs-final.json",
  JSON.stringify(updatedPrograms, null, 2),
  "utf8"
);

const linkedSBU = updatedPrograms.filter(
  (program) => program.specialQuota === true
).length;

const linkedMYO = updatedPrograms.filter(
  (program) => program.specialInstitution === true
).length;

console.log("=================================");
console.log("ÖZEL KURUMLAR KONTROLÜ");
console.log("=================================");

console.log("SBU özel programları:", linkedSBU);
console.log("MYO programları:", linkedMYO);
console.log("Toplam program:", updatedPrograms.length);