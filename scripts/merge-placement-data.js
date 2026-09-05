import fs from "fs";
import XLSX from "xlsx";

const PROGRAM_FILE =
  "src/data/programs-final.json";

const TABLE_3 =
  "en-kucuk-ve-en-buyuk-puanlar-tablo-3-0wptq7-18092428.xlsx";

const TABLE_4 =
  "en-kucuk-ve-en-buyuk-puanlar-tablo-4-rps0lq-18092428.xlsx";

const OUTPUT_FILE =
  "src/data/programs-complete.json";

function clean(value) {
  return String(value ?? "").trim();
}

function readExcel(file) {
  const workbook = XLSX.readFile(file);

  const sheet =
    workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  return rows;
}

function buildPlacementMap(rows) {
  const map = new Map();

  // İlk 3 satır başlık.
  // Program verileri 4. satırdan başlıyor.
  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];

    if (!row || row.length === 0) {
      continue;
    }

    const code = clean(row[0]);

    // Program kodu
    if (!/^\d{8,9}$/.test(code)) {
      continue;
    }

    const record = {
      code,

      universityType: clean(row[1]),

      universityName: clean(row[2]),

      faculty: clean(row[3]),

      programName: clean(row[4]),

      scoreType: clean(row[5]),

      quota: clean(row[6]),

      placed: clean(row[7]),

      minScore: clean(row[8]),

      maxScore: clean(row[9]),

      schoolTopQuota: clean(row[10]),

      schoolTopPlaced: clean(row[11]),

      schoolTopMinScore: clean(row[12]),

      schoolTopMaxScore: clean(row[13]),

      women34Quota: clean(row[14]),

      women34Placed: clean(row[15]),

      women34MinScore: clean(row[16]),

      women34MaxScore: clean(row[17]),

      specialQuota: clean(row[18]),

      specialPlaced: clean(row[19]),

      specialMinScore: clean(row[20]),

      specialMaxScore: clean(row[21]),
    };

    map.set(code, record);
  }

  return map;
}

console.log("=================================");
console.log("ÖSYM YERLEŞTİRME VERİLERİ OKUNUYOR");
console.log("=================================");

const programs = JSON.parse(
  fs.readFileSync(PROGRAM_FILE, "utf8")
);

console.log(
  "Mevcut program:",
  programs.length
);

console.log("\nTABLO-3 okunuyor...");
const rows3 = readExcel(TABLE_3);
const placement3 = buildPlacementMap(rows3);

console.log(
  "Tablo-3 program:",
  placement3.size
);

console.log("\nTABLO-4 okunuyor...");
const rows4 = readExcel(TABLE_4);
const placement4 = buildPlacementMap(rows4);

console.log(
  "Tablo-4 program:",
  placement4.size
);

// İki tabloyu birleştir
const placementMap = new Map([
  ...placement3,
  ...placement4,
]);

console.log(
  "\nToplam yerleştirme kaydı:",
  placementMap.size
);

const completePrograms = [];
const unmatched = [];

for (const program of programs) {
  const code = clean(program.code);

  const placement =
    placementMap.get(code);

  if (!placement) {
    unmatched.push(program);

    completePrograms.push({
      ...program,

      placementDataFound: false,

      minScore: null,
      maxScore: null,
      placed: null,
      faculty: program.faculty || null,
    });

    continue;
  }

  completePrograms.push({
    ...program,

    placementDataFound: true,

    // Akademik birim
    faculty:
      placement.faculty ||
      program.faculty ||
      null,

    // 2026 yerleştirme bilgileri
    universityType:
      placement.universityType,

    placementUniversityName:
      placement.universityName,

    placementProgramName:
      placement.programName,

    scoreType:
      placement.scoreType,

    quota:
      placement.quota,

    placed:
      placement.placed,

    minScore:
      placement.minScore,

    maxScore:
      placement.maxScore,

    // Ayrı kontenjanlar
    schoolTopQuota:
      placement.schoolTopQuota,

    schoolTopPlaced:
      placement.schoolTopPlaced,

    schoolTopMinScore:
      placement.schoolTopMinScore,

    schoolTopMaxScore:
      placement.schoolTopMaxScore,

    women34Quota:
      placement.women34Quota,

    women34Placed:
      placement.women34Placed,

    women34MinScore:
      placement.women34MinScore,

    women34MaxScore:
      placement.women34MaxScore,

    specialQuotaCount:
      placement.specialQuota,

    specialPlaced:
      placement.specialPlaced,

    specialMinScore:
      placement.specialMinScore,

    specialMaxScore:
      placement.specialMaxScore,
  });
}

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(
    completePrograms,
    null,
    2
  ),
  "utf8"
);

fs.writeFileSync(
  "src/data/unmatched-placement.json",
  JSON.stringify(
    unmatched,
    null,
    2
  ),
  "utf8"
);

const foundCount =
  completePrograms.filter(
    (program) =>
      program.placementDataFound === true
  ).length;

console.log("\n=================================");
console.log("BİRLEŞTİRME TAMAMLANDI");
console.log("=================================");

console.log(
  "Toplam program:",
  completePrograms.length
);

console.log(
  "Yerleştirme verisi bulunan:",
  foundCount
);

console.log(
  "Yerleştirme verisi bulunamayan:",
  unmatched.length
);

console.log(
  "\nOluşturulan dosya:"
);

console.log(OUTPUT_FILE);