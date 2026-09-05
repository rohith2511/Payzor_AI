import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Activity, Shield } from 'lucide-react';

export default function Header({ navigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const scrollToSection = (id) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of fixed header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      zIndex: 1000,
      transition: 'all 0.3s ease',
      backgroundColor: scrolled || isOpen ? 'rgba(10, 10, 11, 0.94)' : 'rgba(10, 10, 11, 0.78)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: scrolled ? '1px solid rgba(212, 175, 55, 0.22)' : '1px solid rgba(255, 255, 255, 0.06)',
      padding: scrolled ? '0.75rem 0' : '1rem 0'
    }}>
      <div className="container-custom" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
      }}>
        {/* Logo */}
        <div 
          onClick={() => { setIsOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            zIndex: 1002
          }}
        >
          <div style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: 'var(--border-radius-sm)',
            background: 'var(--gold-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0A0A0B',
            boxShadow: '0 0 16px rgba(212, 175, 55, 0.35)',
            flexShrink: 0
          }}>
            <Shield size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontSize: 'clamp(1rem, 3vw, 1.25rem)',
              fontWeight: 800,
              fontFamily: 'var(--font-family-title)',
              color: '#F8FAFC',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              PAYZOR <span style={{ color: 'var(--gold-primary)', fontWeight: 800 }}>AI</span>
            </div>
            <div style={{
              fontSize: '0.55rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: 'var(--gold-champagne)',
              textTransform: 'uppercase',
              marginTop: '0.15rem'
            }}>
              AUTONOMOUS REVENUE RECOVERY
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" style={{
          display: 'none',
          gap: '1.75rem',
          alignItems: 'center'
        }}>
          <span onClick={() => scrollToSection('product-flow')} style={navLinkStyle}>Overview</span>
          <span onClick={() => scrollToSection('features')} style={navLinkStyle}>Features</span>
          <span onClick={() => scrollToSection('showcase')} style={navLinkStyle}>Product Demo</span>
          <span onClick={() => scrollToSection('architecture')} style={navLinkStyle}>Architecture</span>
          <span onClick={() => scrollToSection('metrics')} style={navLinkStyle}>Metrics</span>
        </nav>

        {/* Desktop CTA Action Buttons */}
        <div className="desktop-nav" style={{
          display: 'none',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <button 
            onClick={() => navigate ? navigate('login') : null}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.5rem 0.95rem',
              borderRadius: '6px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold-primary)';
              e.currentTarget.style.color = 'var(--gold-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            Sign In
          </button>
          
          <button 
            onClick={() => navigate ? navigate('signup') : null}
            className="btn-fintech-primary"
            style={{
              padding: '0.55rem 1.15rem',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>Launch Platform</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="mobile-toggle"
          aria-label="Toggle navigation menu"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1002
          }}
        >
          {isOpen ? <X size={24} color="#D4AF37" /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Backdrop & Drawer Menu */}
      <div 
        className={`mobile-backdrop ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1001,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'all 0.3s ease'
        }}
      />

      <div 
        className={`mobile-drawer ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(300px, 80vw)',
          backgroundColor: '#0D0E12',
          borderLeft: '1px solid rgba(212, 175, 55, 0.25)',
          padding: '5.5rem 1.75rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 1001,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.8)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gold-primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Navigation
          </div>
          <span onClick={() => scrollToSection('product-flow')} style={mobileNavLinkStyle}>Overview</span>
          <span onClick={() => scrollToSection('features')} style={mobileNavLinkStyle}>Features</span>
          <span onClick={() => scrollToSection('showcase')} style={mobileNavLinkStyle}>Product Demo</span>
          <span onClick={() => scrollToSection('architecture')} style={mobileNavLinkStyle}>Architecture</span>
          <span onClick={() => scrollToSection('metrics')} style={mobileNavLinkStyle}>Metrics</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            onClick={() => { setIsOpen(false); navigate ? navigate('login') : null; }}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--border-radius-sm)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          
          <button 
            onClick={() => { setIsOpen(false); navigate ? navigate('signup') : null; }}
            className="btn-fintech-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              justifyContent: 'center'
            }}
          >
            <span>Launch Platform</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 868px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-toggle {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}

const navLinkStyle = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  transition: 'color 0.15s ease'
};

const mobileNavLinkStyle = {
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  cursor: 'pointer',
  padding: '0.4rem 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
};
