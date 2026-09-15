/**
 * inject-social-layer.cjs
 * Tüm sosyal katman özelliklerini (sekmeli drawer, reviews, Q&A) App.jsx'e atomik olarak enjekte eder.
 * Çalıştır: node inject-social-layer.cjs
 */
const fs = require('fs');
const path = require('path');
const appPath = path.join(__dirname, 'src', 'App.jsx');

let code = fs.readFileSync(appPath, 'utf8');

// ──────────────────────────────────────────────────────────────
// 1. Yeni state'leri + mock verileri + getDirectionsUrl'i ekle
// ──────────────────────────────────────────────────────────────
const STATE_ANCHOR = `function App() {`;
const STATE_INJECTION = `function App() {

  // ── SOSYAL KATMAN STATE & YARDIMCILAR ──────────────────────
  const [campusDetailTab, setCampusDetailTab] = useState('info');
  const [expandedUnits, setExpandedUnits] = useState({});
  const [reviewVotes, setReviewVotes] = useState({});
  const [qaVotes, setQaVotes] = useState({});

  useEffect(() => {
    setCampusDetailTab('info');
    setExpandedUnits({});
  }, [selectedSubCampus?.id]); // eslint-disable-line

  const getDirectionsUrl = (lat, lng) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    return isIOS
      ? \`http://maps.apple.com/?daddr=\${lat},\${lng}\`
      : \`https://www.google.com/maps/dir/?api=1&destination=\${lat},\${lng}\`;
  };

  const MOCK_REVIEWS = [
    { id: 1, author: 'Elif K.', avatar: '👩‍🎓', rating: 5, date: 'Eylül 2025',
      text: 'Kampüs çok yeşil ve bakımlı. Kütüphane 7/24 açık, çalışmak için harika bir ortam. Ulaşım biraz zor ama metro bekleniyor.' },
    { id: 2, author: 'Ahmet Y.', avatar: '👨‍🎓', rating: 4, date: 'Ağustos 2025',
      text: 'Sosyal olanaklar oldukça iyi. Yemekhane fiyatları öğrenci bütçesine uygun. Spor salonu yakın zamanda yenilendi.' },
    { id: 3, author: 'Zeynep M.', avatar: '👩‍💻', rating: 3, date: 'Temmuz 2025',
      text: 'Akademik kadro güçlü fakat bazı binalarda klima sorunu var. Staj imkanları için üniversite çok destek veriyor.' },
  ];

  const MOCK_QA = [
    {
      id: 1, votes: 12,
      question: 'Yurt başvurusu için son tarih ne zaman ve KYK yurt kapasitesi yeterli mi?',
      author: 'Mert T.', date: 'Eylül 2025',
      answers: [
        { id: 1, author: 'Eski Öğrenci', avatar: '🎓', votes: 8,
          text: 'KYK başvuruları genellikle Ağustos ortasında açılır. Yerleşke yakınında devlet yurdu kapasitesi 2000+ kişilik, erken başvurursanız sorun yaşamazsınız.' },
        { id: 2, author: 'Ayşe D.', avatar: '👩‍🏫', votes: 3,
          text: 'Özel yurtlar da mevcut, fiyatlar aylık 3000–6000 TL arası. Üniversitenin öğrenci işleri sayfasını düzenli takip edin.' },
      ]
    },
    {
      id: 2, votes: 7,
      question: 'Kampüs içinde kafeterya dışında yemek alternatifleri var mı?',
      author: 'Selin A.', date: 'Ağustos 2025',
      answers: [
        { id: 1, author: 'Burak Ö.', avatar: '👨‍🍳', votes: 5,
          text: 'Merkez binada Starbucks lisanslı kafe ve birkaç küçük snack bar var. Ayrıca yürüme mesafesinde çarşı bölgesi mevcut.' },
      ]
    },
  ];
`;

if (!code.includes('campusDetailTab')) {
  code = code.replace(STATE_ANCHOR, STATE_INJECTION);
  console.log('✅ State & mock veriler eklendi.');
} else {
  console.log('⏭️  State zaten mevcut, atlanıyor.');
}

// ──────────────────────────────────────────────────────────────
// 2. selectedSubCampus drawer'ını değiştir
// ──────────────────────────────────────────────────────────────
// Eski bloğu bul: {selectedSubCampus && ( <aside className="kyk-detail program-detail"> ... </aside> )}
// NOT: Regex yerine string split kullanıyoruz çünkü blok çok büyük
const DRAWER_START = `        {selectedSubCampus && (
          <aside className="kyk-detail program-detail">`;
const DRAWER_END = `          </aside>
        )}`;

