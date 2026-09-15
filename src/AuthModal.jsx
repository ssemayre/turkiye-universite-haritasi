import React from 'react';
import { useAuth } from './AuthContext';
import './AuthModal.css';

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, signInWithGoogle } = useAuth();

  if (!authModalOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      <div className="auth-modal-content" onClick={e => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={closeAuthModal}>&times;</button>
        <h2>Giriş Yap</h2>
        <p>Yorum yapmak ve soru sormak için lütfen giriş yapın.</p>
        
        <button className="google-signin-btn" onClick={signInWithGoogle}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="google-icon" />
          <span>Google ile Giriş Yap</span>
        </button>
      </div>
    </div>
  );
}
