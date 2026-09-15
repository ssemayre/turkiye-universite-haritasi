const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add states
app = app.replace(
  'const [selectedKyk, setSelectedKyk] = useState(null);',
  'const [selectedKyk, setSelectedKyk] = useState(null);\n  const [showAllCampuses, setShowAllCampuses] = useState(false);\n  const [selectedSubCampus, setSelectedSubCampus] = useState(null);'
);

// 2. Add icons
const iconsStr = `
const mainCampusIcon = L.divIcon({
  className: "campus-marker main-campus",
  html: \`<div style="background:#f59e0b; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(245,158,11,0.4); border: 2px solid white;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>\`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const subCampusIcon = L.divIcon({
  className: "campus-marker sub-campus",
  html: \`<div style="background:#10b981; color:white; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(16,185,129,0.4); border: 2px solid white;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg></div>\`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
`;
app = app.replace('const kykKizIcon =', iconsStr + '\nconst kykKizIcon =');

// 3. Add allCampusesList useMemo
const listUseMemo = `
  const allCampusesList = useMemo(() => {
    let list = [];
    Object.values(campusData).forEach(uniData => {
      if (uniData && uniData.campuses) {
        uniData.campuses.forEach(campus => {
          if (campus.latitude && campus.longitude && !isNaN(Number(campus.latitude)) && !isNaN(Number(campus.longitude))) {
            list.push({ ...campus, universityName: uniData.universityName });
          }
        });
      }
    });
    return list;
  }, []);
`;
app = app.replace('const universityCampuses = useMemo(() => {', listUseMemo + '\n  const universityCampuses = useMemo(() => {');

// 4. Add Toggle Button
const toggleBtn = `
            <button 
              onClick={() => setShowAllCampuses(!showAllCampuses)}
              style={{ padding: '8px 16px', borderRadius: '20px', border: showAllCampuses ? 'none' : '1px solid #ddd', background: showAllCampuses ? '#8b5cf6' : '#fff', color: showAllCampuses ? '#fff' : '#444', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s', marginLeft: '10px' }}>
              📍 Tüm Yerleşkeler
            </button>
`;
app = app.replace(
  '<button \n              onClick={() => setShowKyk(!showKyk)}',
  toggleBtn + '\n            <button \n              onClick={() => setShowKyk(!showKyk)}'
);

// 5. Replace Map Rendering Logic
// We will find `<MarkerClusterGroup` and `</MarkerClusterGroup>` for filteredUniversities.
const oldCluster = `            <MarkerClusterGroup
              chunkedLoading={true}
              maxClusterRadius={70}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
              disableClusteringAtZoom={12}
            >
              {filteredUniversities.map((university) => (
                <Marker
                  key={university.id}
                  position={[university.latitude, university.longitude]}
                  icon={selectedUniversity?.id === university.id ? selectedUniversityIcon : universityIcon}
                >
                  <Tooltip direction="top" offset={[0, -35]} opacity={0.95} sticky>
                    <span className="university-tooltip">{university.name}</span>
                  </Tooltip>

                  <Popup>
                    <div className="popup">
                      <h2>{university.name}</h2>
                      <p><strong>Şehir:</strong> {university.city}</p>
                      <p><strong>Tür:</strong> {university.type}</p>
                      <button className="open-university-button" onClick={() => openUniversity(university)}>
                        Üniversiteyi incele
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>`;

const newCluster = `            {showAllCampuses ? (
              <MarkerClusterGroup
                chunkedLoading={true}
                maxClusterRadius={70}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
                zoomToBoundsOnClick={true}
                disableClusteringAtZoom={13}
              >
                {allCampusesList.map(campus => (
                   <Marker 
                      key={campus.id} 
                      position={[Number(campus.latitude), Number(campus.longitude)]} 
                      icon={campus.isMain ? mainCampusIcon : subCampusIcon} 
                      eventHandlers={{ click: () => setSelectedSubCampus(campus) }}
                   >
                      <Tooltip direction="top" offset={[0, -18]} opacity={0.95} sticky>
                         <span className="university-tooltip"><strong>{campus.universityName}</strong><br/>{campus.name}</span>
                      </Tooltip>
                   </Marker>
                ))}
              </MarkerClusterGroup>
            ) : (
` + oldCluster + `\n            )}`;

app = app.replace(oldCluster, newCluster);

// 6. Fix KYK Distance Logic
const oldDist = `Object.values(campusData).flat().forEach(c => {
            if (c.latitude && c.longitude) {`;
const newDist = `Object.values(campusData).forEach(uniData => {
            if (uniData && uniData.campuses) {
              uniData.campuses.forEach(c => {
                if (c.latitude && c.longitude) {`;
app = app.replace(oldDist, newDist);
app = app.replace(
  'return "Kampüs bulunamadı";\n        })()}',
  'return "Kampüs bulunamadı";\n              });\n            }\n          });\n        })()}'
);

// 7. Add SubCampus Detail Panel at the end
const subCampusPanel = `
        {selectedSubCampus && (
          <aside className="kyk-detail program-detail">
              <div className="sheet-pull-handle-visual"></div>
              <button
                className="close-button"
                onClick={() => setSelectedSubCampus(null)}
              >
                ✕
              </button>
              <div className="kyk-panel-header" style={{ marginBottom: '15px', paddingTop: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ background: '#8b5cf6', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>Üniversite Yerleşkesi</span>
                  <span style={{ background: selectedSubCampus.isMain ? '#fef3c7' : '#d1fae5', color: selectedSubCampus.isMain ? '#b45309' : '#047857', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>{selectedSubCampus.isMain ? 'Ana Kampüs' : 'Alt Yerleşke'}</span>
                </div>
                <h2 style={{ fontSize: '20px', margin: '5px 0', color: '#1e293b', fontWeight: '700', lineHeight: '1.3' }}>{selectedSubCampus.name}</h2>
                <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>{selectedSubCampus.universityName}</p>
              </div>
              
              <div className="kyk-info-box" style={{ overflowY: 'auto', maxHeight: 'calc(100% - 130px)' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '18px' }}>🗺️</span>
                    <h4 style={{ margin: 0, color: '#475569', fontSize: '13px', textTransform: 'uppercase', fontWeight: '700' }}>Açık Adres</h4>
                  </div>
                  <div style={{ color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                    {selectedSubCampus.address || (selectedSubCampus.district + ", " + selectedSubCampus.city)}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '18px' }}>📚</span>
                    <h4 style={{ margin: 0, color: '#475569', fontSize: '13px', textTransform: 'uppercase', fontWeight: '700' }}>Fakülte ve Bölümler</h4>
                  </div>
                  <div style={{ color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                    {selectedSubCampus.facultyNames && selectedSubCampus.facultyNames.length > 0 ? (
                      <ul style={{ paddingLeft: '20px', margin: 0 }}>
                        {selectedSubCampus.facultyNames.map((fac, idx) => (
                          <li key={idx} style={{ marginBottom: '8px', fontWeight: '500' }}>{fac}</li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Bu yerleşkeye ait fakülte detayı bulunmuyor.</span>
                    )}
                  </div>
                </div>
                
                <a href={"https://www.google.com/maps/dir/?api=1&destination=" + selectedSubCampus.latitude + "," + selectedSubCampus.longitude} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', background: '#8b5cf6', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '15px', transition: 'background 0.2s', boxSizing: 'border-box' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                  Haritalarda Yol Tarifi
                </a>
              </div>
          </aside>
        )}
`;

app = app.replace('</main>', subCampusPanel + '\n      </main>');

fs.writeFileSync('src/App.jsx', app);
console.log('App.jsx successfully patched for All Campuses mode!');
