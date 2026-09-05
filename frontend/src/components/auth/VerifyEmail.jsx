import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, ShieldAlert } from 'lucide-react';

export default function VerifyEmail({ navigate }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  const tempUser = JSON.parse(localStorage.getItem('payzor_signup_temp') || '{"email":"admin@payzor.ai","name":"Demo Admin","org":"Payzor Capital & Recovery Technologies"}');

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const otp = code.join('');
    if (otp.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('payzor_user', JSON.stringify(tempUser));
      localStorage.removeItem('payzor_signup_temp');
      navigate('dashboard');
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
            Verify Your Email
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', textAlign: 'center', margin: 0 }}>
            Enter the 6-digit authentication token sent to your email
          </p>
        </div>

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {code.map((num, index) => (
              <input 
                key={index}
                ref={(el) => inputRefs.current[index] = el}
                type="text" 
                value={num}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                style={otpInputStyle}
                maxLength="1"
                autoComplete="off"
              />
            ))}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-fintech-primary"
            style={{
              padding: '0.75rem',
              fontSize: '0.9rem',
              justifyContent: 'center'
            }}
          >
            {loading ? 'Verifying...' : 'Authenticate Session'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={footNoteStyle}>
          Didn't receive the code?{' '}
          <span style={linkStyle} onClick={() => alert('Verification code resent.')}>
            Resend Code
          </span>
        </div>
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

const otpInputStyle = {
  width: '42px',
  height: '48px',
  textAlign: 'center',
  fontSize: '1.2rem',
  fontWeight: 700,
  backgroundColor: '#0A0A0B',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  borderRadius: 'var(--border-radius-sm)',
  outline: 'none',
  fontFamily: 'var(--font-family-mono)',
  color: '#F8FAFC',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
};

const footNoteStyle = {
  fontSize: '0.8rem',
  color: '#94A3B8',
  textAlign: 'center',
  marginTop: '1.75rem',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  paddingTop: '1.25rem'
};

const linkStyle = {
  color: 'var(--gold-primary)',
  fontWeight: 700,
  cursor: 'pointer'
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
