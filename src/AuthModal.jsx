import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './AuthModal.css';

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    
    if (error) {
      setErrorMsg('Giriş başarısız: ' + error.message);
    } else {
      closeAuthModal();
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const { error, data } = await signUpWithEmail(email, password);
    setLoading(false);
    
    if (error) {
      setErrorMsg('Kayıt başarısız: ' + error.message);
    } else {
      // Supabase sometimes requires email confirmation.
      if (data?.user && data?.session === null) {
          setErrorMsg('Lütfen e-posta adresinize gelen onay linkine tıklayın.');
      } else {
          closeAuthModal();
      }
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      <div className="auth-modal-content" onClick={e => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={closeAuthModal}>&times;</button>
        <h2>Giriş Yap</h2>
        <p>Yorum yapmak ve soru sormak için lütfen giriş yapın.</p>
        
        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="E-posta adresi" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          <input 
            type="password" 
            placeholder="Şifre" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          
          <div className="auth-buttons">
            <button type="submit" className="auth-primary-btn" disabled={loading}>
              {loading ? 'İşleniyor...' : 'Giriş Yap'}
            </button>
            <button type="button" className="auth-secondary-btn" disabled={loading} onClick={handleSignUp}>
              Kayıt Ol
            </button>
          </div>
        </form>

        <div className="auth-divider">veya</div>

        <button className="google-signin-btn" disabled title="Yakında eklenecektir" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="google-icon" />
          <span>Google ile Giriş Yap (Yakında)</span>
        </button>
      </div>
    </div>
  );
}
