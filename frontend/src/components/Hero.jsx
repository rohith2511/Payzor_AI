import React from 'react';
import HeroScene from './HeroScene';
import { ArrowRight, Play, Activity, Sparkles, FileText, ShieldAlert, Clock, BarChart3, Send, Link, DollarSign, ShieldCheck, Shield } from 'lucide-react';

const LEFT_CARDS = [
  { id: 'l1', name: 'Invoices & Ledgers', category: 'Ingest', label: 'Overdue aging & terms', icon: <FileText size={13} style={{ color: '#D4AF37' }} />, color: '#D4AF37' },
  { id: 'l2', name: 'Risk Signals', category: 'AI Scoring', label: 'Multi-factor risk tiers', icon: <ShieldAlert size={13} style={{ color: '#E5C158' }} />, color: '#E5C158' },
  { id: 'l3', name: 'Payment Behavior', category: 'Telemetry', label: 'DSO & delay analytics', icon: <Clock size={13} style={{ color: '#F3E5AB' }} />, color: '#F3E5AB' },
  { id: 'l4', name: 'Credit Exposure', category: 'Portfolio', label: 'Limit & balance monitor', icon: <BarChart3 size={13} style={{ color: '#C5A059' }} />, color: '#C5A059' }
];

const RIGHT_CARDS = [
  { id: 'r1', name: 'Dunning Dispatch', category: 'Action', label: 'WhatsApp & Email routing', icon: <Send size={13} style={{ color: '#D4AF37' }} />, color: '#D4AF37' },
  { id: 'r2', name: 'Settlement Link', category: 'Razorpay Pay', label: 'Dynamic quick-settle token', icon: <Link size={13} style={{ color: '#E5C158' }} />, color: '#E5C158' },
  { id: 'r3', name: 'Promise-to-Pay', category: 'Commitment', label: 'Automated PTP schedule', icon: <Sparkles size={13} style={{ color: '#F59E0B' }} />, color: '#F59E0B' },
  { id: 'r4', name: '+₹3,42,000 Recovered', category: 'Capital Yield', label: 'Autonomous recovered dues', icon: <DollarSign size={13} style={{ color: '#10B981' }} />, color: '#10B981' }
];

