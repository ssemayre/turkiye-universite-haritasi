const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// The broken code block is:
/*
                      Object.values(campusData).forEach(uniData => {
            if (uniData && uniData.campuses) {
              uniData.campuses.forEach(c => {
                        if (c.latitude && c.longitude) {
...
                          }
                        }
                      });
                      if (minD !== Infinity && minName) {
...
          return "Kampüs bulunamadı";
              });
            }
          });
        })()}
*/

// I will just use regex to carefully fix this entire IIFE block inside <div style={{ color: '#0f172a' }}>

const iifeRegex = /\{\(\(\) => \{\s*let minD = Infinity;\s*let minName = null;[\s\S]*?return "Kampüs bulunamadı";\s*\}\)?\(\)\s*\}\s*\}\)?\(\)\}/;

app = app.replace(/\{\(\(\) => \{\s*let minD = Infinity;[\s\S]*?\}\)?\(\)\}/, `
        {(() => {
          let minD = Infinity;
          let minName = null;
          Object.values(campusData).forEach(uniData => {
            if (uniData && uniData.campuses) {
              uniData.campuses.forEach(c => {
                if (c.latitude && c.longitude) {
                  let lat = Number(c.latitude);
                  let lng = Number(c.longitude);
                  if (!isNaN(lat) && !isNaN(lng) && selectedKyk && selectedKyk.coordinates && selectedKyk.coordinates.lat) {
                    let d = getDistanceFromLatLonInKm(Number(selectedKyk.coordinates.lat), Number(selectedKyk.coordinates.lng), lat, lng);
                    if (d < minD) {
                      minD = d;
                      minName = c.name + (uniData.universityName ? " (" + uniData.universityName + ")" : "");
                    }
                  }
                }
              });
            }
          });
          if (minD !== Infinity && minName) {
            let walkTime = Math.round((minD / 5) * 60);
            let walkStr = walkTime < 60 ? walkTime + " dk" : Math.round(walkTime/60) + " saat";
            return (
              <div>
                <div style={{ marginBottom: '6px' }}>{minName}</div>
                <div style={{ color: '#6366f1', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>📍 {(minD).toFixed(1)} km</span>
                  <span style={{ color: '#94a3b8' }}>•</span>
                  <span>🚶‍♂️ Yürüyerek ~{walkStr}</span>
                </div>
              </div>
            );
          }
          return "Kampüs bulunamadı";
        })()}
`.trim());

// Also clean up the trailing mess left behind by the bad replace
app = app.replace(/return "Kampüs bulunamadı";\s*\}\)?\(\)\}\s*\}\)?\(\)\}/g, 'return "Kampüs bulunamadı";\n        })()}');
app = app.replace(/\n\s*}\);\n\s*}\n\s*}\);\n\s*}\)\(\)}/g, ''); // just remove dangling ones

fs.writeFileSync('src/App.jsx', app);
