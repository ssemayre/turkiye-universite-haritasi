import fs from "fs";

const unmatched = JSON.parse(
  fs.readFileSync("src/data/unmatched-programs.json", "utf8")
);

const groups = new Map();

for (const program of unmatched) {
  const name = String(program.university || "").trim();

  if (!groups.has(name)) {
    groups.set(name, {
      count: 0,
      examples: []
    });
  }

  const group = groups.get(name);

  group.count++;

  if (group.examples.length < 3) {
    group.examples.push({
      code: program.code,
      program: program.name
    });
  }
}

const sorted = [...groups.entries()]
  .sort((a, b) => b[1].count - a[1].count);

console.log("\n=================================");
console.log("EŞLEŞMEYEN ÜNİVERSİTE ADLARI");
console.log("=================================\n");

console.log(
  "Eşleşmeyen toplam program:",
  unmatched.length
);

console.log(
  "Farklı üniversite adı:",
  sorted.length
);

console.log("\n");

for (const [name, info] of sorted) {
  console.log(`PROGRAM SAYISI: ${info.count}`);
  console.log(`ÜNİVERSİTE: ${name}`);

  for (const example of info.examples) {
    console.log(
      `  → ${example.code} | ${example.program}`
    );
  }

  console.log("---------------------------------\n");
}