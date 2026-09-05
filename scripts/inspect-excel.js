import XLSX from "xlsx";

const files = ["tablo-3.xls.xls", "tablo-4.xls.xls"];

for (const file of files) {
  console.log("\n=================================");
  console.log("DOSYA:", file);
  console.log("=================================\n");

  try {
    const workbook = XLSX.readFile(file);

    console.log("Sayfalar:");
    console.log(workbook.SheetNames);

    for (const sheetName of workbook.SheetNames.slice(0, 2)) {
      console.log("\n--- SAYFA:", sheetName, "---\n");

      const sheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      console.log("Toplam satır:", rows.length);

      console.log("\nİlk 15 satır:\n");

      console.log(
        rows
          .slice(0, 15)
          .map((row, index) => {
            return `${index + 1}: ${JSON.stringify(row)}`;
          })
          .join("\n")
      );
    }
  } catch (error) {
    console.error("HATA:", error.message);
  }
}