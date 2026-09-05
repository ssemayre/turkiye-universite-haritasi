import fs from "fs";

const file = "src/data/universities.json";

const universities = JSON.parse(
  fs.readFileSync(file, "utf8")
);

const provinces = [
  "ADANA",
  "ADIYAMAN",
  "AFYONKARAHİSAR",
  "AĞRI",
  "AKSARAY",
  "AMASYA",
  "ANKARA",
  "ANTALYA",
  "ARDAHAN",
  "ARTVİN",
  "AYDIN",
  "BALIKESİR",
  "BARTIN",
  "BATMAN",
  "BAYBURT",
  "BİLECİK",
  "BİNGÖL",
  "BİTLİS",
  "BOLU",
  "BURDUR",
  "BURSA",
  "ÇANAKKALE",
  "ÇANKIRI",
  "ÇORUM",
  "DENİZLİ",
  "DİYARBAKIR",
  "DÜZCE",
  "EDİRNE",
  "ELAZIĞ",
  "ERZİNCAN",
  "ERZURUM",
  "ESKİŞEHİR",
  "GAZİANTEP",
  "GİRESUN",
  "GÜMÜŞHANE",
  "HAKKARİ",
  "HATAY",
  "IĞDIR",
  "ISPARTA",
  "İSTANBUL",
  "İZMİR",
  "KAHRAMANMARAŞ",
  "KARABÜK",
  "KARAMAN",
  "KARS",
  "KASTAMONU",
  "KAYSERİ",
  "KIRIKKALE",
  "KIRKLARELİ",
  "KIRŞEHİR",
  "KİLİS",
  "KOCAELİ",
  "KONYA",
  "KÜTAHYA",
  "MALATYA",
  "MANİSA",
  "MARDİN",
  "MERSİN",
  "MUĞLA",
  "MUŞ",
  "NEVŞEHİR",
  "NİĞDE",
  "ORDU",
  "OSMANİYE",
  "RİZE",
  "SAKARYA",
  "SAMSUN",
  "ŞANLIURFA",
  "SİİRT",
  "SİNOP",
  "SİVAS",
  "ŞIRNAK",
  "TEKİRDAĞ",
  "TOKAT",
  "TRABZON",
  "TUNCELİ",
  "UŞAK",
  "VAN",
  "YALOVA",
  "YOZGAT",
  "ZONGULDAK"
];

function findProvince(displayName) {
  const text = String(displayName || "")
    .toLocaleUpperCase("tr-TR");

  for (const province of provinces) {
    if (text.includes(province)) {
      return province;
    }
  }

  return "";
}

let filled = 0;

for (const university of universities) {
  if (university.city) {
    continue;
  }

  const province = findProvince(
    university.displayName
  );

  if (province) {
    university.city = province;
    filled++;
  }
}

fs.writeFileSync(
  file,
  JSON.stringify(universities, null, 2),
  "utf8"
);

console.log("=================================");
console.log("ŞEHİR BİLGİLERİ GÜNCELLENDİ");
console.log("=================================");
console.log("Doldurulan şehir:", filled);

console.log(
  "Şehri hâlâ boş olan:",
  universities.filter((u) => !u.city).length
);