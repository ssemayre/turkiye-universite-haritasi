const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

// 1. Rename kyk-yurtlari to kyk-dorms
content = content.replace(
  /import kykData from "\.\/data\/kyk-yurtlari\.json";/,
  'import kykData from "./data/kyk-dorms.json";'
);

// 2. Change KYK Icons to Bed Icons
const oldKizIcon = /<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"><\/path><polyline points="9 22 9 12 15 12 15 22"><\/polyline>/g;
const newBedIcon = `<path d="M3 7v11m0-4h18m0 4v-8a2 2 0 0 0-2-2H8m-5 6h18"/>`;
content = content.replace(oldKizIcon, newBedIcon);

// 3. Add state for accordion and direction URL helper inside App component
const stateHookPos = content.indexOf('const [showKyk, setShowKyk] = useState(false);');
if (stateHookPos !== -1 && !content.includes('expandedUnits')) {
  content = content.slice(0, stateHookPos) + 
    'const [expandedUnits, setExpandedUnits] = useState({});\n  ' +
    'const getDirectionsUrl = (lat, lng) => {\n' +
    '    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;\n' +
    '    return isIOS ? `http://maps.apple.com/?daddr=${lat},${lng}` : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;\n' +
    '  };\n  ' +
    content.slice(stateHookPos);
}

// 4. Remove Popup from selectedCampus Marker
const selectedCampusMarkerBlock = `                  <Marker
                    key={selectedCampus.id}
                    position={[selectedCampus.latitude, selectedCampus.longitude]}
                    icon={selectedCampusIcon}
                  >
                    <Tooltip direction="top" offset={[0, -18]} opacity={0.95}>
                      <span className="campus-tooltip">{selectedCampus.name}</span>
                    </Tooltip>
                    <Popup>
                      <div className="campus-popup">
                        <div className="detail-label">{selectedCampus.isMain ? "ANA YERLEŞKE" : "YERLEŞKE"}</div>
                        <h3>{selectedCampus.name}</h3>
                        <p>{selectedCampus.district ? \`\${selectedCampus.district}, \${selectedCampus.city}\` : selectedCampus.city}</p>
                      </div>
                    </Popup>
                  </Marker>`;

const newSelectedCampusMarkerBlock = `                  <Marker
                    key={selectedCampus.id}
                    position={[selectedCampus.latitude, selectedCampus.longitude]}
                    icon={selectedCampusIcon}
                    eventHandlers={{ click: () => setSelectedSubCampus(selectedCampus) }}
                  >
                    <Tooltip direction="top" offset={[0, -18]} opacity={0.95}>
                      <span className="campus-tooltip">{selectedCampus.name}</span>
                    </Tooltip>
                  </Marker>`;

// To make it robust, let's use Regex to replace the Popup block.
content = content.replace(
  /<Marker\s+key=\{selectedCampus\.id\}[\s\S]*?<\/Marker>/,
  newSelectedCampusMarkerBlock
);


// 5. Remove Popup from University Marker
const uniMarkerRegex = /<Marker\s+key=\{university\.id\}\s+position=\{\[university\.latitude,\s*university\.longitude\]\}\s+icon=\{universityIcon\}\s*>\s*<Tooltip[^>]*>[\s\S]*?<\/Tooltip>\s*<Popup>[\s\S]*?<\/Popup>\s*<\/Marker>/g;

content = content.replace(uniMarkerRegex, (match) => {
  // Extract university.name and keep tooltip but remove popup, add onClick
  return `<Marker
                  key={university.id}
                  position={[university.latitude, university.longitude]}
                  icon={universityIcon}
                  eventHandlers={{ click: () => openUniversity(university) }}
                >
                  <Tooltip direction="top" offset={[0, -35]} opacity={0.95} sticky>
                    <span className="university-tooltip">{university.name}</span>
                  </Tooltip>
                </Marker>`;
});

// 6. Update Accordion logic in selectedSubCampus Drawer
const oldUnitsMap = /{selectedSubCampus\.academicUnits\.map\(\(unit, idx\) => \([\s\S]*?\}\)\]\} \{prog\.name\}\s*<\/span>\s*\)\)\}\s*<\/div>\s*<\/div>\s*\)\)\}/;

const newUnitsMap = `{selectedSubCampus.academicUnits.map((unit, idx) => (
                          <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div 
                              style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}
                              onClick={() => setExpandedUnits(prev => ({ ...prev, [idx]: !prev[idx] }))}
                            >
                              <span style={{ background: unit.type === 'MYO' ? '#dbeafe' : (unit.type === 'Fakülte' ? '#fce7f3' : '#f3f4f6'), color: unit.type === 'MYO' ? '#1e40af' : (unit.type === 'Fakülte' ? '#be185d' : '#374151'), padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{unit.type}</span>
                              <strong style={{ fontSize: "16px", color: '#1e293b', lineHeight: '1.2', flex: 1 }}>{unit.name}</strong>
                              <span style={{ fontSize: '18px', fontWeight: 'bold', transform: expandedUnits[idx] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                            </div>
                            
                            {expandedUnits[idx] && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                                {unit.programs && unit.programs.map((prog, pidx) => (
                                  <span key={pidx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontSize: '11px', padding: '4px 8px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: prog.degree === 'Önlisans' ? '#0284c7' : '#ea580c', fontWeight: 'bold' }}>[{prog.degree}]</span>
                                    {prog.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}`;

content = content.replace(oldUnitsMap, newUnitsMap);

// 7. Update Directions URL
const oldDirectionLink = /<a href=\{"https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=" \+ selectedSubCampus\.latitude \+ "," \+ selectedSubCampus\.longitude\} target="_blank" rel="noreferrer"[^>]*>/;
const newDirectionLink = `<a href={getDirectionsUrl(selectedSubCampus.latitude, selectedSubCampus.longitude)} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', background: '#8b5cf6', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '15px', transition: 'background 0.2s', boxSizing: 'border-box' }}>`;

content = content.replace(oldDirectionLink, newDirectionLink);


// Write back
fs.writeFileSync(appJsxPath, content, 'utf8');
console.log('App.jsx has been patched successfully.');
