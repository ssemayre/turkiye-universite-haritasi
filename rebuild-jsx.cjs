const fs = require('fs');
let jsx = fs.readFileSync('src/App.jsx', 'utf8');

// The original header code is roughly around <header className="header">.
// I will just add the unified header right before it, and hide it on desktop if needed, 
// OR I will simply replace the header and filters with a unified component!
// Since the prompt explicitly says "Üst arayüzü tek bir kutuya topla ... Başlık, arama çubuğu ve Hızlı Keşfet filtre butonlarını ayrı ayrı absolute veya dağınık yerleştirmeyi bırak",
// I will restructure it directly in the JSX.

// 1. Find the start of the header
const headerStart = jsx.indexOf('<header className="header">');
const mapAreaStart = jsx.indexOf('<main className="map-area">');
const mapContainerStart = jsx.indexOf('<MapContainer');

if (headerStart === -1 || mapAreaStart === -1 || mapContainerStart === -1) {
    console.log("Could not find key markers in App.jsx");
    process.exit(1);
}

// We want to replace everything from `<header className="header">` to `<MapContainer` 
// with the new unified structure.
// Wait! Let's carefully extract the pieces to reuse the state handlers!

const replacement = `
      {/* ========================================
          UNIFIED MOBILE & DESKTOP HEADER
      ======================================== */}
      <header className="header-unified" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000, background: 'rgba(255, 255, 255, 0.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: 'max(12px, env(safe-area-inset-top)) 16px 12px 16px', display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'auto' }}>
        
        {/* Satır 1: Başlık */}
        <div className="logo-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🎓</span> Türkiye Üniversite Haritası
          </h1>
        </div>

        {/* Satır 2: Arama */}
        <div className="search-row">
          <input
            type="text"
            placeholder="🔎 Üniversite, bölüm veya şehir ara..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            style={{ width: '100%', height: '44px', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0 16px', background: '#f1f5f9', color: '#334155', outline: 'none', fontSize: '16px' }}
          />
        </div>

        {/* Satır 3: Hızlı Keşfet ve Filtreler */}
        <div className="filters-row hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          
          <button 
            className={\`pill-btn \${showAllCampuses ? 'active' : ''}\`}
            onClick={() => setShowAllCampuses(!showAllCampuses)}>
            📍 Tüm Yerleşkeler
          </button>

          <button 
            className={\`pill-btn \${showKyk ? 'active' : ''}\`}
            onClick={() => setShowKyk(!showKyk)}>
            🏕️ KYK Yurtları
          </button>

          <button 
            className={\`pill-btn \${typeFilter === 'Devlet Üniversitesi' ? 'active' : ''}\`}
            onClick={() => setTypeFilter(typeFilter === 'Devlet Üniversitesi' ? 'Tümü' : 'Devlet Üniversitesi')}>
            Devlet
          </button>

          <button 
            className={\`pill-btn \${typeFilter === 'Vakıf Üniversitesi' ? 'active' : ''}\`}
            onClick={() => setTypeFilter(typeFilter === 'Vakıf Üniversitesi' ? 'Tümü' : 'Vakıf Üniversitesi')}>
            Vakıf
          </button>

          <button 
            className={\`pill-btn \${educationFilter === 'Lisans' ? 'active' : ''}\`}
            onClick={() => setEducationFilter(educationFilter === 'Lisans' ? 'Tümü' : 'Lisans')}>
            Lisans
          </button>

          <button 
            className={\`pill-btn \${educationFilter === 'Önlisans' ? 'active' : ''}\`}
            onClick={() => setEducationFilter(educationFilter === 'Önlisans' ? 'Tümü' : 'Önlisans')}>
            Önlisans
          </button>

          <button 
            className="pill-btn"
            style={{ background: '#f8fafc' }}
            onClick={() => setFiltersOpen(true)}>
            ⚙ Detaylı Filtre
          </button>

        </div>
      </header>

      {/* ========================================
          MAP
      ======================================== */}
      <main className="map-area-unified" style={{ position: 'absolute', inset: 0, width: '100vw', height: '100dvh', zIndex: 10 }}>
        <MapContainer`;

// Strip from `<header className="header">` up to `<MapContainer`
const contentToReplace = jsx.substring(headerStart, mapContainerStart + '<MapContainer'.length);

jsx = jsx.replace(contentToReplace, replacement);

fs.writeFileSync('src/App.jsx', jsx);
console.log('App.jsx successfully restructured with unified header!');
