import React from 'react';
import { ArrowRight, Sparkles, Shield } from 'lucide-react';

export default function FinalCTA({ navigate }) {
  return (
    <section id="final-cta" style={{
      padding: 'clamp(4.5rem, 9vw, 8rem) 0',
      backgroundColor: '#0A0A0B',
      borderTop: '1px solid rgba(212, 175, 55, 0.15)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background radial gold glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(600px, 90vw)',
        height: 'min(600px, 90vw)',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, rgba(10, 10, 11, 0) 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div className="container-custom" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{
          maxWidth: '680px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(1.25rem, 3vw, 2rem)'
        }}>
          
          {/* Micro-Indicator */}
          <div className="badge-gold" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 1.1rem'
          }}>
            <Sparkles size={14} /> Autonomous AI Revenue Recovery Platform
          </div>

          {/* Heading */}
          <h2 style={{
            fontSize: 'clamp(1.85rem, 4.5vw, 3.35rem)',
            fontWeight: 800,
            color: '#F8FAFC',
            fontFamily: 'var(--font-family-title)',
            lineHeight: 1.15
          }}>
            Turn Outstanding Credit<br />
            <span style={{
              background: 'linear-gradient(135deg, #FFF0BE 0%, #D4AF37 50%, #C5A059 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Into Recovered Capital</span>
          </h2>

          {/* Subheading */}
          <p style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
            color: '#94A3B8',
            lineHeight: 1.6
          }}>
            Identify debtor credit exposure, synthesize bounded dunning requests, and automate B2B receivables collections today.
          </p>

          {/* Buttons */}
          <div className="final-cta-btn-group" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            width: '100%',
            marginTop: '0.5rem'
          }}>
            <button 
              onClick={() => navigate ? navigate('signup') : null}
              className="btn-fintech-primary"
              style={{
                padding: '0.95rem 2rem',
                fontSize: '0.95rem'
              }}
            >
              <span>Launch Command Center</span>
              <ArrowRight size={16} />
            </button>

            <button 
              onClick={() => navigate ? navigate('login') : null}
              style={{
                backgroundColor: '#14151B',
                color: '#F8FAFC',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                padding: '0.95rem 1.8rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: 'var(--border-radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold-hover)';
                e.currentTarget.style.color = 'var(--gold-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                e.currentTarget.style.color = '#F8FAFC';
              }}
            >
              Demo Admin Login
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
