const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const targetStr =           <aside className="browse-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="browse-panel-header" style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
              <div>
                <div className="detail-label" style={{ color: '#3b82f6' }}>KAMPÜS AKIÞI</div>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>
                  {userProfileData.university_name || 'Kampüs'}
                </h2>
              </div>
              <button className="close-button" onClick={() => setBrowseOpen(false)}>×</button>
            </div>;

const replacementStr =           <aside className="browse-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="browse-panel-header" style={{ padding: '16px 16px 0 16px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div className="detail-label" style={{ color: '#3b82f6' }}>KAMPÜS</div>
                  <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>
                    {userProfileData.university_name || 'Kampüs'}
                  </h2>
                </div>
                <button className="close-button" onClick={() => setBrowseOpen(false)}>×</button>
              </div>
              
              {user && userProfileData.university_name && (
                <div style={{ display: 'flex' }}>
                  <button onClick={() => setCampusTab('feed')} style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: campusTab === 'feed' ? '2px solid #3b82f6' : '2px solid transparent', color: campusTab === 'feed' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '15px' }}>Akýþ</button>
                  <button onClick={() => setCampusTab('clubs')} style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: campusTab === 'clubs' ? '2px solid #3b82f6' : '2px solid transparent', color: campusTab === 'clubs' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '15px' }}>Kulüpler</button>
                </div>
              )}
            </div>;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('Header replaced.');
