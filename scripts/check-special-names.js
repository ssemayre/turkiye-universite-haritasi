import fs from "fs";

const programs = JSON.parse(
  fs.readFileSync("src/data/programs.json", "utf8")
);

const matches = new Set();

for (const program of programs) {
  const name = String(program.university || "").trim();

  if (
    name.includes("İÇİŞLERİ") ||
    name.includes("MİLLİ SAVUNMA") ||
    name.includes("SAĞLIK BİLİMLERİ ÜNİVERSİTESİNDE") ||
    name.includes("İSTANBUL SAĞLIK VE SOSYAL BİLİMLER")
  ) {
    matches.add(name);
  }
}

console.log("\nExcel'deki gerçek kayıtlar:\n");

for (const name of matches) {
  console.log(JSON.stringify(name));
}

console.log("\nToplam eşleşen özel kayıt:", matches.size);