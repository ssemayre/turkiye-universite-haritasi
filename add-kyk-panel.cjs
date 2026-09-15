const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const kykPanel = `
        {selectedKyk && (
          <aside className="kyk-detail program-detail">
              <div className="sheet-pull-handle-visual"></div>
              <button
                className="close-button"
                onClick={() => setSelectedKyk(null)}
              >
                ✕
              </button>
              <div className="kyk-panel-header" style={{ marginBottom: '20px' }}>
                <div className="detail-label">KYK YURDU</div>
                <h2 style={{ fontSize: '20px', margin: '5px 0' }}>{selectedKyk.name}</h2>
                <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>{selectedKyk.district}, {selectedKyk.city}</p>
              </div>
              
              <div className="kyk-info-box">
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1, background: '#f5f7fa', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '5px' }}>{selectedKyk.gender === 'Kız' ? '👩‍🎓' : '👨‍🎓'}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#444' }}>{selectedKyk.gender} Yurdu</div>
                  </div>
                  <div style={{ flex: 1, background: '#f5f7fa', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '5px' }}>📍</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#444' }}>KYGM</div>
                  </div>
                </div>
                
                <div style={{ background: '#eef2ff', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#3730a3', fontSize: '13px', textTransform: 'uppercase' }}>En Yakın Kampüs</h4>
                  <div style={{ color: '#312e81', fontWeight: '600', fontSize: '14px' }}>
                    {(() => {
                      let minD = Infinity;
                      let minName = selectedKyk.nearby_campus;
                      campusData.forEach(c => {
                        if (c.latitude && c.longitude) {
                          let d = getDistanceFromLatLonInKm(selectedKyk.coordinates.lat, selectedKyk.coordinates.lng, Number(c.latitude), Number(c.longitude));
                          if (d < minD) {
                            minD = d;
                            minName = c.name + (c.universityName ? " (" + c.universityName + ")" : "");
                          }
                        }
                      });
                      if (minD !== Infinity) {
                        return minName + " - " + (minD).toFixed(1) + " km";
                      }
                      return minName;
                    })()}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Açık Adres</h4>
                  <div style={{ color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                    {selectedKyk.address}
                  </div>
                </div>
              </div>
          </aside>
        )}
`;

app = app.replace(
  /<\/main>/,
  kykPanel + '\n$&'
);

fs.writeFileSync('src/App.jsx', app);
