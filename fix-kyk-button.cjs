const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const kyKButton = `
            <button 
              onClick={() => setShowKyk(!showKyk)}
              style={{ padding: '8px 16px', borderRadius: '20px', border: showKyk ? 'none' : '1px solid #ddd', background: showKyk ? '#e91e63' : '#fff', color: showKyk ? '#fff' : '#444', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s', marginLeft: '10px' }}>
              🏕️ KYK Yurtları
            </button>
            {showKyk && (
              <select 
                value={kykGenderFilter} 
                onChange={(e) => setKykGenderFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #ddd', background: '#fff', color: '#444', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                <option value="Tümü">Tümü</option>
                <option value="Kız">👩 Kız</option>
                <option value="Erkek">👨 Erkek</option>
              </select>
            )}
`;

app = app.replace(
  /(style=\{\{ padding: '8px 16px'[\s\S]*?Önlisans\s*<\/button>)/,
  '$1\n' + kyKButton
);

fs.writeFileSync('src/App.jsx', app);
