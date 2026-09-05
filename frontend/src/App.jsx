import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import TrustMetrics from './components/TrustMetrics';
import ProductFlow from './components/ProductFlow';
import Features from './components/Features';
import Architecture from './components/Architecture';
import ProductShowcase from './components/ProductShowcase';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import VerifyEmail from './components/auth/VerifyEmail';
import AppShell from './components/crm/AppShell';
import { CrmProvider } from './components/crm/CrmContext';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import './App.css';

function AppContent() {
  const [path, setPath] = useState('landing');
  const { user, loading } = useAuth();

  // Watch for auth state changes to protect dashboard routes
  useEffect(() => {
    if (!loading) {
      if (user) {
        if (['login', 'signup', 'forgot-password', 'verify-email', 'landing'].includes(path)) {
          setPath('dashboard');
        }
      } else {
        if (path === 'dashboard') {
          setPath('login');
        }
      }
    }
  }, [user, loading, path]);

  const navigate = (to) => {
    setPath(to);
    window.scrollTo({ top: 0 });
  };

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle} />
        <span style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'sans-serif' }}>
          Restoring session...
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Main Root Routing Switch
  if (path === 'login') return <Login navigate={navigate} />;
  if (path === 'signup') return <Signup navigate={navigate} />;
  if (path === 'forgot-password') return <ForgotPassword navigate={navigate} />;
  if (path === 'verify-email') return <VerifyEmail navigate={navigate} />;
  if (path === 'dashboard') return <AppShell navigate={navigate} />;

  // Default: Public Landing Page
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header (fixed) */}
      <Header navigate={navigate} />

      {/* Main Sections Wrapper */}
      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <Hero navigate={navigate} />

        {/* Product Flow */}
        <ScrollRevealSection>
          <ProductFlow />
        </ScrollRevealSection>

        {/* Features Grid */}
        <ScrollRevealSection>
          <Features />
        </ScrollRevealSection>

        {/* Product Interactive Demo Showcase */}
        <ScrollRevealSection>
          <ProductShowcase />
        </ScrollRevealSection>

        {/* System Architecture Map */}
        <ScrollRevealSection>
          <Architecture />
        </ScrollRevealSection>

        {/* Trust & Counter Metrics */}
        <ScrollRevealSection>
          <TrustMetrics />
        </ScrollRevealSection>

        {/* Final CTA Callout */}
        <ScrollRevealSection>
          <FinalCTA navigate={navigate} />
        </ScrollRevealSection>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CrmProvider>
        <AppContent />
      </CrmProvider>
    </AuthProvider>
  );
}

// Styling details for session checking splash
const loadingContainerStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--bg-primary)'
};

const spinnerStyle = {
  width: '2rem',
  height: '2rem',
  border: '3px solid var(--blue-light)',
  borderTopColor: 'var(--blue-primary)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

// Reusable viewport reveal wrapper with Framer Motion
function ScrollRevealSection({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, cubicBezier: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
