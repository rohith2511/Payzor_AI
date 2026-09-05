import React from 'react';
import { Database, Brain, Sparkles, Shield, RefreshCw } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    title: 'Credit Ingest',
    desc: 'B2B merchants sync invoice ledgers, credit terms, and overdue aging schedules.',
    icon: <Database size={22} style={{ color: '#D4AF37' }} />,
    color: '#D4AF37',
    bg: 'rgba(212, 175, 55, 0.12)'
  },
  {
    num: '02',
    title: 'Risk Scoring',
    desc: 'Payzor AI computes dynamic multi-factor risk scores and days-past-due velocity.',
    icon: <Brain size={22} style={{ color: '#E5C158' }} />,
    color: '#E5C158',
    bg: 'rgba(229, 193, 88, 0.12)'
  },
  {
    num: '03',
    title: 'Dunning Synthesis',
    desc: 'Synthesizes empathetic, compliant multi-channel dunning copies with settlement links.',
    icon: <Sparkles size={22} style={{ color: '#F3E5AB' }} />,
    color: '#F3E5AB',
    bg: 'rgba(243, 229, 171, 0.12)'
  },
  {
    num: '04',
    title: 'Guardrail Bounds',
    desc: 'Enforces RBI-compliant cooldowns, contact frequency caps, and Promise-to-Pay rules.',
    icon: <Shield size={22} style={{ color: '#10B981' }} />,
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)'
  },
  {
    num: '05',
    title: 'Settlement Sync',
    desc: 'Razorpay webhook confirmations reconcile ledger balances and stop active dunning.',
    icon: <RefreshCw size={22} style={{ color: '#D4AF37' }} />,
    color: '#D4AF37',
    bg: 'rgba(212, 175, 55, 0.12)'
  }
];

export default function ProductFlow() {
  return (
    <section id="product-flow" style={{
      padding: 'clamp(4.5rem, 8vw, 7.5rem) 0',
      backgroundColor: '#0D0E12',
      borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div className="container-custom">
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--gold-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.5rem'
          }}>
            REVENUE RECOVERY LIFECYCLE
          </p>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            fontWeight: 800,
            color: '#F8FAFC',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.2,
            fontFamily: 'var(--font-family-title)',
            letterSpacing: '-0.02em'
          }}>
            From Overdue Invoices to Reconciled Capital
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(0.88rem, 2vw, 1rem)',
            maxWidth: '540px',
            margin: '0.75rem auto 0',
            lineHeight: 1.5
          }}>
            The 5-stage autonomous architecture powering continuous receivables monitoring and automated collections.
          </p>
        </div>

        {/* Step Cards Flow Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          position: 'relative',
          width: '100%'
        }}>
          {STEPS.map((step) => (
            <div 
              key={step.num}
              style={{
                background: '#121318',
                border: '1px solid rgba(212, 175, 55, 0.18)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '1.75rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
                transition: 'transform 0.25s ease, border-color 0.25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.18)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  width: '2.85rem',
                  height: '2.85rem',
                  borderRadius: '10px',
                  backgroundColor: step.bg,
                  border: `1px solid ${step.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {step.icon}
                </div>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-family-title)',
                  color: step.color,
                  letterSpacing: '0.05em'
                }}>
                  {step.num}
                </span>
              </div>

              <div>
                <h3 style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#F8FAFC',
                  marginBottom: '0.35rem'
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#94A3B8',
                  lineHeight: 1.45,
                  margin: 0
                }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
