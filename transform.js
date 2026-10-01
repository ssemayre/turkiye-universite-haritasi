
const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add markerRefs, activeCampusFilterId
code = code.replace(
  /const mapUniversities = useMemo/g,
  const markerRefs = useRef({});\n  const [activeCampusFilterId, setActiveCampusFilterId] = useState(null);\n\n  useEffect(() => {\n    setActiveCampusFilterId(null);\n  }, [selectedSubCampus]);\n\n  const mapUniversities = useMemo
);

// 2. Add activeRelatedMyos and displayedUniversities
code = code.replace(
  /const visibleSearchResults = useMemo\(/g,
  const activeRelatedMyos = useMemo(() => {\n    if (!selectedSubCampus || campusDetailTab !== 'campuses') return [];\n    let coreName = normalize(selectedSubCampus.originalUniName || selectedSubCampus.universityName || selectedSubCampus.name).split('(')[0].trim();\n    coreName = coreName.replace(/universitesi/g, '').replace(/uni\\./g, '').replace(/uni/g, '').trim();\n    if (!coreName) coreName = normalize(selectedSubCampus.name).split(' ')[0];\n    return universities.filter(u => {\n      if (u.type !== 'MYO' || u.id === selectedSubCampus.id) return false;\n      const normalizedMyo = normalize(u.name);\n      return (normalizedMyo.includes(coreName) || coreName.includes(normalizedMyo)) && Number.isFinite(Number(u.lat));\n    });\n  }, [selectedSubCampus, campusDetailTab, universities]);\n\n  const displayedUniversities = useMemo(() => {\n    const base = filteredUniversities;\n    const final = [...base];\n    for (const myo of activeRelatedMyos) {\n      if (!base.find(u => u.id === myo.id)) {\n        final.push(myo);\n      }\n    }\n    return final;\n  }, [filteredUniversities, activeRelatedMyos]);\n\n  const visibleSearchResults = useMemo(
);

// 3. Update the MarkerClusterGroup to use displayedUniversities and add ref to Markers
code = code.replace(
  /\{filteredUniversities\.map\(university => \(/g,
  {displayedUniversities.map(university => (
);
code = code.replace(
  /<Marker \\s*\\n\\s*key=\{university\\.id\}/g,
  <Marker \\n                      ref={(r) => { if (r) markerRefs.current[university.id] = r; }}\\n                      key={university.id}
);
code = code.replace(
  /<Marker \\n                      key=\{university\\.id\}/g,
  <Marker \\n                      ref={(r) => { if (r) markerRefs.current[university.id] = r; }}\\n                      key={university.id}
);
// In case the whitespace differs:
code = code.replace(
  /<Marker\\s+key=\{university\\.id\}/g,
  <Marker ref={(r) => { if (r) markerRefs.current[university.id] = r; }} key={university.id}
);


// 4. Update the relatedMyos render in the drawer
code = code.replace(
  /const relatedMyos = universities\\.filter\\(u => \\{[\\s\\S]*?return normalizedMyo\\.includes\\(coreName\\) \\|\\| coreName\\.includes\\(normalizedMyo\\);\\n\\s*\\}\\);/g,
  const relatedMyos = activeRelatedMyos;
);

// 5. Update the MYO click handler to switch to Units tab and filter
code = code.replace(
  /onClick=\{\\(\\) => \\{\\s*setMapFocus\\(\\{ latitude: Number\\(myo\\.latitude\\), longitude: Number\\(myo\\.longitude\\), zoom: 15 \\}\\);\\s*setSelectedSubCampus\\(myo\\);\\s*setCampusDetailTab\\('info'\\);\\s*\\}\\}/g,
  onClick={() => { setMapFocus({ latitude: Number(myo.lat || myo.latitude), longitude: Number(myo.lng || myo.longitude), zoom: 16 }); setActiveCampusFilterId(myo.id); setCampusDetailTab('units'); }}
);

// 6. Update the 'Bölümler' filter to respect activeCampusFilterId
code = code.replace(
  /const filtered = campusPrograms\\.filter\\(p => \\(p\\.name \\|\\| ''\\)\\.toLocaleLowerCase\\('tr-TR'\\)\\.includes\\(programSearchQuery\\.toLocaleLowerCase\\('tr-TR'\\)\\)\\);/g,
  const filtered = campusPrograms.filter(p => {\n                          if (activeCampusFilterId && p.campus_id !== activeCampusFilterId) return false;\n                          return (p.name || '').toLocaleLowerCase('tr-TR').includes(programSearchQuery.toLocaleLowerCase('tr-TR'));\n                        });
);

// 7. Add filter chip above search bar
code = code.replace(
  /<div style=\{\\{ flexShrink: 0, position: 'sticky', top: 0, zIndex: 10, background: '#fff', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' \\}\\}>/g,
  <div style={{ flexShrink: 0, position: 'sticky', top: 0, zIndex: 10, background: '#fff', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>\n                      {activeCampusFilterId && (\n                        <div style={{ marginBottom: '8px', padding: '6px 12px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>\n                          <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>Sadece seçili yerleşke ({universities.find(u => u.id === activeCampusFilterId)?.name || 'Yerleşke'}) bölümleri</span>\n                          <button onClick={() => setActiveCampusFilterId(null)} style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: '16px', padding: 0, lineHeight: 1 }}>&times;</button>\n                        </div>\n                      )}
);

// 8. Update 'Haritada Göster' logic to open popup via ref
code = code.replace(
  /if \\(lat && lng\\) \\{\\s*setMapFocus\\(\\{ latitude: Number\\(lat\\), longitude: Number\\(lng\\), zoom: 16 \\}\\);\\s*\\}/g,
  if (lat && lng) { setMapFocus({ latitude: Number(lat), longitude: Number(lng), zoom: 16 }); setTimeout(() => { const marker = markerRefs.current[target.id]; if (marker) { marker.openPopup(); } }, 300); }
);

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('Transform complete.');
