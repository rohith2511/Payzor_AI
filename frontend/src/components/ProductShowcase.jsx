import React, { useState } from 'react';
import { LayoutDashboard, Users, Brain, Send, BarChart3, Search, Sparkles, Plus, Play, Calendar, UserCheck, MessageSquare, Mail, RefreshCw, CheckCircle2, ShieldCheck, DollarSign } from 'lucide-react';

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [segmentPrompt, setSegmentPrompt] = useState('Find high-value B2B buyers who are overdue on their invoices by more than 15 days with outstanding balance > ₹50,000.');
  const [segmentCompiling, setSegmentCompiling] = useState(false);
  const [segmentResult, setSegmentResult] = useState(null);

  // AI Prompt compiler simulation
  const handleCompileSegment = () => {
    setSegmentCompiling(true);
    setTimeout(() => {
      setSegmentCompiling(false);
      setSegmentResult({
        count: '14 Accounts',
        percentage: '14.0% of debtor base',
        aov: '₹82,400 Avg. Overdue',
        filters: [
          { name: 'Overdue Days', op: 'greater than 15 days' },
          { name: 'Outstanding Amount', op: 'greater than ₹50,000' },
          { name: 'Payment Reliability', op: 'Medium or High Risk' }
        ]
      });
    }, 1000);
  };

  // WhatsApp template rotation
  const [whatsappCopy, setWhatsappCopy] = useState("Dear Accounts Payable, formal payment notice: overdue balance of ₹45,000 is past due. Review and settle securely via Payzor link: checkout.payzor.ai/pay/sim_token_49b1");
  const [isRegeneratingCopy, setIsRegeneratingCopy] = useState(false);
  
  const handleRegenerateCopy = () => {
    setIsRegeneratingCopy(true);
    setTimeout(() => {
      const copies = [
        "Dear Partner, quick update regarding overdue invoice dues of ₹45,000. Please clear dues via your secure Payzor link: checkout.payzor.ai/pay/sim_token_49b1",
        "Important Notice: Your credit account is approaching hold status due to past due invoice of ₹45,000. Settle instantly: checkout.payzor.ai/pay/sim_token_49b1",
        "Formal Payment Notice: Outstanding receivables of ₹45,000 are past maturity. Review statement & resolve: checkout.payzor.ai/pay/sim_token_49b1"
      ];
      setWhatsappCopy(copies[Math.floor(Math.random() * copies.length)]);
      setIsRegeneratingCopy(false);
    }, 600);
  };

  return (
    <section id="showcase" style={{
      padding: 'clamp(4.5rem, 8vw, 7.5rem) 0',
      backgroundColor: '#0A0A0B',
      borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
      position: 'relative',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div className="container-custom">
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--gold-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.5rem'
          }}>
            INTERACTIVE CAPABILITIES TOUR
          </p>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            fontWeight: 800,
            color: '#F8FAFC',
            fontFamily: 'var(--font-family-title)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            maxWidth: '680px',
            margin: '0 auto'
          }}>
            Experience Payzor AI In Action
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(0.88rem, 2vw, 1rem)',
            maxWidth: '540px',
            margin: '0.75rem auto 0',
            lineHeight: 1.5
          }}>
            Explore the live dashboard, debtor ledger risk assessments, natural language audience compilation, and compliant dunning synthesizers.
          </p>
        </div>

        {/* Dashboard Shell Wrapper */}
        <div className="dashboard-shell" style={{
          width: '100%',
          background: '#121318',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid rgba(212, 175, 55, 0.22)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '580px',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          
          {/* Internal Navigation Tabs Header */}
          <div style={{
            borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
            backgroundColor: '#181920',
            padding: '0.75rem 1rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.45rem',
            alignItems: 'center',
            justifyContent: 'flex-start',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }} className="dashboard-tabs">
            <button 
              onClick={() => setActiveTab('dashboard')}
              style={activeTab === 'dashboard' ? activeTabStyle : inactiveTabStyle}
            >
              <LayoutDashboard size={14} /> Recovery Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('customers')}
              style={activeTab === 'customers' ? activeTabStyle : inactiveTabStyle}
            >
              <Users size={14} /> Credit Ledgers
            </button>
            <button 
              onClick={() => setActiveTab('segment')}
              style={activeTab === 'segment' ? activeTabStyle : inactiveTabStyle}
            >
              <Brain size={14} /> AI Audience Builder
            </button>
            <button 
              onClick={() => setActiveTab('studio')}
              style={activeTab === 'studio' ? activeTabStyle : inactiveTabStyle}
            >
              <Send size={14} /> Campaign Studio
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              style={activeTab === 'analytics' ? activeTabStyle : inactiveTabStyle}
            >
              <BarChart3 size={14} /> Recovery Analytics
            </button>
          </div>

          {/* Main Dashboard Screen Viewport */}
          <div style={{
            padding: 'clamp(1rem, 3vw, 1.75rem)',
            backgroundColor: '#0D0E12',
            flex: 1,
            overflowX: 'hidden',
            boxSizing: 'border-box'
          }}>
            
            {/* TAB 1: DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div style={statsBoxStyle}>
                    <span style={statsLabelStyle}>OUTSTANDING RECEIVABLES</span>
                    <h3 style={statsValStyle}>₹84.37L</h3>
                    <span style={{ fontSize: '0.7rem', color: '#FB7185', fontWeight: 700 }}>₹15.11L overdue</span>
                  </div>
                  <div style={statsBoxStyle}>
                    <span style={statsLabelStyle}>REVENUE AT RISK</span>
                    <h3 style={{ ...statsValStyle, color: '#FB7185' }}>₹15.11L</h3>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>6 high-risk accounts</span>
                  </div>
                  <div style={statsBoxStyle}>
                    <span style={statsLabelStyle}>RECOVERED REVENUE</span>
                    <h3 style={{ ...statsValStyle, color: '#34D399' }}>₹4.13Cr</h3>
                    <span style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: 700 }}>83.0% recovery rate</span>
                  </div>
                  <div style={statsBoxStyle}>
                    <span style={statsLabelStyle}>PROMISE-TO-PAY (PTP)</span>
                    <h3 style={{ ...statsValStyle, color: 'var(--gold-hover)' }}>₹4.50L</h3>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>2 active commitments</span>
                  </div>
                </div>

                {/* Main Table Preview */}
                <div style={{ background: '#121318', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.18)', padding: '1rem', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                      Live Receivables Priority Queue
                    </h4>
                    <span style={{ fontSize: '0.68rem', color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      ● Auto-Risk Scanning Active
                    </span>
                  </div>

                  <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '480px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <th style={{ padding: '0.45rem' }}>Debtor Business</th>
                          <th style={{ padding: '0.45rem' }}>Risk Tier</th>
                          <th style={{ padding: '0.45rem', textAlign: 'right' }}>Outstanding</th>
                          <th style={{ padding: '0.45rem', textAlign: 'right' }}>Overdue</th>
                          <th style={{ padding: '0.45rem', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody style={{ fontSize: '0.75rem' }}>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '0.6rem 0.45rem', fontWeight: 700, color: '#F8FAFC' }}>Sunita Kumar Electronics</td>
                          <td style={{ padding: '0.6rem 0.45rem' }}>
                            <span className="badge-critical">Critical (92%)</span>
                          </td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right', fontWeight: 600, color: '#F8FAFC' }}>₹2,90,786</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right', color: '#FB7185', fontWeight: 700 }}>₹2,61,633</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right' }}>
                            <span style={{ color: 'var(--gold-hover)', fontWeight: 700, cursor: 'pointer' }}>Trigger Outreach</span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '0.6rem 0.45rem', fontWeight: 700, color: '#F8FAFC' }}>Zenith Infra Corp</td>
                          <td style={{ padding: '0.6rem 0.45rem' }}>
                            <span className="badge-high">High (84%)</span>
                          </td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right', fontWeight: 600, color: '#F8FAFC' }}>₹3,50,000</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right', color: '#FB7185', fontWeight: 700 }}>₹2,50,000</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right' }}>
                            <span className="badge-ptp">Paused (PTP)</span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.6rem 0.45rem', fontWeight: 700, color: '#F8FAFC' }}>Titan Industrial Infra Ltd</td>
                          <td style={{ padding: '0.6rem 0.45rem' }}>
                            <span className="badge-critical">Critical (95%)</span>
                          </td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right', fontWeight: 600, color: '#F8FAFC' }}>₹6,50,000</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right', color: '#FB7185', fontWeight: 700 }}>₹5,50,000</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right' }}>
                            <span style={{ color: 'var(--gold-hover)', fontWeight: 700, cursor: 'pointer' }}>Trigger Outreach</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CREDIT ACCOUNTS VIEW */}
            {activeTab === 'customers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#121318', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.18)', padding: '1rem', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#F8FAFC' }}>Debtor Portfolio Overview</div>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>100 B2B Accounts</span>
                  </div>

                  <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '480px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8', fontSize: '0.68rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '0.45rem' }}>Customer / Company</th>
                          <th style={{ padding: '0.45rem' }}>Credit Limit</th>
                          <th style={{ padding: '0.45rem', textAlign: 'right' }}>Outstanding</th>
                          <th style={{ padding: '0.45rem', textAlign: 'right' }}>Overdue</th>
                          <th style={{ padding: '0.45rem', textAlign: 'center' }}>Reliability</th>
                        </tr>
                      </thead>
                      <tbody style={{ fontSize: '0.75rem' }}>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '0.6rem 0.45rem', fontWeight: 700, color: '#F8FAFC' }}>Apex Logistics Pvt Ltd</td>
                          <td style={{ padding: '0.6rem 0.45rem', color: '#F8FAFC' }}>₹10,00,000</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right', fontWeight: 600, color: '#F8FAFC' }}>₹1,20,000</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right', color: '#34D399', fontWeight: 700 }}>₹0</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'center' }}>
                            <span className="badge-low">High</span>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '0.6rem 0.45rem', fontWeight: 700, color: '#F8FAFC' }}>Ravi Traders Mumbai</td>
                          <td style={{ padding: '0.6rem 0.45rem', color: '#F8FAFC' }}>₹5,00,000</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right', fontWeight: 600, color: '#F8FAFC' }}>₹1,40,000</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right', color: '#FB7185', fontWeight: 700 }}>₹45,000</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'center' }}>
                            <span className="badge-critical">Low</span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.6rem 0.45rem', fontWeight: 700, color: '#F8FAFC' }}>Meridian Supply Chains</td>
                          <td style={{ padding: '0.6rem 0.45rem', color: '#F8FAFC' }}>₹8,00,000</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right', fontWeight: 600, color: '#F8FAFC' }}>₹2,20,000</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'right', color: '#FB7185', fontWeight: 700 }}>₹2,00,000</td>
                          <td style={{ padding: '0.6rem 0.45rem', textAlign: 'center' }}>
                            <span className="badge-medium">Medium</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AI AUDIENCE BUILDER VIEW */}
            {activeTab === 'segment' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#121318', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.18)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#F8FAFC' }}>Natural Language Recovery Query</div>
                  <textarea 
                    value={segmentPrompt}
                    onChange={(e) => setSegmentPrompt(e.target.value)}
                    style={{ width: '100%', height: '80px', padding: '0.5rem', fontSize: '0.75rem', background: '#0A0A0B', color: '#F8FAFC', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '6px', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                  <button 
                    onClick={handleCompileSegment}
                    disabled={segmentCompiling}
                    className="btn-fintech-primary"
                    style={{ padding: '0.5rem', justifyContent: 'center', fontSize: '0.78rem' }}
                  >
                    <Sparkles size={13} /> {segmentCompiling ? 'Compiling Rules...' : 'Generate Recovery Cohort'}
                  </button>
                </div>

                <div style={{ background: '#121318', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.18)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#F8FAFC' }}>AI-Compiled Cohort Output</div>
                  {segmentResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: '#94A3B8' }}>Matched Accounts:</span>
                        <strong style={{ color: 'var(--gold-primary)' }}>{segmentResult.count}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: '#94A3B8' }}>Avg Overdue:</span>
                        <strong style={{ color: '#FB7185' }}>{segmentResult.aov}</strong>
                      </div>
                      <div style={{ backgroundColor: '#0A0A0B', padding: '0.55rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <strong style={{ color: 'var(--gold-champagne)' }}>Parsed Rules:</strong>
                        {segmentResult.filters.map((f, i) => (
                          <div key={i} style={{ color: '#94A3B8', marginTop: '0.15rem' }}>✓ {f.name} {f.op}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#64748B', textAlign: 'center', padding: '2rem 0' }}>
                      Click "Generate Recovery Cohort" to compile rules.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: CAMPAIGN STUDIO VIEW */}
            {activeTab === 'studio' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#121318', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.18)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#F8FAFC' }}>B2B Dunning Notice (WhatsApp)</div>
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.72rem', color: '#34D399', lineHeight: 1.45 }}>
                    {whatsappCopy}
                  </div>
                  <button 
                    onClick={handleRegenerateCopy}
                    disabled={isRegeneratingCopy}
                    style={{ backgroundColor: '#181920', border: '1px solid rgba(212, 175, 55, 0.25)', color: '#F8FAFC', padding: '0.45rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <RefreshCw size={12} className={isRegeneratingCopy ? 'animate-spin' : ''} /> Regenerate Copy
                  </button>
                </div>

                <div style={{ background: '#121318', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.18)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#F8FAFC' }}>Guardrail Compliance Verification</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.72rem', marginTop: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34D399' }}>
                      <CheckCircle2 size={13} /> 24h Outreach Cooldown Active
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34D399' }}>
                      <CheckCircle2 size={13} /> Promise-to-Pay Exclusions Enforced
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34D399' }}>
                      <CheckCircle2 size={13} /> Max 3 Notices / Week Limit
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ANALYTICS VIEW */}
            {activeTab === 'analytics' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={statsBoxStyle}>
                  <span style={statsLabelStyle}>RECOVERY PIPELINE FUNNEL</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.72rem', color: '#94A3B8' }}>
                    <div>Targeted: <strong style={{ color: '#F8FAFC' }}>14 Accounts</strong></div>
                    <div>Eligible: <strong style={{ color: '#F8FAFC' }}>11 Accounts</strong></div>
                    <div>Settled: <strong style={{ color: '#34D399' }}>4 Accounts (36.4%)</strong></div>
                  </div>
                </div>

                <div style={statsBoxStyle}>
                  <span style={statsLabelStyle}>CHANNEL EFFECTIVENESS</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.72rem', color: '#94A3B8' }}>
                    <div>WhatsApp: <strong style={{ color: '#34D399' }}>78.2% (₹3.2M)</strong></div>
                    <div>Email: <strong style={{ color: '#F8FAFC' }}>15.4% (₹640K)</strong></div>
                    <div>SMS: <strong style={{ color: '#F8FAFC' }}>6.4% (₹260K)</strong></div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </section>
  );
}

const activeTabStyle = {
  background: 'var(--gold-gradient)',
  color: '#0A0A0B',
  border: 'none',
  padding: '0.45rem 0.85rem',
  fontSize: '0.78rem',
  fontWeight: 800,
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  whiteSpace: 'nowrap',
  boxShadow: '0 2px 10px rgba(212, 175, 55, 0.3)'
};

const inactiveTabStyle = {
  backgroundColor: '#121318',
  color: '#94A3B8',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '0.45rem 0.85rem',
  fontSize: '0.78rem',
  fontWeight: 600,
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  whiteSpace: 'nowrap'
};

const statsBoxStyle = {
  backgroundColor: '#121318',
  border: '1px solid rgba(212, 175, 55, 0.18)',
  borderRadius: '8px',
  padding: '0.85rem 1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)'
};

const statsLabelStyle = {
  fontSize: '0.62rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--gold-champagne)'
};

const statsValStyle = {
  fontSize: '1.25rem',
  fontWeight: 800,
  fontFamily: 'var(--font-family-title)',
  color: '#F8FAFC',
  margin: '0.1rem 0'
};
