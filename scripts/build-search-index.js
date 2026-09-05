import fs from "fs";

const inputFile =
  "src/data/programs-with-rank.json";

const outputFile =
  "public/programs-search.json";

const programs = JSON.parse(
  fs.readFileSync(inputFile, "utf8")
);

const searchIndex = programs.map((program) => ({
  code: program.code,
  name: program.name,
  universityId: program.universityId,
  universityName: program.universityName,
  city: program.city,
  faculty: program.faculty,

  scoreType: program.scoreType,
  duration: program.duration,

  quota: program.quota,
  placed: program.placed,

  minScore: program.minScore,
  maxScore: program.maxScore,

  successRank: program.successRank,
}));

fs.writeFileSync(
  outputFile,
  JSON.stringify(searchIndex),
  "utf8"
);

console.log("=================================");
console.log("PROGRAM ARAMA İNDEKSİ OLUŞTURULDU");
console.log("=================================");

console.log(
  "Program:",
  searchIndex.length
);

console.log(
  "Dosya:",
  outputFile
);