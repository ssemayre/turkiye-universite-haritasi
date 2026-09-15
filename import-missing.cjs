const fs = require('fs');
const path = require('path');

const campusesPath = path.join(__dirname, 'src', 'data', 'campuses.json');
const csvPath = path.join(__dirname, 'eksik_kampusler.csv');

if (!fs.existsSync(csvPath)) {
    console.error('❌ HATA: eksik_kampusler.csv bulunamadı!');
    console.error('Lütfen önce export-missing.cjs betiğini çalıştırın ve dosyayı doldurun.');
    process.exit(1);
}

// Basit CSV ayırıcı (Tırnak içindeki virgülleri korur)
function parseCSVRow(text) {
    const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    return text.split(re).map(x => x.replace(/^"|"$/g, '').replace(/""/g, '"'));
}

try {
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split(/\r?\n/).filter(line => line.trim() !== '');

    const updates = {};
    // İlk satır başlık (ID,Üniversite,...), bu yüzden i=1'den başlıyoruz
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVRow(lines[i]);
        if (cols.length >= 6) {
            const id = cols[0];
            const latStr = cols[4] ? cols[4].trim() : '';
            const lngStr = cols[5] ? cols[5].trim() : '';
            
            // Virgüllü ondalık girişleri noktaya çevir (Türkiye lokalinden kaynaklı hataları önlemek için)
            const lat = parseFloat(latStr.replace(',', '.'));
            const lng = parseFloat(lngStr.replace(',', '.'));
            
            if (id && !isNaN(lat) && !isNaN(lng)) {
                updates[id] = { lat, lng };
            }
        }
    }

    const rawData = fs.readFileSync(campusesPath, 'utf8');
    const data = JSON.parse(rawData);
    let updatedCount = 0;

    for (const uniId in data) {
        const uni = data[uniId];
        for (const campus of uni.campuses) {
            if (updates[campus.id]) {
                campus.latitude = updates[campus.id].lat;
                campus.longitude = updates[campus.id].lng;
                campus.coordinateStatus = 'manual-exact';
                updatedCount++;
            }
        }
    }

    // Güncellenmiş veriyi kaydet
    fs.writeFileSync(campusesPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ İşlem tamamlandı! Toplam ${updatedCount} adet yerleşkenin koordinatı eksik_kampusler.csv'den okunarak güncellendi.`);

} catch (err) {
    console.error('❌ Hata oluştu:', err.message);
}
