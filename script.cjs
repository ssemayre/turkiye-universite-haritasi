const fs = require('fs');
const file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr =                           <div className="csd-review-top">
                            <span className="csd-review-avatar" style={{ background: '#3b82f6', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                              ??
                            </span>
                            <div className="csd-review-meta">
                              <span className="csd-review-author">Kayýtlý Öðrenci</span>
                              <span className="csd-review-date">{new Date(review.created_at).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="csd-review-stars">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} style={{ color: i < review.rating ? '#f59e0b' : '#e2e8f0', fontSize: '15px' }}>?  </span>
                              ))}
                            </div>
                          </div>;

const replacementStr =                           <div className="csd-review-top" style={{ alignItems: 'flex-start' }}>
                            {review.profiles?.avatar_url ? (
                              <img src={review.profiles.avatar_url} alt="Avatar" className="csd-review-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <span className="csd-review-avatar" style={{ background: '#3b82f6', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                                ??
                              </span>
                            )}
                            <div className="csd-review-meta" style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="csd-review-author" style={{ fontWeight: 'bold', color: '#0f172a' }}>{review.profiles?.full_name || 'Kayýtlý Öðrenci'}</span>
                                <span className="csd-review-date" style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(review.created_at).toLocaleDateString('tr-TR')}</span>
                              </div>
                              {(review.profiles?.university_name || review.profiles?.department_name) && (
                                <span style={{ fontSize: '11px', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                                  {review.profiles?.university_name} {review.profiles?.department_name && \- \\}
                                </span>
                              )}
                            </div>
                            <div className="csd-review-stars">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} style={{ color: i < review.rating ? '#f59e0b' : '#e2e8f0', fontSize: '15px' }}>?  </span>
                              ))}
                            </div>
                          </div>;

if(content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully replaced review UI');
} else {
    console.log('Could not find target string in file');
}