if (!code.includes('campus-social-drawer')) {
  const startIdx = code.indexOf(DRAWER_START);
  if (startIdx === -1) { console.error('❌ Drawer başlangıcı bulunamadı!'); process.exit(1); }

  // DRAWER_END'i DRAWER_START'tan sonra bul
  const endIdx = code.indexOf(DRAWER_END, startIdx);
  if (endIdx === -1) { console.error('❌ Drawer sonu bulunamadı!'); process.exit(1); }

  const NEW_DRAWER = `        {selectedSubCampus && (
          <aside
            className="campus-social-drawer"
            onTouchStart={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
            onWheel={e => e.stopPropagation()}
          >
            {/* ── KAPATMA BUTONU ── */}
            <button className="close-button" onClick={() => setSelectedSubCampus(null)}>✕</button>

            {/* ── BAŞLIK ── */}
            <div className="csd-header">
              <div className="csd-badges">
                <span className="csd-badge csd-badge--purple">Üniversite Yerleşkesi</span>
                <span className={\`csd-badge \${selectedSubCampus.isMain ? 'csd-badge--amber' : 'csd-badge--green'}\`}>
                  {selectedSubCampus.isMain ? 'Ana Kampüs' : 'Alt Yerleşke'}
                </span>
              </div>
              <h2 className="csd-title">{selectedSubCampus.name}</h2>
              <p className="csd-subtitle">{selectedSubCampus.universityName}</p>
            </div>

            {/* ── TAB BAR ── */}
            <div className="csd-tabbar">
              {[
                { key: 'info',    label: 'Bilgi',            icon: 'ℹ️' },
                { key: 'units',   label: 'Bölümler',         icon: '🎓' },
                { key: 'reviews', label: 'Değerlendirmeler', icon: '⭐' },
                { key: 'qa',      label: 'Soru & Cevap',     icon: '❓' },
              ].map(tab => (
                <button
                  key={tab.key}
                  className={\`csd-tab \${campusDetailTab === tab.key ? 'csd-tab--active' : ''}\`}
                  onClick={() => setCampusDetailTab(tab.key)}
                >
                  <span className="csd-tab-icon">{tab.icon}</span>
                  <span className="csd-tab-label">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ── SEKME İÇERİKLERİ ── */}
            <div className="csd-body">

              {/* ━━ BİLGİ ━━ */}
              {campusDetailTab === 'info' && (
                <div className="csd-section-list">
                  <div className="csd-card">
                    <div className="csd-card-header"><span>🗺️</span><h4>Açık Adres</h4></div>
                    <p className="csd-card-text">
                      {selectedSubCampus.address ||
                        [selectedSubCampus.district, selectedSubCampus.city].filter(Boolean).join(', ') ||
                        'Adres bilgisi mevcut değil'}
                    </p>
                  </div>
                  {selectedSubCampus.latitude && (
                    <div className="csd-card">
                      <div className="csd-card-header"><span>📍</span><h4>Koordinatlar</h4></div>
                      <p className="csd-card-text" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                        {Number(selectedSubCampus.latitude).toFixed(6)}, {Number(selectedSubCampus.longitude).toFixed(6)}
                      </p>
                    </div>
                  )}
                  <a
                    href={getDirectionsUrl(selectedSubCampus.latitude, selectedSubCampus.longitude)}
                    target="_blank" rel="noreferrer"
                    className="csd-directions-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    Yol Tarifi Al
                  </a>
                </div>
              )}

              {/* ━━ BÖLÜMLER ━━ */}
              {campusDetailTab === 'units' && (
                <div className="csd-section-list">
                  {selectedSubCampus.academicUnits && selectedSubCampus.academicUnits.length > 0 ? (
                    selectedSubCampus.academicUnits.map((unit, idx) => (
                      <div key={idx} className="csd-accordion-item">
                        <button
                          className="csd-accordion-trigger"
                          onClick={() => setExpandedUnits(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        >
                          <span className={\`csd-unit-badge \${unit.type === 'MYO' ? 'csd-unit-badge--blue' : unit.type === 'Fakülte' ? 'csd-unit-badge--pink' : 'csd-unit-badge--gray'}\`}>
                            {unit.type}
                          </span>
                          <span className="csd-accordion-name">{unit.name}</span>
                          <span className={\`csd-accordion-arrow \${expandedUnits[idx] ? 'csd-accordion-arrow--open' : ''}\`}>▼</span>
                        </button>
                        {expandedUnits[idx] && (
                          <div className="csd-accordion-body">
                            {unit.programs && unit.programs.length > 0 ? (
                              <div className="csd-program-list">
                                {unit.programs.map((prog, pidx) => (
                                  <span key={pidx} className="csd-program-chip">
                                    <span className={\`csd-degree-badge \${prog.degree === 'Önlisans' ? 'csd-degree-badge--blue' : 'csd-degree-badge--orange'}\`}>
                                      {prog.degree}
                                    </span>
                                    {prog.name}
                                  </span>
                                ))}
                              </div>
                            ) : <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Bölüm bilgisi yok.</p>}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="csd-empty">Bu yerleşkeye ait akademik birim bilgisi bulunmuyor.</div>
                  )}
                </div>
              )}

              {/* ━━ DEĞERLENDİRMELER ━━ */}
              {campusDetailTab === 'reviews' && (
                <div className="csd-section-list">
                  <div className="csd-rating-summary">
                    <div className="csd-rating-score">4.0</div>
                    <div>
                      <div className="csd-stars">{'★'.repeat(4)}{'☆'.repeat(1)}</div>
                      <div className="csd-rating-count">{MOCK_REVIEWS.length} değerlendirme</div>
                    </div>
                    <button className="csd-add-review-btn">+ Yorum Yap</button>
                  </div>
                  {MOCK_REVIEWS.map(review => (
                    <div key={review.id} className="csd-review-card">
                      <div className="csd-review-top">
                        <span className="csd-review-avatar">{review.avatar}</span>
                        <div className="csd-review-meta">
                          <span className="csd-review-author">{review.author}</span>
                          <span className="csd-review-date">{review.date}</span>
                        </div>
                        <div className="csd-review-stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} style={{ color: i < review.rating ? '#f59e0b' : '#e2e8f0', fontSize: '15px' }}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="csd-review-text">{review.text}</p>
                      <div className="csd-review-actions">
                        <button
                          className={\`csd-vote-btn \${reviewVotes[review.id] === 'up' ? 'csd-vote-btn--active' : ''}\`}
                          onClick={() => setReviewVotes(p => ({ ...p, [review.id]: p[review.id] === 'up' ? null : 'up' }))}
                        >👍 Yararlı</button>
                        <button
                          className={\`csd-vote-btn \${reviewVotes[review.id] === 'down' ? 'csd-vote-btn--active-down' : ''}\`}
                          onClick={() => setReviewVotes(p => ({ ...p, [review.id]: p[review.id] === 'down' ? null : 'down' }))}
                        >👎</button>
                      </div>
                    </div>
                  ))}
                  <button className="csd-load-more-btn">Tüm yorumları gör →</button>
                </div>
              )}

              {/* ━━ SORU & CEVAP ━━ */}
              {campusDetailTab === 'qa' && (
                <div className="csd-section-list">
                  <button className="csd-ask-btn">+ Soru Sor</button>
                  {MOCK_QA.map(qa => (
                    <div key={qa.id} className="csd-qa-item">
                      <div className="csd-qa-question-row">
                        <div className="csd-qa-votes">
                          <button
                            className={\`csd-upvote \${(qaVotes[\`q\${qa.id}\`] || 0) > 0 ? 'csd-upvote--active' : ''}\`}
                            onClick={() => setQaVotes(p => ({ ...p, [\`q\${qa.id}\`]: (p[\`q\${qa.id}\`] || 0) > 0 ? 0 : 1 }))}
                          >▲</button>
                          <span className="csd-vote-count">{qa.votes + (qaVotes[\`q\${qa.id}\`] || 0)}</span>
                          <button className="csd-downvote">▼</button>
                        </div>
                        <div className="csd-qa-question-body">
                          <p className="csd-qa-question-text">{qa.question}</p>
                          <div className="csd-qa-meta">
                            <span>💬 {qa.answers.length} cevap</span>
                            <span className="csd-qa-author">{qa.author}</span>
                            <span className="csd-qa-date">{qa.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="csd-qa-answers">
                        {qa.answers.map(ans => (
                          <div key={ans.id} className="csd-answer-row">
                            <div className="csd-qa-votes csd-qa-votes--sm">
                              <button
                                className={\`csd-upvote \${(qaVotes[\`a\${qa.id}-\${ans.id}\`] || 0) > 0 ? 'csd-upvote--active' : ''}\`}
                                onClick={() => setQaVotes(p => ({ ...p, [\`a\${qa.id}-\${ans.id}\`]: (p[\`a\${qa.id}-\${ans.id}\`] || 0) > 0 ? 0 : 1 }))}
                              >▲</button>
                              <span className="csd-vote-count csd-vote-count--sm">{ans.votes + (qaVotes[\`a\${qa.id}-\${ans.id}\`] || 0)}</span>
                            </div>
                            <div className="csd-answer-body">
                              <div className="csd-answer-author">
                                <span>{ans.avatar}</span>
                                <strong>{ans.author}</strong>
                              </div>
                              <p className="csd-answer-text">{ans.text}</p>
                            </div>
                          </div>
                        ))}
                        <button className="csd-answer-btn">Cevapla</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </aside>
        )}`;

  code = code.slice(0, startIdx) + NEW_DRAWER + code.slice(endIdx + DRAWER_END.length);
  console.log('✅ Drawer yeniden yazıldı.');
} else {
  console.log('⏭️  Drawer zaten güncel, atlanıyor.');
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('💾 App.jsx kaydedildi.');
