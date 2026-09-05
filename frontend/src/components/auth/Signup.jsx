import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function Signup({ navigate }) {
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');

    const res = await signup(name, org || 'Payzor Capital & Recovery Technologies', email, password);
    setLoading(false);
    if (res.success) {
      navigate('dashboard');
    } else {
      setError(res.error || 'Signup failed.');
    }
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
            Create Payzor Account
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: 0 }}>
            Enterprise Autonomous Revenue Recovery Platform
          </p>
        </div>

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="Arjun Sharma"
              autoComplete="off"
            />
          </div>

          <div>
            <label style={labelStyle}>Organization Name</label>
            <input 
              type="text" 
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              style={inputStyle}
              placeholder="Payzor Capital & Recovery Technologies"
              autoComplete="off"
            />
          </div>

          <div>
            <label style={labelStyle}>Work Email</label>
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
            <label style={labelStyle}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="Create secure password"
              autoComplete="new-password"
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
            {loading ? 'Creating Account...' : 'Get Started'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={footNoteStyle}>
          Already have an account?{' '}
          <span onClick={() => navigate('login')} style={linkStyle}>
            Sign in
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
