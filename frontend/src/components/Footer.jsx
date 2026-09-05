import React from 'react';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#07080A',
      borderTop: '1px solid rgba(212, 175, 55, 0.15)',
      padding: 'clamp(3.5rem, 6vw, 5rem) 0 3rem 0',
      color: '#94A3B8',
      fontSize: '0.85rem'
    }}>
      <div className="container-custom">
        <div className="footer-grid" style={{
          display: 'grid',
          gap: 'clamp(2rem, 4vw, 3rem)',
          marginBottom: '3.5rem'
        }}>
          
          {/* Logo & Slogan Column */}
          <div className="footer-brand-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '2.2rem',
                height: '2.2rem',
                borderRadius: 'var(--border-radius-sm)',
                background: 'var(--gold-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0A0A0B',
                boxShadow: '0 0 14px rgba(212, 175, 55, 0.3)',
                flexShrink: 0
              }}>
                <Shield size={18} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-family-title)',
                  color: '#F8FAFC',
                  lineHeight: 1
                }}>
                  PAYZOR <span style={{ color: 'var(--gold-primary)' }}>AI</span>
                </div>
                <div style={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--gold-champagne)',
                  textTransform: 'uppercase',
                  marginTop: '0.15rem'
                }}>
                  Payzor Capital & Recovery Technologies
                </div>
              </div>
            </div>
            
            <p style={{
              lineHeight: 1.5,
              color: '#94A3B8',
              maxWidth: '340px',
              fontSize: '0.84rem'
            }}>
              Autonomous AI revenue recovery & receivables intelligence platform for enterprise trade credit and portfolio risk management.
            </p>
          </div>

          {/* Product links */}
          <div style={footerColStyle}>
            <h5 style={footerColTitleStyle}>Platform</h5>
            <span style={footerLinkStyle}>Receivables Dashboard</span>
            <span style={footerLinkStyle}>Risk Diagnostics</span>
            <span style={footerLinkStyle}>Campaign Studio</span>
            <span style={footerLinkStyle}>AI Copilot</span>
          </div>

          {/* Developers links */}
          <div style={footerColStyle}>
            <h5 style={footerColTitleStyle}>Technology</h5>
            <span style={footerLinkStyle}>FastAPI REST Gateway</span>
            <span style={footerLinkStyle}>Groq Inference Engine</span>
            <span style={footerLinkStyle}>Razorpay Webhooks</span>
            <span style={footerLinkStyle}>RBI Guardrail Filters</span>
          </div>

          {/* Company links */}
          <div style={footerColStyle}>
            <h5 style={footerColTitleStyle}>Organization</h5>
            <span style={footerLinkStyle}>About Payzor</span>
            <span style={footerLinkStyle}>Security Standard</span>
            <span style={footerLinkStyle}>Audit Logs</span>
            <span style={footerLinkStyle}>Enterprise Support</span>
          </div>

          {/* Legal links */}
          <div style={footerColStyle}>
            <h5 style={footerColTitleStyle}>Compliance</h5>
            <span style={footerLinkStyle}>Privacy Policy</span>
            <span style={footerLinkStyle}>Terms of Service</span>
            <span style={footerLinkStyle}>RBI Fair Practices</span>
            <span style={footerLinkStyle}>Data Governance</span>
          </div>

        </div>

        {/* Bottom copyright */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#64748B'
        }}>
          <div>
            &copy; {new Date().getFullYear()} Payzor Capital & Recovery Technologies. All rights reserved.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            <span style={{ cursor: 'pointer', color: '#94A3B8' }}>SOC-2 Type II Certified</span>
            <span style={{ cursor: 'pointer', color: '#94A3B8' }}>System Uptime: 99.99%</span>
          </div>
        </div>
      </div>

      <style>{`
        .footer-grid {
          grid-template-columns: 1fr;
        }
        .footer-brand-col {
          grid-column: span 1;
        }

        @media (min-width: 480px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .footer-brand-col {
            grid-column: span 2;
          }
        }

        @media (min-width: 768px) {
          .footer-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .footer-brand-col {
            grid-column: span 4;
          }
        }

        @media (min-width: 1024px) {
          .footer-grid {
            grid-template-columns: 2fr repeat(4, 1fr);
          }
          .footer-brand-col {
            grid-column: span 1;
          }
        }
      `}</style>
    </footer>
  );
}

const footerColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem'
};

const footerColTitleStyle = {
  fontSize: '0.78rem',
  fontWeight: 800,
  color: 'var(--gold-champagne)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '0.4rem'
};

const footerLinkStyle = {
  color: '#94A3B8',
  cursor: 'pointer',
  transition: 'color 0.2s ease',
  fontSize: '0.82rem'
};
