const fs = require('fs');
const path = require('path');

const campusesPath = path.join(__dirname, 'src', 'data', 'campuses.json');
const outputPath = path.join(__dirname, 'eksik_kampusler.csv');

try {
    const rawData = fs.readFileSync(campusesPath, 'utf8');
    const data = JSON.parse(rawData);

    // CSV formatı başlıkları
    let csvContent = 'ID,Üniversite,Yerleşke Adı,İl,Lat,Lng\n';
    let count = 0;

    for (const uniId in data) {
        const uni = data[uniId];
        for (const campus of uni.campuses) {
            // Koordinatı olmayanları veya not-found olanları al
            if (campus.coordinateStatus === 'not-found' || !campus.latitude) {
                // CSV'nin bozulmaması için metinleri tırnak içine alıp içindeki tırnakları escape ediyoruz
                const uniName = `"${(uni.universityName || '').replace(/"/g, '""')}"`;
                const campusName = `"${(campus.name || '').replace(/"/g, '""')}"`;
                const city = `"${(campus.city || uni.city || '').replace(/"/g, '""')}"`;
                
                // Lat ve Lng kullanıcı tarafından doldurulacağı için boş bırakılıyor
                csvContent += `${campus.id},${uniName},${campusName},${city},,\n`;
                count++;
            }
        }
    }

    // UTF-8 BOM ekleyelim ki Excel'de açıldığında Türkçe karakterler (Ş, Ğ, Ç, İ vb.) bozulmasın
    fs.writeFileSync(outputPath, '\uFEFF' + csvContent, 'utf8');
    console.log(`✅ ${count} adet eksik yerleşke başarıyla '${outputPath}' dosyasına aktarıldı.`);
    console.log('Bu dosyayı Excel ile açıp Lat ve Lng sütunlarını doldurduktan sonra import-missing.cjs betiğini çalıştırabilirsiniz.');

} catch (err) {
    console.error('Hata oluştu:', err.message);
}
