const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const kykMarkers = `
          {showKyk && (
            <MarkerClusterGroup
              chunkedLoading={true}
              maxClusterRadius={50}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
              disableClusteringAtZoom={13}
            >
              {kykData
                .filter(kyk => kykGenderFilter === "Tümü" || kyk.gender === kykGenderFilter)
                .map(kyk => (
                  <Marker
                    key={\`kyk-\${kyk.id}\`}
                    position={[kyk.coordinates.lat, kyk.coordinates.lng]}
                    icon={kyk.gender === "Kız" ? kykKizIcon : kykErkekIcon}
                    eventHandlers={{ click: () => setSelectedKyk(kyk) }}
                  >
                    <Tooltip direction="top" offset={[0, -18]} opacity={0.95}>
                      <span className="kyk-tooltip">{kyk.name} ({kyk.gender})</span>
                    </Tooltip>
                  </Marker>
              ))}
            </MarkerClusterGroup>
          )}
`;

app = app.replace(
  /<\/MapContainer>/,
  kykMarkers + '\n$&'
);

fs.writeFileSync('src/App.jsx', app);
