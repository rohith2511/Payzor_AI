import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, Send, DollarSign, Percent, TrendingUp, Sparkles,
  ArrowUpRight, AlertCircle, MessageSquare, Mail, Play,
  ShieldAlert, ShieldCheck, ArrowRight, Activity, Clock, CheckCircle2
} from 'lucide-react';
import { useCrm } from './CrmContext';
import { formatINR, getRiskColorTokens } from '../../utils/fintechFormatters';

export default function CrmDashboard({ setActivePage }) {
  const { customers, orders, campaigns, recoveryDashboard, recoveryAudits, loading } = useCrm();

  if (loading) {
    return (
      <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '2rem', height: '2rem', border: '3px solid #e2e8f0', borderTopColor: 'var(--blue-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Synchronizing B2B recovery ledgers...</div>
        </div>
      </div>
    );
  }

  const dashboardData = recoveryDashboard || {
    summary: {
      total_outstanding: 0,
      total_overdue: 0,
      amount_recovered: 0,
      high_risk_receivables: 0,
      recovery_rate: 0,
      high_risk_customers: 0,
      customers_analyzed: 0,
      recommended_actions: 0
    },
    audits: []
  };

  const summary = dashboardData.summary;
  const totalCreditIssued = Number(summary.total_outstanding || 0) + Number(summary.amount_recovered || 0);
  const outstandingAmount = Number(summary.total_outstanding || 0);
  const overdueAmount = Number(summary.total_overdue || 0);
  const amountRecovered = Number(summary.amount_recovered || 0);
  const recoveryRate = Number(summary.recovery_rate || 0);
  const highRiskDues = Number(summary.high_risk_receivables || 0);
  const highRiskCount = Number(summary.high_risk_customers || 0);

  // Top 4 High-Impact Fintech Metrics
  const metrics = [
    { 
      name: 'TOTAL CREDIT EXPOSURE', 
      value: formatINR(totalCreditIssued, true), 
      exact: formatINR(totalCreditIssued),
      change: `${customers.length} total accounts`, 
      icon: <Users size={16} />, 
      color: 'var(--blue-primary)', 
      bg: 'var(--blue-light)' 
    },
    { 
      name: 'OUTSTANDING RECEIVABLES', 
      value: formatINR(outstandingAmount, true), 
      exact: formatINR(outstandingAmount),
      change: `${formatINR(overdueAmount, true)} overdue`, 
      icon: <Send size={16} />, 
      color: '#475569', 
      bg: '#f1f5f9' 
    },
    { 
      name: 'REVENUE AT RISK', 
      value: formatINR(highRiskDues, true), 
      exact: formatINR(highRiskDues),
      change: `${highRiskCount} high-risk flags`, 
      icon: <Percent size={16} />, 
      color: '#dc2626', 
      bg: '#fef2f2' 
    },
    { 
      name: 'RECOVERED REVENUE', 
      value: formatINR(amountRecovered, true), 
      exact: formatINR(amountRecovered),
      change: `${recoveryRate.toFixed(1)}% recovery rate`, 
      icon: <DollarSign size={16} />, 
      color: '#16a34a', 
      bg: '#f0fdf4' 
    }
  ];

  // Group recovery data by month from backend PostgreSQL recovery records
  const getMonthlyRecoveryData = () => {
    if (recoveryDashboard?.chart && Array.isArray(recoveryDashboard.chart) && recoveryDashboard.chart.length > 0) {
      return recoveryDashboard.chart.map(m => ({
        name: m.name || m.month,
        displayName: m.month || m.name,
        revenue: Number(m.recovered || 0)
      }));
    }

    if (recoveryDashboard?.monthly_data && Array.isArray(recoveryDashboard.monthly_data) && recoveryDashboard.monthly_data.length > 0) {
      return recoveryDashboard.monthly_data.map(m => ({
        name: m.month,
        displayName: m.displayName || m.month,
        revenue: Number(m.recovered || 0)
      }));
    }

    const months = [];
    const date = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        revenue: 0
      });
    }

    (recoveryAudits || []).forEach(a => {
      if (a.status === 'success' && a.created_at) {
        const ad = new Date(a.created_at);
        const found = months.find(item => item.monthNum === ad.getMonth() && item.year === ad.getFullYear());
        if (found) {
          found.revenue += Number(a.recovered_amount || a.amount || 0);
        }
      }
    });

    return months;
  };

  const monthsData = getMonthlyRecoveryData();
  const maxChartRev = Math.max(...monthsData.map(m => m.revenue), 1);
  const points = monthsData.map((m, idx) => {
    const x = idx * 100;
    const y = maxChartRev > 0 ? 175 - (m.revenue / maxChartRev) * 145 : 175;
    return { x, y };
  });

  let linePath = `M 0 ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i+1];
    const cp1x = p0.x + 50;
    const cp1y = p0.y;
    const cp2x = p1.x - 50;
    const cp2y = p1.y;
    linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }
  const areaPath = `${linePath} L 500 200 L 0 200 Z`;

  // Top at-risk debtor accounts for quick preview
  const atRiskAccounts = [...customers]
    .sort((a, b) => (parseFloat(b.overdue_amount || 0) - parseFloat(a.overdue_amount || 0)))
    .slice(0, 5);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* 1. Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: 'var(--text-primary)', letterSpacing: '-0.025em', margin: 0 }}>
              Revenue Recovery Command Center
            </h1>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px', backgroundColor: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-champagne)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              Live PostgreSQL Ledgers
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            AI-powered visibility into receivables, revenue at risk, and recovery performance.
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            onClick={() => setActivePage('audience')}
            style={secondaryActionButtonStyle}
          >
            <Sparkles size={14} /> AI Audience Builder
          </button>
          
          <button
            onClick={() => setActivePage('recovery')}
            style={primaryActionButtonStyle}
          >
            <ShieldAlert size={14} /> Review Recovery Queue
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div style={metricsGridStyle}>
        {metrics.map((m, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            style={metricCardStyle}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={metricLabelStyle}>{m.name}</span>
              <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '6px', backgroundColor: m.bg, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {m.icon}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={metricValueStyle}>{m.value}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} title={m.exact}>
                {m.exact}
              </span>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.4rem', fontWeight: 500 }}>
              {m.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. Hero AI Recovery Insight Box */}
      <div style={aiInsightHeroBoxStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={aiInsightIconBadgeStyle}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--blue-primary)', marginBottom: '0.2rem' }}>
              AI RECOVERY INSIGHT & INTERVENTION
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              AI recommends prioritizing <span style={{ color: '#dc2626' }}>{highRiskCount} high-risk accounts</span> with <span style={{ color: '#dc2626' }}>{formatINR(highRiskDues, true)}</span> of exposed receivables.
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Dunning workflows with Promise-to-Pay guardrails and cooldown protection are ready for automated dispatch.
            </div>
          </div>
        </div>

        <button 
          onClick={() => setActivePage('recovery')}
          style={aiInsightActionBtnStyle}
        >
          <span>Review Recovery Queue</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 4. Chart & Top Accounts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
        
        {/* Monthly Dues Recovered Bezier Curve Chart */}
        <div style={contentCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={cardTitleStyle}>Monthly Dues Recovered (₹)</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Authoritative PostgreSQL recovery audit stream (Trailing 6 Months)
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
              Total: {formatINR(amountRecovered, true)}
            </span>
          </div>

          <div style={{ height: '220px', width: '100%', position: 'relative' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="recoveryChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Background Grid Horizontal Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="175" x2="500" y2="175" stroke="#e2e8f0" strokeWidth="1" />

              {/* Area Fill */}
              <path d={areaPath} fill="url(#recoveryChartGradient)" />

              {/* Line Curve */}
              <path d={linePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />

              {/* Interactive Data Points */}
              {points.map((p, i) => {
                const item = monthsData[i];
                return (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
                    <text x={p.x} y="195" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">
                      {item.displayName || item.name}
                    </text>
                    {item.revenue > 0 && (
                      <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fill="#047857" fontWeight="700">
                        {formatINR(item.revenue, true)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Top Delinquent Accounts at Risk */}
        <div style={contentCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={cardTitleStyle}>Top Accounts at Risk</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Highest exposure accounts requiring immediate attention
              </p>
            </div>
            <button 
              onClick={() => setActivePage('customers')}
              style={{ background: 'none', border: 'none', color: 'var(--blue-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              View All <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {atRiskAccounts.map((c, idx) => {
              const riskTokens = getRiskColorTokens(c.ai_risk_level || c.riskLevel);
              const overdue = parseFloat(c.overdue_amount || 0);
              const isPtp = (c.promise_to_pay_status || '').toUpperCase() === 'ACTIVE';

              return (
                <div 
                  key={c.id || idx} 
                  style={accountRowStyle}
                  onClick={() => setActivePage('customers')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={avatarStyle}>
                      {c.name ? c.name.slice(0, 2).toUpperCase() : 'DB'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {c.name}
                        <span style={{
                          fontSize: '0.6rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                          backgroundColor: riskTokens.bg,
                          color: riskTokens.text,
                          border: `1px solid ${riskTokens.border}`
                        }}>
                          {riskTokens.label}
                        </span>
                        {isPtp && (
                          <span style={{ fontSize: '0.58rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: '#fffbeb', color: '#92400e', fontWeight: 700, border: '1px solid #fde68a' }}>
                            PTP ACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        Risk Score: <strong>{c.ai_risk_score || c.riskScore || 50}</strong> • {c.email || c.phone}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>
                      {formatINR(overdue)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      Out: {formatINR(c.outstanding_amount || 0)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

// Styling tokens for Dashboard
const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1.25rem'
};

const metricCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '1.25rem',
  boxShadow: 'var(--shadow-sm)',
  display: 'flex',
  flexDirection: 'column'
};

const metricLabelStyle = {
  fontSize: '0.65rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)'
};

const metricValueStyle = {
  fontSize: '1.5rem',
  fontWeight: 800,
  fontFamily: 'var(--font-family-title)',
  color: 'var(--text-primary)',
  letterSpacing: '-0.03em'
};

const aiInsightHeroBoxStyle = {
  backgroundColor: 'rgba(212, 175, 55, 0.08)',
  border: '1px solid rgba(212, 175, 55, 0.25)',
  borderRadius: '12px',
  padding: '1.25rem 1.5rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
};

const aiInsightIconBadgeStyle = {
  width: '2.4rem',
  height: '2.4rem',
  borderRadius: '10px',
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  boxShadow: '0 2px 8px var(--gold-glow)'
};

const aiInsightActionBtnStyle = {
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c',
  border: 'none',
  borderRadius: '8px',
  padding: '0.6rem 1.1rem',
  fontSize: '0.8rem',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  boxShadow: '0 2px 8px var(--gold-glow)',
  transition: 'all 0.15s'
};

const contentCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-sm)'
};

const cardTitleStyle = {
  fontSize: '1rem',
  fontWeight: 800,
  fontFamily: 'var(--font-family-title)',
  color: 'var(--text-primary)',
  margin: 0
};

const primaryActionButtonStyle = {
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c',
  border: 'none',
  borderRadius: '8px',
  padding: '0.55rem 1rem',
  fontSize: '0.8rem',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  boxShadow: '0 2px 8px var(--gold-glow)'
};

const secondaryActionButtonStyle = {
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '0.55rem 0.9rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem'
};

const accountRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.6rem 0.75rem',
  borderRadius: '8px',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const avatarStyle = {
  width: '1.75rem',
  height: '1.75rem',
  borderRadius: '50%',
  backgroundColor: 'rgba(212, 175, 55, 0.15)',
  color: 'var(--gold-primary)',
  border: '1px solid var(--border-color)',
  fontWeight: 800,
  fontSize: '0.68rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};
