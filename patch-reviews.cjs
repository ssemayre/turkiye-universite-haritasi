const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add supabase import
if (!code.includes("import { supabase }")) {
  code = code.replace(
    "import { useAuth } from './AuthContext';",
    "import { useAuth } from './AuthContext';\nimport { supabase } from './supabaseClient';"
  );
}

// 2. Add Review states and effect
const stateInsert = \  const [campusDetailTab, setCampusDetailTab] = useState('info');
  // --- YENİ YORUM YAPISI ---
  const [realReviews, setRealReviews] = useState([]);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (selectedSubCampus && campusDetailTab === 'reviews') {
      fetchReviews();
    }
  }, [selectedSubCampus?.id, campusDetailTab]);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('campus_id', selectedSubCampus.id)
      .order('created_at', { ascending: false });
    if (data) setRealReviews(data);
  };

  const submitReview = async () => {
    if (reviewRating === 0) {
      alert('Lütfen bir yıldız puanı seçin!');
      return;
    }
    if (!reviewContent.trim()) {
      alert('Lütfen yorumunuzu yazın!');
      return;
    }
    setIsSubmittingReview(true);
    
    // Check if profile exists, if not create a minimal one.
    const { data: prof, error: profErr } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    if (!prof) {
       await supabase.from('profiles').insert({
          id: user.id,
          full_name: user.email?.split('@')[0] || 'Anonim Kullanıcı'
       });
    }

    const { data, error } = await supabase.from('comments').insert({
      campus_id: selectedSubCampus.id,
      user_id: user.id,
      rating: reviewRating,
      content: reviewContent
    }).select('*, profiles(full_name, avatar_url)').single();

    setIsSubmittingReview(false);
    
    if (error) {
      alert('Yorum gönderilirken hata oluştu: ' + error.message);
    } else {
      setIsReviewFormOpen(false);
      setReviewRating(0);
      setReviewContent('');
      setRealReviews([data, ...realReviews]);
      alert('Yorumunuz başarıyla eklendi!');
    }
  };\;

code = code.replace(/  const \[campusDetailTab, setCampusDetailTab\] = useState\('info'\);/g, stateInsert);

// 3. Replace the review rendering logic
const reviewsUIOld = \              {campusDetailTab === 'reviews' && (
                <div className="csd-section-list">
                  <div className="csd-rating-summary">
                    <div className="csd-rating-score">4.0</div>
                    <div>
                      <div className="csd-stars">★★★★☆</div>
                      <div className="csd-rating-count">{MOCK_REVIEWS.length} değerlendirme</div>
                    </div>
                    <button 
                      className="csd-add-review-btn" 
                      onClick={() => user ? alert('Harika! Giriş yapmış durumdasınız. Yorum yapma formu çok yakında eklenecektir.') : openAuthModal()}
                    >
                      + Yorum Yap
                    </button>
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
                            <span key={i} style={{ color: i < review.rating ? '#f59e0b' : '#e2e8f0', fontSize: '15px' }}>★ </span>
                          ))}
                        </div>
                      </div>
                      <p className="csd-review-text">{review.text}</p>
                      <div className="csd-review-actions">
                        <button
                          className={\csd-vote-btn \\}
                          onClick={() => handleReviewVote(review.id, 'up')}
                        >
                          👍 {review.upvotes + (reviewVotes[review.id] === 'up' ? 1 : 0)}
                        </button>
                        <button
                          className={\csd-vote-btn \\}
                          onClick={() => handleReviewVote(review.id, 'down')}
                        >
                          👎 {review.downvotes + (reviewVotes[review.id] === 'down' ? 1 : 0)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}\;

const reviewsUINew = \              {campusDetailTab === 'reviews' && (
                <div className="csd-section-list">
                  <div className="csd-rating-summary">
                    <div className="csd-rating-score">
                      {(realReviews.length > 0 ? (realReviews.reduce((a,b) => a + b.rating, 0) / realReviews.length).toFixed(1) : "0.0")}
                    </div>
                    <div>
                      <div className="csd-stars" style={{ color: '#f59e0b' }}>
                        {'★'.repeat(Math.round(realReviews.length > 0 ? (realReviews.reduce((a,b) => a + b.rating, 0) / realReviews.length) : 0))}
                        {'☆'.repeat(5 - Math.round(realReviews.length > 0 ? (realReviews.reduce((a,b) => a + b.rating, 0) / realReviews.length) : 0))}
                      </div>
                      <div className="csd-rating-count">{realReviews.length} değerlendirme</div>
                    </div>
                    {!isReviewFormOpen && (
                      <button 
                        className="csd-add-review-btn" 
                        onClick={() => user ? setIsReviewFormOpen(true) : openAuthModal()}
                      >
                        + Yorum Yap
                      </button>
                    )}
                  </div>
                  
                  {isReviewFormOpen && (
                    <div className="csd-review-form" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>Puanınız</h4>
                      <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <span 
                            key={star} 
                            onClick={() => setReviewRating(star)}
                            style={{ cursor: 'pointer', fontSize: '24px', color: star <= reviewRating ? '#f59e0b' : '#cbd5e1' }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>Yorumunuz</h4>
                      <textarea 
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        placeholder="Bu yerleşke hakkında ne düşünüyorsunuz?"
                        style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box', marginBottom: '15px' }}
                      />
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setIsReviewFormOpen(false)}
                          style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: '500' }}
                          disabled={isSubmittingReview}
                        >
                          İptal
                        </button>
                        <button 
                          onClick={submitReview}
                          style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '500' }}
                          disabled={isSubmittingReview}
                        >
                          {isSubmittingReview ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                      </div>
                    </div>
                  )}

                  {realReviews.length === 0 ? (
                    <div className="csd-empty" style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8' }}>
                      İlk değerlendiren siz olun!
                    </div>
                  ) : (
                    realReviews.map(review => (
                      <div key={review.id} className="csd-review-card">
                        <div className="csd-review-top">
                          {review.profiles?.avatar_url ? (
                             <img src={review.profiles.avatar_url} alt="avatar" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                          ) : (
                             <span className="csd-review-avatar">{(review.profiles?.full_name || '?')[0].toUpperCase()}</span>
                          )}
                          <div className="csd-review-meta">
                            <span className="csd-review-author">{review.profiles?.full_name || 'İsimsiz Kullanıcı'}</span>
                            <span className="csd-review-date">{new Date(review.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                          <div className="csd-review-stars">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} style={{ color: i < review.rating ? '#f59e0b' : '#e2e8f0', fontSize: '15px' }}>★ </span>
                            ))}
                          </div>
                        </div>
                        <p className="csd-review-text">{review.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}\;

// If there's an exact match for reviewsUIOld, replace it. If not, fallback to regex.
if (code.includes(reviewsUIOld)) {
   code = code.replace(reviewsUIOld, reviewsUINew);
} else {
   // Fuzzy replace just in case the old mock code was slightly different.
   // Let's find the boundaries.
   const startStr = "{campusDetailTab === 'reviews' && (";
   const endStr = "  {campusDetailTab === 'qa' && (";
   const startIndex = code.indexOf(startStr);
   const endIndex = code.indexOf(endStr);
   if (startIndex !== -1 && endIndex !== -1) {
      const targetChunk = code.substring(startIndex, endIndex);
      code = code.replace(targetChunk, reviewsUINew + "\\n\\n              ");
   } else {
      console.log('Error: Could not find review tab chunk.');
      process.exit(1);
   }
}

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('Patch successful.');
