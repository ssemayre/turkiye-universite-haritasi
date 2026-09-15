const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const startStr = '<div className="kyk-info-box">';
const endStr = '</aside>';
const startIdx = app.indexOf(startStr);
const endIdx = app.indexOf(endStr, startIdx);

if (startIdx > -1 && endIdx > -1) {
    const oldBlock = app.substring(startIdx, endIdx);
    
    const newBlock = 
'<div className="kyk-info-box">\n' +
'    {/* Distance card */}\n' +
'    <div style={{ background: \'#f8fafc\', border: \'1px solid #e2e8f0\', padding: \'16px\', borderRadius: \'12px\', marginBottom: \'15px\' }}>\n' +
'      <div style={{ display: \'flex\', alignItems: \'center\', gap: \'8px\', marginBottom: \'10px\' }}>\n' +
'        <span style={{ fontSize: \'18px\' }}>🎓</span>\n' +
'        <h4 style={{ margin: 0, color: \'#475569\', fontSize: \'13px\', textTransform: \'uppercase\', fontWeight: \'700\' }}>En Yakın Kampüs</h4>\n' +
'      </div>\n' +
'      <div style={{ color: \'#0f172a\', fontSize: \'15px\', fontWeight: \'600\' }}>\n' +
'        {(() => {\n' +
'          let minD = Infinity;\n' +
'          let minName = null;\n' +
'          Object.values(campusData).flat().forEach(c => {\n' +
'            if (c.latitude && c.longitude) {\n' +
'              let lat = Number(c.latitude);\n' +
'              let lng = Number(c.longitude);\n' +
'              if (!isNaN(lat) && !isNaN(lng) && selectedKyk && selectedKyk.coordinates && selectedKyk.coordinates.lat) {\n' +
'                let d = getDistanceFromLatLonInKm(Number(selectedKyk.coordinates.lat), Number(selectedKyk.coordinates.lng), lat, lng);\n' +
'                if (d < minD) {\n' +
'                  minD = d;\n' +
'                  minName = c.name + (c.universityName ? " (" + c.universityName + ")" : "");\n' +
'                }\n' +
'              }\n' +
'            }\n' +
'          });\n' +
'          if (minD !== Infinity && minName) {\n' +
'            let walkTime = Math.round((minD / 5) * 60);\n' +
'            let walkStr = walkTime < 60 ? walkTime + " dk" : Math.round(walkTime/60) + " saat";\n' +
'            return (\n' +
'              <div>\n' +
'                <div style={{ marginBottom: \'6px\' }}>{minName}</div>\n' +
'                <div style={{ color: \'#6366f1\', fontSize: \'14px\', display: \'flex\', alignItems: \'center\', gap: \'5px\' }}>\n' +
'                  <span>📍 {(minD).toFixed(1)} km</span>\n' +
'                  <span style={{ color: \'#94a3b8\' }}>•</span>\n' +
'                  <span>🚶‍♂️ Yürüyerek ~{walkStr}</span>\n' +
'                </div>\n' +
'              </div>\n' +
'            );\n' +
'          }\n' +
'          return "Kampüs bulunamadı";\n' +
'        })()}\n' +
'      </div>\n' +
'    </div>\n' +
'\n' +
'    {/* Address card */}\n' +
'    {(selectedKyk.address || (selectedKyk.district && selectedKyk.city)) ? (\n' +
'      <div style={{ background: \'#f8fafc\', padding: \'16px\', borderRadius: \'12px\', border: \'1px solid #e2e8f0\', marginBottom: \'20px\' }}>\n' +
'        <div style={{ display: \'flex\', alignItems: \'center\', gap: \'8px\', marginBottom: \'10px\' }}>\n' +
'          <span style={{ fontSize: \'18px\' }}>🗺️</span>\n' +
'          <h4 style={{ margin: 0, color: \'#475569\', fontSize: \'13px\', textTransform: \'uppercase\', fontWeight: \'700\' }}>Açık Adres</h4>\n' +
'        </div>\n' +
'        <div style={{ color: \'#334155\', fontSize: \'14px\', lineHeight: \'1.5\' }}>\n' +
'          {selectedKyk.address ? selectedKyk.address : selectedKyk.district + ", " + selectedKyk.city}\n' +
'        </div>\n' +
'      </div>\n' +
'    ) : null}\n' +
'    \n' +
'    <a href={"https://www.google.com/maps/dir/?api=1&destination=" + selectedKyk.coordinates.lat + "," + selectedKyk.coordinates.lng} target="_blank" rel="noreferrer" style={{ display: \'flex\', alignItems: \'center\', justifyContent: \'center\', gap: \'8px\', width: \'100%\', padding: \'14px\', background: \'#2563eb\', color: \'#fff\', borderRadius: \'12px\', textDecoration: \'none\', fontWeight: \'600\', fontSize: \'15px\', transition: \'background 0.2s\', boxSizing: \'border-box\' }}>\n' +
'      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>\n' +
'      Haritalarda Yol Tarifi\n' +
'    </a>\n' +
'  </div>\n';

    app = app.replace(oldBlock, newBlock);
    fs.writeFileSync('src/App.jsx', app);
    console.log("Updated KYK Detail Card Logic");
} else {
    console.log("Could not find the aside block");
}
