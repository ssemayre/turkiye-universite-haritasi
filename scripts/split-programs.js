import fs from "fs";
import path from "path";

const inputFile = "src/data/programs-with-rank.json";
const outputDir = "public/programs";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const programs = JSON.parse(
  fs.readFileSync(inputFile, "utf8")
);

const grouped = new Map();

for (const program of programs) {
  const universityId = program.universityId;

  if (
    universityId === null ||
    universityId === undefined
  ) {
    continue;
  }

  if (!grouped.has(universityId)) {
    grouped.set(universityId, []);
  }

  grouped.get(universityId).push(program);
}

let fileCount = 0;

for (const [universityId, universityPrograms] of grouped) {
  const filePath = path.join(
    outputDir,
    `${universityId}.json`
  );

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      universityPrograms
    ),
    "utf8"
  );

  fileCount++;

  console.log(
    `${universityId}.json → ${universityPrograms.length} program`
  );
}

console.log("\n=================================");
console.log("PROGRAM DOSYALARI OLUŞTURULDU");
console.log("=================================");

console.log(
  "Toplam program:",
  programs.length
);

console.log(
  "Oluşturulan üniversite dosyası:",
  fileCount
);

console.log(
  "Klasör:",
  outputDir
);