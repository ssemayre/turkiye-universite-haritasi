const url =
  "https://yokatlas.yok.gov.tr/api/tercih-kilavuz/search";

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    kilavuzKodu: 106990627,
    page: 1,
    size: 1,
  }),
});

console.log("HTTP:", response.status);

const data = await response.json();

console.log("\nANAHTARLAR:");
console.log(Object.keys(data));

console.log("\nTAM CEVAP:");
console.dir(data, {
  depth: null,
  maxArrayLength: 5,
});

console.log("\nPROGRAM KAYDI:");
console.dir(
  data.content?.[0],
  {
    depth: null,
  }
);