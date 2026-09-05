import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPassword({ navigate }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div style={containerStyle}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, cubicBezier: [0.16, 1, 0.3, 1] }}
        style={cardStyle}
        className="glass-panel"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem', marginBottom: '1.75rem' }}>
          <div style={logoIconStyle}>
            <Shield size={22} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
            Reset Password
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', textAlign: 'center', margin: 0 }}>
            We'll dispatch secure recovery instructions to your work email
          </p>
        </div>

        {submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34D399', padding: '0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
              Reset link sent to <strong>{email}</strong>
            </div>
            <button 
              onClick={() => navigate('login')}
              className="btn-fintech-secondary"
              style={{ padding: '0.75rem', justifyContent: 'center' }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={errorStyle}>
                {error}
              </div>
            )}

            <div>
              <label style={labelStyle}>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="admin@payzor.ai"
                autoComplete="off"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-fintech-primary"
              style={{
                padding: '0.75rem',
                fontSize: '0.9rem',
                justifyContent: 'center',
                marginTop: '0.5rem'
              }}
            >
              {loading ? 'Sending Instructions...' : 'Send Reset Link'} <Send size={15} />
            </button>

            <button 
              type="button"
              onClick={() => navigate('login')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--gold-champagne)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                marginTop: '0.5rem'
              }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#0A0A0B',
  padding: '2rem'
};

const cardStyle = {
  width: '100%',
  maxWidth: '430px',
  backgroundColor: '#121318',
  border: '1px solid rgba(212, 175, 55, 0.25)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '2.5rem',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.12)'
};

const logoIconStyle = {
  width: '2.75rem',
  height: '2.75rem',
  borderRadius: 'var(--border-radius-sm)',
  background: 'var(--gold-gradient)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#0A0A0B',
  boxShadow: '0 0 16px rgba(212, 175, 55, 0.35)',
  marginBottom: '0.5rem'
};

const labelStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#94A3B8',
  display: 'block',
  marginBottom: '0.4rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.85rem',
  fontSize: '0.85rem',
  backgroundColor: '#0A0A0B',
  border: '1px solid rgba(212, 175, 55, 0.25)',
  borderRadius: 'var(--border-radius-sm)',
  outline: 'none',
  fontFamily: 'inherit',
  color: '#F8FAFC',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxSizing: 'border-box'
};

const errorStyle = {
  backgroundColor: 'rgba(244, 63, 94, 0.15)',
  border: '1px solid rgba(244, 63, 94, 0.35)',
  color: '#FB7185',
  padding: '0.65rem 0.85rem',
  borderRadius: '6px',
  fontSize: '0.75rem',
  marginBottom: '1.25rem',
  fontWeight: 600
};
