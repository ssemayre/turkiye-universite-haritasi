import fs from "fs";

const INPUT_FILE =
  "src/data/programs-complete.json";

const OUTPUT_FILE =
  "src/data/programs-with-rank.json";

const API =
  "https://yokatlas.yok.gov.tr/api/tercih-kilavuz/search";

const PAGE_SIZE = 50;

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

async function fetchPage(page) {
  const response = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "universite-haritasi/1.0",
    },
    body: JSON.stringify({
      page,
      size: PAGE_SIZE,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}`
    );
  }

  return response.json();
}

const programs = JSON.parse(
  fs.readFileSync(
    INPUT_FILE,
    "utf8"
  )
);

console.log("=================================");
console.log("YÖK ATLAS 2026 BAŞARI SIRASI");
console.log("=================================");

console.log(
  "Mevcut program:",
  programs.length
);

console.log(
  "API'den sayfalar indiriliyor..."
);

const rankMap = new Map();

let page = 0;

let totalPages = null;

while (
  totalPages === null ||
  page < totalPages
) {
  console.log(
    `Sayfa ${page + 1}` +
      (
        totalPages
          ? ` / ${totalPages}`
          : ""
      )
  );

  const data = await fetchPage(page);

  if (
    totalPages === null
  ) {
    totalPages =
      data.totalPages;

    console.log(
      "Toplam API sayfası:",
      totalPages
    );
  }

  const content =
    data.content || [];

  for (const item of content) {
    const code =
      String(
        item.kilavuzKodu ?? ""
      ).trim();

    if (!code) {
      continue;
    }

    /*
      API'nin tek program kaydındaki
      güncel istatistikler:
        current.basariSirasi
      veya bazı sürümlerde
        basariSirasi
    */

    const current =
      item.current || {};

    const rank =
      current.basariSirasi ??
      item.basariSirasi ??
      null;

    const minScore =
      current.minPuan ??
      item.minPuan ??
      null;

    const quota =
      current.kontenjan ??
      item.kontenjan ??
      null;

    const placed =
      current.yerlesen ??
      item.yerlesen ??
      null;

    rankMap.set(code, {
      basariSirasi: rank,
      yokMinPuan: minScore,
      yokKontenjan: quota,
      yokYerlesen: placed,
      yokUniversityName:
        item.universiteAdi ??
        null,
      yokProgramName:
        item.birimAdi ??
        null,
      yil:
        current.year ??
        data.yil ??
        2026,
    });
  }

  page++;

  await sleep(150);
}

console.log("\n=================================");
console.log("API İNDİRME TAMAMLANDI");
console.log("=================================");

console.log(
  "API'den alınan program:",
  rankMap.size
);

const merged = [];

let found = 0;
let missing = 0;

for (const program of programs) {
  const code =
    String(
      program.code ?? ""
    ).trim();

  const rankData =
    rankMap.get(code);

  if (rankData) {
    merged.push({
      ...program,

      successRank:
        rankData.basariSirasi,

      yokMinScore:
        rankData.yokMinPuan,

      yokQuota:
        rankData.yokKontenjan,

      yokPlaced:
        rankData.yokYerlesen,

      yokYear:
        rankData.yil,

      placementRankFound:
        rankData.basariSirasi !==
        null,
    });

    found++;
  } else {
    merged.push({
      ...program,

      successRank: null,

      yokMinScore: null,

      yokQuota: null,

      yokPlaced: null,

      yokYear: 2026,

      placementRankFound: false,
    });

    missing++;
  }
}

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(
    merged,
    null,
    2
  ),
  "utf8"
);

console.log("\n=================================");
console.log("EŞLEŞTİRME TAMAMLANDI");
console.log("=================================");

console.log(
  "Toplam:",
  merged.length
);

console.log(
  "Başarı sırası bulunan:",
  found
);

console.log(
  "Başarı sırası bulunamayan:",
  missing
);

console.log(
  "\nDosya:",
  OUTPUT_FILE
);