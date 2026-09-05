import React from 'react';
import { UserCheck, Sparkles, Eye, TrendingUp, Cpu, Terminal, ShieldCheck, Scale, Zap } from 'lucide-react';

export default function Features() {
  return (
    <section id="features" style={{
      padding: 'clamp(4.5rem, 8vw, 7.5rem) 0',
      backgroundColor: '#0D0E12',
      borderTop: '1px solid rgba(212, 175, 55, 0.15)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
      position: 'relative',
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
            PAYZOR INTELLIGENCE SUITE
          </p>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            fontWeight: 800,
            color: '#F8FAFC',
            fontFamily: 'var(--font-family-title)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Autonomous B2B Receivables & Recovery Engine
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(0.88rem, 2vw, 1rem)',
            maxWidth: '580px',
            margin: '0.75rem auto 0',
            lineHeight: 1.5
          }}>
            Manage debtor ledgers, assess multi-factor risk scores, synthesize compliant dunning sequences, and automate payment collections in a single command portal.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="feature-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          width: '100%'
        }}>
          {/* Card 1: AI Risk Profiling */}
          <div className="feature-card" style={featureCardStyle}>
            <div style={featureTextContainer}>
              <div style={iconBoxStyle('rgba(212, 175, 55, 0.12)', 'var(--gold-primary)')}>
                <UserCheck size={20} />
              </div>
              <h3 style={featureTitleStyle}>AI Risk Profiling & Scoring</h3>
              <p style={featureDescStyle}>
                Categorize debtor accounts into Low, Medium, High, and Critical risk tiers using real-time overdue aging, delay trends, and credit limits.
              </p>
            </div>
            
            {/* Micro-UI: NL Query Builder */}
            <div style={microUIContainerStyle}>
              <div style={microUIWindowStyle}>
                <div style={microUIHeaderStyle}>
                  <div style={dotsStyle}>
                    <span style={dotStyle('#EF4444')} />
                    <span style={dotStyle('#EAB308')} />
                    <span style={dotStyle('#10B981')} />
                  </div>
                  <span style={microUITitleStyle}>Natural Language Cohort Engine</span>
                </div>
                <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0A0A0B', padding: '0.55rem', borderRadius: '6px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                    <Terminal size={14} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.72rem', color: '#F8FAFC', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                      "Find debtors overdue &gt; 15 days with exposure &gt; ₹1,00,000"
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Compiling financial rules...</span>
                    <span style={{
                      backgroundColor: 'rgba(244, 63, 94, 0.15)',
                      color: '#FB7185',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(244, 63, 94, 0.35)'
                    }}>
                      14 High-Risk Accounts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: AI Dunning Synthesizer */}
          <div className="feature-card" style={featureCardStyle}>
            <div style={featureTextContainer}>
              <div style={iconBoxStyle('rgba(212, 175, 55, 0.12)', 'var(--gold-primary)')}>
                <Sparkles size={20} />
              </div>
              <h3 style={featureTitleStyle}>Contextual Dunning Generator</h3>
              <p style={featureDescStyle}>
                Synthesize compliant, empathetic payment recovery communications across WhatsApp, Email, and SMS with instant Razorpay quick-settle links.
              </p>
            </div>

            {/* Micro-UI: AI Template Editor */}
            <div style={microUIContainerStyle}>
              <div style={microUIWindowStyle}>
                <div style={microUIHeaderStyle}>
                  <div style={dotsStyle}>
                    <span style={dotStyle('#EF4444')} />
                    <span style={dotStyle('#EAB308')} />
                    <span style={dotStyle('#10B981')} />
                  </div>
                  <span style={microUITitleStyle}>Payzor AI Copy Generator</span>
                </div>
                <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '6px', padding: '0.55rem 0.75rem', background: '#0A0A0B', fontSize: '0.72rem', lineHeight: 1.4, wordBreak: 'break-word' }}>
                    <div style={{ fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Cpu size={12} /> Payzor AI Financial Notice
                    </div>
                    "Dear Accounts Payable, invoice dues of ₹85,000 are past due. Settle securely via Payzor portal: payzor.ai/pay/..."
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignSelf: 'flex-end' }}>
                    <button style={microButtonSecondary}>Refine Tone</button>
                    <button style={microButtonPrimary}>Dispatch Workflow</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: B2B Credit Diagnostics */}
          <div className="feature-card" style={featureCardStyle}>
            <div style={featureTextContainer}>
              <div style={iconBoxStyle('rgba(212, 175, 55, 0.12)', 'var(--gold-primary)')}>
                <Eye size={20} />
              </div>
              <h3 style={featureTitleStyle}>Receivables Ledger Diagnostics</h3>
              <p style={featureDescStyle}>
                Track trade credit utilization, average payment delay days, promise-to-pay adherence, and dynamic aging tiers (1-30d, 31-60d, 90d+).
              </p>
            </div>

            {/* Micro-UI: Credit Status Snapshot */}
            <div style={microUIContainerStyle}>
              <div style={microUIWindowStyle}>
                <div style={microUIHeaderStyle}>
                  <div style={dotsStyle}>
                    <span style={dotStyle('#EF4444')} />
                    <span style={dotStyle('#EAB308')} />
                    <span style={dotStyle('#10B981')} />
                  </div>
                  <span style={microUITitleStyle}>Live Account Snapshot</span>
                </div>
                <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F8FAFC' }}>Apex Logistics Ltd</span>
                    <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#FB7185', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>Critical Risk (88%)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    <div>Credit Limit: <strong style={{ color: '#F8FAFC' }}>₹5,00,000</strong></div>
                    <div>Outstanding: <strong style={{ color: '#FB7185' }}>₹1,80,000</strong></div>
                    <div>Avg Delay: <strong style={{ color: '#F8FAFC' }}>24 days</strong></div>
                    <div>Reliability: <strong style={{ color: '#FB7185' }}>Low</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Automated Stopping Rules */}
          <div className="feature-card" style={featureCardStyle}>
            <div style={featureTextContainer}>
              <div style={iconBoxStyle('rgba(16, 185, 129, 0.12)', '#10B981')}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={featureTitleStyle}>RBI Guardrails & Stopping Rules</h3>
              <p style={featureDescStyle}>
                Enforce regulatory contact cooldowns, non-harassment filters, and instant auto-pause triggers upon payment receipt or valid Promise-to-Pay.
              </p>
            </div>

            {/* Micro-UI: Guardrail Rule Notification */}
            <div style={microUIContainerStyle}>
              <div style={microUIWindowStyle}>
                <div style={microUIHeaderStyle}>
                  <div style={dotsStyle}>
                    <span style={dotStyle('#EF4444')} />
                    <span style={dotStyle('#EAB308')} />
                    <span style={dotStyle('#10B981')} />
                  </div>
                  <span style={microUITitleStyle}>Guardrail Engine Status</span>
                </div>
                <div style={{ padding: '0.85rem' }}>
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', padding: '0.6rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <ShieldCheck size={16} style={{ color: '#34D399', flexShrink: 0, marginTop: '0.1rem' }} />
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34D399' }}>Stop Condition Triggered</div>
                      <div style={{ fontSize: '0.68rem', color: '#F8FAFC', marginTop: '0.1rem', lineHeight: 1.35 }}>
                        Outstanding balance settled via Razorpay Webhook. Recovery flow terminated and customer status normalized.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .feature-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

