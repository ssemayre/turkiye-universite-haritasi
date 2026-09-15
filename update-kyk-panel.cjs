const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const startStr = '<aside className="kyk-detail program-detail">';
const endStr = '</aside>';
const startIdx = app.indexOf(startStr);
const endIdx = app.indexOf(endStr, startIdx);

if (startIdx > -1 && endIdx > -1) {
    const oldBlock = app.substring(startIdx, endIdx + endStr.length);
    
    const newBlock = 
'<aside className="kyk-detail program-detail">\n' +
'  <div className="sheet-pull-handle-visual"></div>\n' +
'  <button\n' +
'    className="close-button"\n' +
'    onClick={() => setSelectedKyk(null)}\n' +
'  >\n' +
'    ✕\n' +
'  </button>\n' +
'  <div className="kyk-panel-header" style={{ marginBottom: \'15px\', paddingTop: \'10px\' }}>\n' +
'    <div style={{ display: \'flex\', gap: \'8px\', marginBottom: \'8px\' }}>\n' +
'      <span style={{ background: \'#10b981\', color: \'#fff\', padding: \'4px 8px\', borderRadius: \'6px\', fontSize: \'11px\', fontWeight: \'bold\' }}>GSB KYK</span>\n' +
'      <span style={{ background: selectedKyk.gender === \'Kız\' ? \'#fbcfe8\' : (selectedKyk.gender === \'Erkek\' ? \'#bfdbfe\' : \'#e5e7eb\'), color: selectedKyk.gender === \'Kız\' ? \'#be185d\' : (selectedKyk.gender === \'Erkek\' ? \'#1e3a8a\' : \'#4b5563\'), padding: \'4px 8px\', borderRadius: \'6px\', fontSize: \'11px\', fontWeight: \'bold\' }}>{selectedKyk.gender} Yurdu</span>\n' +
'    </div>\n' +
'    <h2 style={{ fontSize: \'20px\', margin: \'5px 0\', color: \'#1e293b\', fontWeight: \'700\', lineHeight: \'1.3\' }}>{selectedKyk.name}</h2>\n' +
'    <p style={{ color: \'#64748b\', margin: 0, fontSize: \'14px\' }}>{selectedKyk.district}{selectedKyk.district && selectedKyk.city ? \', \' : \'\'}{selectedKyk.city}</p>\n' +
'  </div>\n' +
'  \n' +
'  <div className="kyk-info-box">\n' +
'    {/* Distance card */}\n' +
'    <div style={{ background: \'#f8fafc\', border: \'1px solid #e2e8f0\', padding: \'16px\', borderRadius: \'12px\', marginBottom: \'15px\' }}>\n' +
'      <div style={{ display: \'flex\', alignItems: \'center\', gap: \'8px\', marginBottom: \'10px\' }}>\n' +
'        <span style={{ fontSize: \'18px\' }}>🎓</span>\n' +
'        <h4 style={{ margin: 0, color: \'#475569\', fontSize: \'13px\', textTransform: \'uppercase\', fontWeight: \'700\' }}>En Yakın Kampüs</h4>\n' +
'      </div>\n' +
'      <div style={{ color: \'#0f172a\', fontSize: \'15px\', fontWeight: \'600\' }}>\n' +
'        {(() => {\n' +
'          let minD = Infinity;\n' +
'          let minName = selectedKyk.nearby_campus;\n' +
'          Object.values(campusData).flat().forEach(c => {\n' +
'            if (c.latitude && c.longitude) {\n' +
'              let d = getDistanceFromLatLonInKm(selectedKyk.coordinates.lat, selectedKyk.coordinates.lng, Number(c.latitude), Number(c.longitude));\n' +
'              if (d < minD) {\n' +
'                minD = d;\n' +
'                minName = c.name + (c.universityName ? " (" + c.universityName + ")" : "");\n' +
'              }\n' +
'            }\n' +
'          });\n' +
'          if (minD !== Infinity) {\n' +
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
'          return minName;\n' +
'        })()}\n' +
'      </div>\n' +
'    </div>\n' +
'\n' +
'    {/* Address card */}\n' +
'    <div style={{ background: \'#f8fafc\', padding: \'16px\', borderRadius: \'12px\', border: \'1px solid #e2e8f0\', marginBottom: \'20px\' }}>\n' +
'      <div style={{ display: \'flex\', alignItems: \'center\', gap: \'8px\', marginBottom: \'10px\' }}>\n' +
'        <span style={{ fontSize: \'18px\' }}>🗺️</span>\n' +
'        <h4 style={{ margin: 0, color: \'#475569\', fontSize: \'13px\', textTransform: \'uppercase\', fontWeight: \'700\' }}>Açık Adres</h4>\n' +
'      </div>\n' +
'      <div style={{ color: \'#334155\', fontSize: \'14px\', lineHeight: \'1.5\' }}>\n' +
'        {selectedKyk.address}\n' +
'      </div>\n' +
'    </div>\n' +
'    \n' +
'    <a href={"https://www.google.com/maps/dir/?api=1&destination=" + selectedKyk.coordinates.lat + "," + selectedKyk.coordinates.lng} target="_blank" rel="noreferrer" style={{ display: \'flex\', alignItems: \'center\', justifyContent: \'center\', gap: \'8px\', width: \'100%\', padding: \'14px\', background: \'#2563eb\', color: \'#fff\', borderRadius: \'12px\', textDecoration: \'none\', fontWeight: \'600\', fontSize: \'15px\', transition: \'background 0.2s\', boxSizing: \'border-box\' }}>\n' +
'      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>\n' +
'      Haritalarda Yol Tarifi\n' +
'    </a>\n' +
'  </div>\n' +
'</aside>';

    app = app.replace(oldBlock, newBlock);
    fs.writeFileSync('src/App.jsx', app);
    console.log("Updated KYK Detail Card");
} else {
    console.log("Could not find the aside block");
}
