const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /<MarkerClusterGroup[\s\S]*?\{filteredUniversities\.map\([\s\S]*?<\/MarkerClusterGroup>/;
const match = app.match(regex);
console.log('Match found:', !!match);

if (match) {
  const newCluster = `{showAllCampuses ? (
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
            ) : (\n` + match[0] + `\n            )}`;
            
  app = app.replace(match[0], newCluster);
  fs.writeFileSync('src/App.jsx', app);
  console.log('Successfully replaced!');
}
