import fs from "fs";

const universities = JSON.parse(
  fs.readFileSync("src/data/universities-geocoded.json", "utf8")
);

const notFound = universities.filter(
  (university) => university.geocodingStatus === "not-found"
);

console.log("\nBulunamayan üniversiteler:\n");

notFound.forEach((university, index) => {
  console.log(`${index + 1}. ${university.name}`);
});

console.log(`\nToplam: ${notFound.length}`);