export default function Hero({ navigate }) {
  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
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
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      paddingTop: 'clamp(6.5rem, 12vw, 8.5rem)',
      paddingBottom: 'clamp(3rem, 6vw, 5rem)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      backgroundColor: '#0A0A0B',
      boxSizing: 'border-box'
    }}>
      
      {/* Background Obsidian & Golden Ambient Glows */}
      <div style={{
        position: 'absolute',
        top: '5%',
        right: '15%',
        width: 'clamp(300px, 40vw, 550px)',
        height: 'clamp(300px, 40vw, 550px)',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(10, 10, 11, 0) 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '10%',
        width: 'clamp(250px, 35vw, 450px)',
        height: 'clamp(250px, 35vw, 450px)',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, rgba(10, 10, 11, 0) 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div className="container-custom" style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'clamp(2.5rem, 5vw, 3.5rem)'
      }}>
        {/* Centered Typography Content */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          textAlign: 'center',
          gap: '1.25rem',
          maxWidth: '880px',
          width: '100%'
        }}>
          {/* Gold Badge */}
          <div className="badge-gold" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.95rem'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFD700', display: 'inline-block', boxShadow: '0 0 6px #FFD700' }} />
            PAYZOR AI • AUTONOMOUS REVENUE RECOVERY COMMAND PLATFORM
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 5.5vw, 4.35rem)',
            lineHeight: 1.1,
            color: '#F8FAFC',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: 0
          }}>
            Turn Outstanding Credit<br />
            <span style={{
              background: 'linear-gradient(135deg, #FFF0BE 0%, #D4AF37 50%, #C5A059 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(212, 175, 55, 0.2)'
            }}>Into Recovered Capital.</span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.18rem)',
            color: '#94A3B8',
            lineHeight: 1.6,
            maxWidth: '680px',
            fontWeight: 400,
            margin: 0
          }}>
            Enterprise receivables intelligence powered by Google Gemini 3.7 Flash inference. Detect overdue exposure, prioritize high-risk debtors, synthesize empathetic dunning sequences, and automate settlement workflows.
          </p>

          {/* CTAs */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.95rem',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: '0.5rem'
          }}>
            <button
              onClick={() => navigate ? navigate('signup') : handleScrollTo('final-cta')}
              className="btn-fintech-primary"
              style={{
                padding: '0.85rem 1.75rem',
                fontSize: '0.92rem',
                gap: '0.55rem'
              }}
            >
              <span>Launch Command Center</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => handleScrollTo('showcase')}
              style={{
                backgroundColor: 'rgba(20, 21, 27, 0.85)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#F8FAFC',
                padding: '0.85rem 1.6rem',
                fontSize: '0.92rem',
                fontWeight: 600,
                borderRadius: 'var(--border-radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backdropFilter: 'blur(12px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold-hover)';
                e.currentTarget.style.color = 'var(--gold-hover)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(212, 175, 55, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                e.currentTarget.style.color = '#F8FAFC';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Play size={14} fill="#D4AF37" color="#D4AF37" /> Watch Interactive Demo
            </button>
          </div>
        </div>

        {/* 1. Desktop 3D Interactive Hero Visualization (Screen >= 1024px) */}
        <div className="hero-desktop-scene" style={{
          height: '530px',
          width: '100%',
          maxWidth: '1200px',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          background: 'radial-gradient(ellipse at center, rgba(18, 19, 24, 0.95) 0%, rgba(10, 10, 11, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.12)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <HeroScene />
        </div>

        {/* 2. Tablet & Mobile Responsive Hero Visual Reflow (Screen < 1024px) */}
        <div className="hero-mobile-reflow" style={{
          width: '100%',
          maxWidth: '700px',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          background: '#121318',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.85)',
          padding: 'clamp(1.25rem, 4vw, 2rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxSizing: 'border-box'
        }}>
          
          {/* Central AI Control Hub */}
          <div style={{
            backgroundColor: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Shield size={16} style={{ color: '#D4AF37' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC', fontFamily: 'var(--font-family-title)', letterSpacing: '0.04em' }}>
                  PAYZOR AI RECOVERY HUB
                </span>
              </div>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D4AF37', display: 'inline-block', boxShadow: '0 0 8px #FFD700' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', borderTop: '1px solid rgba(212, 175, 55, 0.15)', paddingTop: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>Recovery Yield</div>
                <strong style={{ fontSize: '0.88rem', color: '#D4AF37' }}>99.2%</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>Monitored Exposure</div>
                <strong style={{ fontSize: '0.88rem', color: '#F8FAFC' }}>₹14.8M+</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>Decisions / min</div>
                <strong style={{ fontSize: '0.88rem', color: '#F8FAFC' }}>4,850</strong>
              </div>
            </div>
          </div>

          {/* Stacked Reflow Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            
            {/* Column 1: Ingest Data */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#D4AF37', letterSpacing: '0.06em' }}>
                1. RECEIVABLES INGEST
              </div>
              {LEFT_CARDS.map(c => (
                <div key={c.id} style={reflowCardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {c.icon}
                    <strong style={{ fontSize: '0.78rem', color: '#F8FAFC' }}>{c.name}</strong>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{c.label}</span>
                </div>
              ))}
            </div>

            {/* Column 2: Actions & Output */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#D4AF37', letterSpacing: '0.06em' }}>
                2. AI RECOVERY ACTIONS
              </div>
              {RIGHT_CARDS.map(c => (
                <div key={c.id} style={{ ...reflowCardStyle, borderColor: c.color === '#10B981' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(212, 175, 55, 0.22)', backgroundColor: c.color === '#10B981' ? 'rgba(16, 185, 129, 0.1)' : '#14151B' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {c.icon}
                    <strong style={{ fontSize: '0.78rem', color: c.color === '#10B981' ? '#34D399' : '#F8FAFC' }}>{c.name}</strong>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{c.label}</span>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* Breakpoint Styles for Hero Scene Switcher */}
      <style>{`
        @media (min-width: 1024px) {
          .hero-desktop-scene {
            display: block !important;
          }
          .hero-mobile-reflow {
            display: none !important;
          }
        }
        @media (max-width: 1023px) {
          .hero-desktop-scene {
            display: none !important;
          }
          .hero-mobile-reflow {
            display: flex !important;
          }
        }
      `}</style>
    </section>
  );
}

const reflowCardStyle = {
  backgroundColor: '#14151B',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '8px',
  padding: '0.65rem 0.85rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
};
