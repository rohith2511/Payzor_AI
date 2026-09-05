import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function Login({ navigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');

    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate('dashboard');
    } else {
      setError(res.error || 'Login failed.');
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@payzor.ai');
    setPassword('admin123');
    setError('');
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
        {/* Branding header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem', marginBottom: '1.75rem' }}>
          <div style={logoIconStyle}>
            <Shield size={22} strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#F8FAFC', letterSpacing: '-0.02em', margin: 0 }}>
            Welcome to Payzor AI
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: 0 }}>
            Autonomous Revenue Recovery Command Center
          </p>
        </div>

        {/* Quick Demo Credentials Pill */}
        <div 
          onClick={handleFillDemo}
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '8px',
            padding: '0.6rem 0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.18)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#E5C158', fontWeight: 700 }}>
            <Sparkles size={13} /> Demo Admin: <span style={{ color: '#F8FAFC' }}>admin@payzor.ai</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase' }}>
            Auto-Fill
          </span>
        </div>

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        {/* Input fields */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
              <span 
                onClick={() => navigate('forgot-password')}
                style={forgotLinkStyle}
              >
                Forgot password?
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: '2.5rem' }}
                placeholder="Enter password"
                autoComplete="new-password"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={eyeButtonStyle}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Footnotes */}
        <div style={footNoteStyle}>
          Don't have an account?{' '}
          <span onClick={() => navigate('signup')} style={linkStyle}>
            Create an account
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// Styling details
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

const eyeButtonStyle = {
  position: 'absolute',
  right: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'transparent',
  border: 'none',
  color: '#94A3B8',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
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

const forgotLinkStyle = {
  fontSize: '0.75rem',
  color: 'var(--gold-champagne)',
  fontWeight: 600,
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
