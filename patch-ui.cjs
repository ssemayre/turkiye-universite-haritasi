const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /<div style=\{\{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' \}\}>\s*<span style=\{\{ fontSize: '18px' \}\}>📚<\/span>\s*<h4[^>]*>Fakülte ve Bölümler<\/h4>\s*<\/div>\s*<div style=\{\{ color: '#334155', fontSize: '14px', lineHeight: '1\.5' \}\}>[\s\S]*?(?=<\/div>\s*<\/div>\s*<a href=\{)/;

const newBlock = `<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                    <span style={{ fontSize: '18px' }}>📚</span>
                    <h4 style={{ margin: 0, color: '#475569', fontSize: '13px', textTransform: 'uppercase', fontWeight: '700' }}>AKADEMİK BİRİMLER VE BÖLÜMLER (Fakülte / MYO)</h4>
                  </div>
                  <div style={{ color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                    {selectedSubCampus.academicUnits && selectedSubCampus.academicUnits.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {selectedSubCampus.academicUnits.map((unit, idx) => (
                          <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                              <span style={{ background: unit.type === 'MYO' ? '#dbeafe' : (unit.type === 'Fakülte' ? '#fce7f3' : '#f3f4f6'), color: unit.type === 'MYO' ? '#1e40af' : (unit.type === 'Fakülte' ? '#be185d' : '#374151'), padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{unit.type}</span>
                              <strong style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.2' }}>{unit.name}</strong>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                               {unit.programs && unit.programs.map((prog, pidx) => (
                                  <span key={pidx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontSize: '11px', padding: '4px 8px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                     <span style={{ color: prog.degree === 'Önlisans' ? '#0284c7' : '#ea580c', fontWeight: 'bold' }}>[{prog.degree}]</span>
                                     {prog.name}
                                  </span>
                               ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Bu yerleşkeye ait akademik birim/bölüm detayı bulunmuyor.</span>
                    )}`;

const match = app.match(regex);
if (match) {
   app = app.replace(match[0], newBlock);
   fs.writeFileSync('src/App.jsx', app);
   console.log("App.jsx UI updated successfully.");
} else {
   console.log("Could not find the UI block in App.jsx to replace.");
}
