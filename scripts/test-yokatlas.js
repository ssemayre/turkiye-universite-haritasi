const url =
  "https://yokatlas.yok.gov.tr/api/tercih-kilavuz/universiteler";

try {
  const response = await fetch(url);

  console.log("HTTP:", response.status);

  const data = await response.json();

  console.log("API çalışıyor.");
  console.log("Üniversite sayısı:", data.length);

  console.log("İlk kayıt:");
  console.log(data[0]);
} catch (error) {
  console.error("HATA:", error.message);
}