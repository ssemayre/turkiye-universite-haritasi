import XLSX from "xlsx";
import fs from "fs";

const inputFiles = [
  "tablo-3.xls.xls",
  "tablo-4.xls.xls",
];

const allPrograms = [];

for (const file of inputFiles) {
  console.log(`\nOkunuyor: ${file}`);

  const workbook = XLSX.readFile(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  let currentUniversity = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row || row.length === 0) {
      continue;
    }

    const first = String(row[0] ?? "").trim();
    const second = String(row[1] ?? "").trim();

    // Üniversite satırını bul
    if (
      second.includes("(Devlet Üniversitesi)") ||
      second.includes("(Vakıf Üniversitesi)") ||
      second.includes("(KKTC)") ||
      second.includes("(Yabancı)")
    ) {
      currentUniversity = second;

      console.log(`Üniversite: ${currentUniversity}`);

      continue;
    }

    // Program kodu genellikle rakamlardan oluşuyor
    if (
      currentUniversity &&
      /^\d{8,9}$/.test(first) &&
      second.length > 1
    ) {
      const program = {
        code: first,
        university: currentUniversity,
        name: second,
        duration: String(row[2] ?? "").trim(),
        scoreType: String(row[3] ?? "").trim(),
        quota: String(row[4] ?? "").trim(),
        raw: row,
      };

      allPrograms.push(program);
    }
  }
}

console.log("\n====================================");
console.log("VERİ AKTARIMI TAMAMLANDI");
console.log("====================================");

console.log(`Toplam program: ${allPrograms.length}`);

fs.writeFileSync(
  "src/data/programs.json",
  JSON.stringify(allPrograms, null, 2),
  "utf8"
);

console.log("Dosya oluşturuldu:");
console.log("src/data/programs.json");