const featureCardStyle = {
  background: '#121318',
  border: '1px solid rgba(212, 175, 55, 0.18)',
  borderRadius: 'var(--border-radius-lg)',
  padding: 'clamp(1.5rem, 3.5vw, 2.25rem) clamp(1.25rem, 3vw, 1.85rem)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: '1.5rem',
  transition: 'all 0.25s ease',
  cursor: 'default',
  boxSizing: 'border-box'
};

const featureTextContainer = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const iconBoxStyle = (bg, color) => ({
  width: '2.75rem',
  height: '2.75rem',
  borderRadius: 'var(--border-radius-sm)',
  backgroundColor: bg,
  color: color,
  border: '1px solid rgba(212, 175, 55, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const featureTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: 800,
  color: '#F8FAFC',
  fontFamily: 'var(--font-family-title)',
  letterSpacing: '-0.02em',
  margin: 0
};

const featureDescStyle = {
  fontSize: '0.88rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
  margin: 0
};

const microUIContainerStyle = {
  width: '100%',
  background: '#0A0A0B',
  borderRadius: 'var(--border-radius-md)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  padding: '0.85rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box'
};

const microUIWindowStyle = {
  width: '100%',
  backgroundColor: '#14151B',
  borderRadius: '8px',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
  overflow: 'hidden',
  border: '1px solid rgba(212, 175, 55, 0.15)',
  boxSizing: 'border-box'
};

const microUIHeaderStyle = {
  backgroundColor: '#1A1B24',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '0.4rem 0.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
};

const dotsStyle = {
  display: 'flex',
  gap: '4px'
};

const dotStyle = (color) => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: color
});

const microUITitleStyle = {
  fontSize: '0.62rem',
  fontWeight: 700,
  color: 'var(--gold-champagne)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const microButtonPrimary = {
  background: 'var(--gold-gradient)',
  color: '#0A0A0B',
  fontSize: '0.68rem',
  fontWeight: 700,
  padding: '0.3rem 0.65rem',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer'
};

const microButtonSecondary = {
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: '0.68rem',
  fontWeight: 600,
  padding: '0.3rem 0.65rem',
  borderRadius: '4px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  cursor: 'pointer'
};
