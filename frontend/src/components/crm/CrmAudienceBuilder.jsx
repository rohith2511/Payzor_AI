import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  Save, 
  User, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  DollarSign, 
  CheckCircle2, 
  Check, 
  Sliders, 
  FileText, 
  Clock, 
  Activity,
  Edit3,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useCrm } from './CrmContext';
import crmApi from '../../api/crmApi';

const SUGGESTIONS = [
  "Show customers with overdue balances above ₹1 lakh.",
  "Find high-risk B2B customers with overdue receivables.",
  "Identify customers with overdue invoices older than 30 days.",
  "Show customers with high outstanding exposure and low repayment reliability.",
  "Find Promise-to-Pay accounts whose commitment date has expired.",
  "Find critical-risk customers with more than ₹5 lakh overdue.",
  "Show accounts with high revenue at risk and poor repayment reliability."
];

export default function CrmAudienceBuilder({ setActivePage }) {
  const { customers = [], audienceBuilderState = {}, setAudienceBuilderState, setCampaignStudioState } = useCrm();
  const prompt = audienceBuilderState?.prompt || '';
  const result = audienceBuilderState?.result || null;
  const textareaRef = useRef(null);

  const setPrompt = (val) => setAudienceBuilderState(prev => ({ ...prev, prompt: val }));
  const setResult = (val) => setAudienceBuilderState(prev => ({ ...prev, result: typeof val === 'function' ? val(prev.result) : val }));

  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const creditsRemaining = Math.max(0, 30 - usageCount);
  const isExhausted = creditsRemaining === 0;

  React.useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const data = await crmApi.getAiUsage();
      setUsageCount(data.audience_builder || 0);
    } catch (e) {
      console.error("Failed to fetch AI usage:", e);
    }
  };

  const handleCompile = async () => {
    if (!prompt || !prompt.trim()) return;
    setCompiling(true);
    setResult(null);
    setError(null);

    try {
      const res = await crmApi.queryAudience(prompt);
      const matchedCustomers = res.customers || [];
      const filtersData = res.filters || {};

      // Dynamic rule bullet points
      const ruleBullets = [];
      if (filtersData.min_overdue) {
        ruleBullets.push(`Overdue balance > ₹${Number(filtersData.min_overdue).toLocaleString('en-IN')}`);
      } else if (filtersData.has_overdue) {
        ruleBullets.push("Overdue balance > ₹0");
      }

      if (filtersData.min_outstanding) {
        ruleBullets.push(`Outstanding balance > ₹${Number(filtersData.min_outstanding).toLocaleString('en-IN')}`);
      } else if (filtersData.has_outstanding) {
        ruleBullets.push("Outstanding balance > ₹0");
      }

      if (filtersData.risk_levels && filtersData.risk_levels.length > 0) {
        ruleBullets.push(`Risk tier in: ${filtersData.risk_levels.join(', ')}`);
      }

      if (filtersData.min_risk_score) {
        ruleBullets.push(`Risk score ≥ ${filtersData.min_risk_score}`);
      }

      if (filtersData.min_days_overdue) {
        ruleBullets.push(`Invoices overdue > ${filtersData.min_days_overdue} days`);
      }

      if (filtersData.payment_reliability) {
        ruleBullets.push(`Repayment reliability: ${filtersData.payment_reliability}`);
      }

      if (filtersData.ptp_status) {
        ruleBullets.push(`Promise-to-Pay status: ${filtersData.ptp_status}`);
      }

      // Default safety guardrails always enforced
      if (filtersData.ptp_status !== 'ACTIVE') {
        ruleBullets.push("Exclude active Promise-to-Pay accounts");
      }
      ruleBullets.push("Exclude accounts within 24-hour recovery cooldown");

      // Aggregate calculations from database response
      const totalOverdue = res.total_overdue ?? matchedCustomers.reduce((acc, c) => acc + (parseFloat(c.overdue_amount || c.overdueAmount) || 0), 0);
      const totalOutstanding = res.total_outstanding ?? matchedCustomers.reduce((acc, c) => acc + (parseFloat(c.outstanding_amount || c.outstandingAmount) || 0), 0);
      const revenueAtRisk = res.revenue_at_risk ?? totalOverdue;
      const avgRiskScore = res.average_risk_score ?? (matchedCustomers.length > 0 ? (matchedCustomers.reduce((acc, c) => acc + (parseFloat(c.ai_risk_score || c.riskScore) || 0), 0) / matchedCustomers.length).toFixed(1) : 0);

      const criticalCount = res.critical_count ?? matchedCustomers.filter(c => (c.ai_risk_level || c.riskLevel || '').toLowerCase() === 'critical').length;
      const highCount = res.high_count ?? matchedCustomers.filter(c => (c.ai_risk_level || c.riskLevel || '').toLowerCase() === 'high').length;
      const mediumCount = res.medium_count ?? matchedCustomers.filter(c => ['medium', 'moderate'].includes((c.ai_risk_level || c.riskLevel || '').toLowerCase())).length;

      const ptpActiveCount = res.ptp_active_count ?? matchedCustomers.filter(c => (c.promise_to_pay_status || c.ptp_status || '').toUpperCase() === 'ACTIVE').length;
      const ptpActiveAmount = res.ptp_active_amount ?? matchedCustomers.filter(c => (c.promise_to_pay_status || c.ptp_status || '').toUpperCase() === 'ACTIVE').reduce((acc, c) => acc + (parseFloat(c.promise_to_pay_amount || c.overdue_amount || 0)), 0);
      const zeroBalanceCount = res.zero_balance_count ?? matchedCustomers.filter(c => (parseFloat(c.outstanding_amount || c.outstandingAmount || 0) <= 0) && (c.promise_to_pay_status || c.ptp_status || '').toUpperCase() !== 'ACTIVE').length;
      const eligibleCount = res.eligible_count ?? Math.max(0, matchedCustomers.length - ptpActiveCount - zeroBalanceCount);

      const cohortName = res.segment_name || filtersData.segment_name || `Recovery Audience: ${prompt.slice(0, 35)}`;

      setResult({
        name: cohortName,
        sizeCount: matchedCustomers.length,
        size: `${matchedCustomers.length} Accounts`,
        share: `${((matchedCustomers.length / (customers.length || 1)) * 100).toFixed(1)}% of debtor portfolio`,
        totalOverdue: `₹${Math.round(totalOverdue).toLocaleString('en-IN')}`,
        totalOutstanding: `₹${Math.round(totalOutstanding).toLocaleString('en-IN')}`,
        revenueAtRisk: `₹${Math.round(revenueAtRisk).toLocaleString('en-IN')}`,
        avgRiskScore: typeof avgRiskScore === 'number' ? avgRiskScore.toFixed(1) : avgRiskScore,
        criticalCount,
        highCount,
        mediumCount,
        eligibleCount,
        ptpActiveCount,
        ptpActiveAmount,
        zeroBalanceCount,
        isFallback: res.is_fallback || false,
        whyThisAudience: res.why_this_audience || filtersData.why_this_audience || 'These B2B accounts exhibit elevated delinquency risk and overdue balances, qualifying for bounded AI recovery outreach.',
        ruleBullets: ruleBullets,
        customers: matchedCustomers,
        matches: matchedCustomers.slice(0, 8).map(c => {
          const isPtp = (c.promise_to_pay_status || c.ptp_status || '').toUpperCase() === 'ACTIVE';
          const isZero = (parseFloat(c.outstanding_amount || c.outstandingAmount || 0) <= 0);
          let statusLabel = 'Recovery Eligible';
          let statusBadgeClass = 'eligible';
          if (isPtp) {
            statusLabel = 'Paused — PTP';
            statusBadgeClass = 'ptp';
          } else if (isZero) {
            statusLabel = 'Skipped — Zero Bal';
            statusBadgeClass = 'zero';
          }

          return {
            name: c.name,
            email: c.email || c.phone,
            overdue: `₹${Math.round(parseFloat(c.overdue_amount || c.overdueAmount) || 0).toLocaleString('en-IN')}`,
            outstanding: `₹${Math.round(parseFloat(c.outstanding_amount || c.outstandingAmount) || 0).toLocaleString('en-IN')}`,
            riskLevel: c.ai_risk_level || c.riskLevel || 'Medium',
            riskScore: Math.round(parseFloat(c.ai_risk_score || c.riskScore || 50)),
            statusLabel,
            statusBadgeClass
          };
        })
      });
    } catch (err) {
      console.error("Failed to query audience:", err);
      const errMsg = err.response?.data?.detail || "Couldn't identify a recovery rule from that request. Try an example below.";
      setError(errMsg);
      setResult(null);
    } finally {
      setCompiling(false);
      fetchUsage();
    }
  };

  const handleRefine = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleUseInCampaign = () => {
    if (!result) return;
    setCampaignStudioState(prev => ({
      ...prev,
      audience: result.name || 'High-Risk B2B Overdue Accounts',
      goal: `AI Revenue Recovery for ${result.name}`,
      channel: 'whatsapp'
    }));
    if (setActivePage) {
      setActivePage('campaign');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* 1. Page Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              AI Revenue Recovery Audience Builder
            </h1>
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              padding: '0.2rem 0.55rem', 
              borderRadius: '9999px', 
              backgroundColor: 'rgba(212, 175, 55, 0.12)', 
              color: 'var(--gold-300)', 
              border: '1px solid rgba(212, 175, 55, 0.3)' 
            }}>
              Payzor AI Engine • Real-time Scoring
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Describe revenue-at-risk accounts in natural language. AI generates explainable recovery audience rules.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: '0.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isExhausted ? 'var(--red-primary)' : 'var(--text-primary)' }}>
            Credits Remaining: {creditsRemaining}/30
          </div>
          {isExhausted && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              Available again in 2 hours.
            </div>
          )}
        </div>
      </div>

      <div style={builderGridStyle}>
        
        {/* 2. Left Side: Natural Language Input Card */}
        <div style={builderPanelCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Brain size={18} style={{ color: 'var(--blue-primary)' }} />
            <h3 style={cardTitleStyle}>Describe Your Recovery Audience</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <textarea 
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={textareaStyle}
              placeholder={isExhausted ? "You can use this module again after 2 hours." : "Find high-risk B2B customers with overdue balances above ₹1 lakh."}
              disabled={compiling || isExhausted}
            />
            
            <button 
              onClick={handleCompile}
              disabled={compiling || isExhausted || !prompt.trim()}
              style={{
                ...compileButtonStyle,
                opacity: (!prompt.trim() || compiling || isExhausted) ? 0.65 : 1,
                cursor: (!prompt.trim() || compiling || isExhausted) ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (prompt.trim() && !compiling && !isExhausted) e.currentTarget.style.backgroundColor = 'var(--blue-hover)';
              }}
              onMouseLeave={(e) => {
                if (prompt.trim() && !compiling && !isExhausted) e.currentTarget.style.backgroundColor = 'var(--blue-primary)';
              }}
            >
              {compiling ? (
                <>
                  <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Compiling Recovery Audience...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Generate Recovery Audience
                </>
              )}
            </button>
          </div>

          {/* Prompt Suggestions - Strictly Track 03 Revenue Recovery */}
          <div style={{ marginTop: '2rem' }}>
            <div style={suggestionLabelStyle}>Try These Recovery Templates</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.6rem' }}>
              {SUGGESTIONS.map((s, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    setPrompt(s);
                    if (textareaRef.current) textareaRef.current.focus();
                  }}
                  style={suggestionItemStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.color = 'var(--blue-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  "{s}"
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Right Side: AI Recovery Result Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AnimatePresence mode="wait">
            {compiling && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={emptyPanelStyle}
              >
                <RefreshCw size={26} className="animate-spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--blue-primary)' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Evaluating B2B Ledger & Risk Profiles...</div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                  AI parser extracting financial overdue thresholds, aging parameters, and guardrail criteria.
                </span>
              </motion.div>
            )}

            {!compiling && result && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                {/* Main AI Recovery Audience Card */}
                <div style={resultPanelCardStyle}>
                  
                  {/* Top Bar: Title & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--blue-primary)', marginBottom: '0.2rem' }}>
                        AI RECOVERY AUDIENCE
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-family-title)' }}>
                        {result.name}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <button 
                        onClick={handleRefine}
                        style={refineButtonStyle}
                        title="Edit natural language prompt"
                      >
                        <Edit3 size={13} /> Refine Audience
                      </button>
                      
                      <button 
                        onClick={handleUseInCampaign} 
                        style={primaryCampaignButtonStyle}
                        title="Dispatch this recovery audience into Campaign Studio"
                      >
                        <span>Use Audience in Recovery Campaign</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 4 Key Recovery KPI Metrics */}
                  <div style={metricsGridStyle}>
                    <div style={metricBoxStyle}>
                      <span style={metricLabelStyle}>ACCOUNTS MATCHED</span>
                      <strong style={metricValStyle}>{result.sizeCount}</strong>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{result.share}</span>
                    </div>
                    <div style={metricBoxStyle}>
                      <span style={metricLabelStyle}>REVENUE AT RISK</span>
                      <strong style={{ ...metricValStyle, color: '#dc2626' }}>{result.revenueAtRisk}</strong>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>High-risk exposure</span>
                    </div>
                    <div style={metricBoxStyle}>
                      <span style={metricLabelStyle}>OVERDUE BALANCE</span>
                      <strong style={{ ...metricValStyle, color: '#b91c1c' }}>{result.totalOverdue}</strong>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Total unpaid dues</span>
                    </div>
                    <div style={metricBoxStyle}>
                      <span style={metricLabelStyle}>AVERAGE RISK SCORE</span>
                      <strong style={{ ...metricValStyle, color: '#ea580c' }}>{result.avgRiskScore}</strong>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Portfolio risk avg</span>
                    </div>
                  </div>

                  {/* AI Why This Audience / Interpretation Summary */}
                  <div style={{ marginTop: '1.1rem', padding: '0.75rem 0.9rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold-champagne)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Activity size={13} style={{ color: 'var(--gold-primary)' }} /> AI Diagnosis & Targeting Logic
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {result.whyThisAudience}
                    </div>
                  </div>

                  {/* Explainable AI Rules Section */}
                  <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
                      AI-Generated Recovery Rules
                    </div>
                    
                    {result.isFallback && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--gold-champagne)', backgroundColor: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '0.4rem 0.6rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                        AI interpretation unavailable — using deterministic recovery rules.
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.45rem' }}>
                      {result.ruleBullets && result.ruleBullets.map((rule, idx) => (
                        <div key={idx} style={ruleItemStyle}>
                          <Check size={13} style={{ color: '#16a34a', strokeWidth: 3, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.73rem', color: '#334155', fontWeight: 500 }}>{rule}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '1.1rem', padding: '0.75rem 0.9rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                        <Zap size={13} style={{ color: 'var(--gold-primary)' }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gold-primary)', letterSpacing: '0.04em' }}>Generated PostgreSQL Query Logic</span>
                      </div>
                      <code style={{ fontSize: '0.72rem', color: '#cbd5e1', fontFamily: 'monospace', display: 'block', wordBreak: 'break-all' }}>
                        {result.sqlQuery}
                      </code>
                    </div>
                  </div>

                </div>

                {/* Financial Exposure & Guardrails Side-by-Side Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  
                  {/* Financial Exposure Breakdown */}
                  <div style={subCardStyle}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={14} style={{ color: 'var(--gold-primary)' }} /> Portfolio Exposure
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={exposureRowStyle}>
                        <span style={exposureLabelStyle}>Revenue at Risk</span>
                        <strong style={{ color: '#f87171', fontSize: '0.8rem' }}>{result.revenueAtRisk}</strong>
                      </div>
                      <div style={exposureRowStyle}>
                        <span style={exposureLabelStyle}>Overdue Balance</span>
                        <strong style={{ color: '#f87171', fontSize: '0.8rem' }}>{result.totalOverdue}</strong>
                      </div>
                      <div style={exposureRowStyle}>
                        <span style={exposureLabelStyle}>Accounts</span>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{result.sizeCount}</strong>
                      </div>
                      <div style={exposureRowStyle}>
                        <span style={exposureLabelStyle}>Critical Risk</span>
                        <strong style={{ color: '#f87171', fontSize: '0.8rem' }}>{result.criticalCount}</strong>
                      </div>
                      <div style={exposureRowStyle}>
                        <span style={exposureLabelStyle}>High Risk</span>
                        <strong style={{ color: '#fb923c', fontSize: '0.8rem' }}>{result.highCount}</strong>
                      </div>
                      <div style={exposureRowStyle}>
                        <span style={exposureLabelStyle}>Medium Risk</span>
                        <strong style={{ color: '#34d399', fontSize: '0.8rem' }}>{result.mediumCount}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Guardrail Information / Recovery Eligibility */}
                  <div style={subCardStyle}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShieldCheck size={14} style={{ color: '#34d399' }} /> Recovery Eligibility
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      <div style={guardrailStatBoxStyle('rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.3)', '#34d399')}>
                        <span style={{ fontWeight: 700 }}>{result.eligibleCount} Eligible for Recovery</span>
                        <span style={{ fontSize: '0.65rem' }}>Ready for automated dunning</span>
                      </div>
                      <div style={guardrailStatBoxStyle('rgba(245, 158, 11, 0.1)', 'rgba(245, 158, 11, 0.3)', '#fbbf24')}>
                        <span style={{ fontWeight: 700 }}>{result.ptpActiveCount} Paused — Promise-to-Pay</span>
                        <span style={{ fontSize: '0.65rem' }}>Protected by commitment guardrail</span>
                      </div>
                      <div style={guardrailStatBoxStyle('var(--bg-secondary)', 'var(--border-color)', 'var(--text-secondary)')}>
                        <span style={{ fontWeight: 700 }}>{result.zeroBalanceCount} Skipped — Zero Balance / Cooldown</span>
                        <span style={{ fontSize: '0.65rem' }}>Exempt from recovery contact</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Matched Account Preview Table */}
                <div style={resultPanelCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-family-title)' }}>
                      Matched Account Preview ({result.matches?.length || 0} of {result.sizeCount || 0})
                    </h4>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      Real PostgreSQL Debtor Records
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr style={tableHeaderRowStyle}>
                          <th style={thStyle}>Customer / Business</th>
                          <th style={thStyle}>Risk</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Outstanding</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Overdue</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>Risk Score</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(result.matches || []).map((m, i) => {
                          const isCritical = m.riskLevel === 'Critical';
                          const isHigh = m.riskLevel === 'High';
                          
                          return (
                            <tr key={i} style={tableRowStyle}>
                              <td style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={avatarStyle}><User size={12} /></div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                                      {m.name}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                      {m.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={tdStyle}>
                                <span style={{
                                  fontSize: '0.62rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.15)' : isHigh ? 'rgba(249, 115, 22, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  color: isCritical ? '#f87171' : isHigh ? '#fb923c' : '#34d399',
                                  border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.3)' : isHigh ? 'rgba(249, 115, 22, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                }}>
                                  {m.riskLevel}
                                </span>
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                                {m.outstanding}
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, fontSize: '0.75rem', color: '#f87171' }}>
                                {m.overdue}
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', color: isCritical ? '#f87171' : isHigh ? '#fb923c' : 'var(--text-secondary)' }}>
                                {m.riskScore}
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'right' }}>
                                <span style={{
                                  fontSize: '0.62rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  backgroundColor: m.statusBadgeClass === 'eligible' ? 'rgba(16, 185, 129, 0.15)' : m.statusBadgeClass === 'ptp' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                                  color: m.statusBadgeClass === 'eligible' ? '#34d399' : m.statusBadgeClass === 'ptp' ? '#fbbf24' : 'var(--text-secondary)',
                                  border: `1px solid ${m.statusBadgeClass === 'eligible' ? 'rgba(16, 185, 129, 0.3)' : m.statusBadgeClass === 'ptp' ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}`
                                }}>
                                  {m.statusLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </motion.div>
            )}

            {!compiling && error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={emptyPanelStyle}
              >
                <AlertTriangle size={24} style={{ color: '#ef4444' }} />
                <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.9rem' }}>{error}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                  Please try one of the recommended recovery templates on the left.
                </div>
              </motion.div>
            )}

            {!compiling && !result && !error && (
              <div style={emptyPanelStyle}>
                <Brain size={28} style={{ color: '#94a3b8' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Recovery Audience Generator
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                  Enter a natural-language description on the left or click one of the suggested templates to detect at-risk accounts.
                </span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Layout styling variables matching Payzor AI CRM design system
const builderGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
  gap: '1.75rem'
};

const builderPanelCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '1.75rem',
  boxShadow: 'var(--shadow-card)'
};

const cardTitleStyle = {
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-family-title)',
  margin: 0
};

const textareaStyle = {
  width: '100%',
  minHeight: '120px',
  padding: '0.85rem 1rem',
  fontSize: '0.85rem',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-md)',
  outline: 'none',
  resize: 'none',
  fontFamily: 'inherit',
  lineHeight: 1.45,
  boxSizing: 'border-box',
  transition: 'border-color 0.2s'
};

const compileButtonStyle = {
  background: 'linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)',
  color: '#0A0A0B',
  border: '1px solid rgba(212, 175, 55, 0.4)',
  padding: '0.75rem 1.25rem',
  fontSize: '0.88rem',
  fontWeight: 700,
  borderRadius: 'var(--border-radius-sm)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  boxShadow: '0 4px 16px rgba(212, 175, 55, 0.2)',
  transition: 'all 0.2s ease'
};

const suggestionLabelStyle = {
  fontSize: '0.68rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-secondary)'
};

const suggestionItemStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  padding: '0.55rem 0.75rem',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const emptyPanelStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px dashed var(--border-color)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '5rem 2rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  textAlign: 'center'
};

const resultPanelCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-card)'
};

const subCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '1.15rem',
  boxShadow: 'var(--shadow-card)'
};

const primaryCampaignButtonStyle = {
  background: 'linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)',
  color: '#0A0A0B',
  border: 'none',
  padding: '0.45rem 0.85rem',
  fontSize: '0.75rem',
  fontWeight: 700,
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  boxShadow: '0 2px 10px rgba(212, 175, 55, 0.25)',
  transition: 'all 0.2s'
};

const refineButtonStyle = {
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  padding: '0.45rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  transition: 'all 0.2s'
};

const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '0.75rem',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '1rem'
};

const metricBoxStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem'
};

const metricLabelStyle = {
  fontSize: '0.62rem',
  color: 'var(--text-muted)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const metricValStyle = {
  fontSize: '1.15rem',
  fontWeight: 800,
  fontFamily: 'var(--font-family-title)',
  color: 'var(--gold-400)'
};

const ruleItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  backgroundColor: 'var(--bg-secondary)',
  padding: '0.35rem 0.6rem',
  borderRadius: '4px',
  border: '1px solid var(--border-color)'
};

const exposureRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.75rem',
  padding: '0.2rem 0',
  borderBottom: '1px dashed var(--border-color)'
};

const exposureLabelStyle = {
  color: 'var(--text-secondary)',
  fontWeight: 500
};

const guardrailStatBoxStyle = (bg, border, text) => ({
  backgroundColor: bg,
  border: `1px solid ${border}`,
  color: text,
  borderRadius: '6px',
  padding: '0.5rem 0.75rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1rem',
  fontSize: '0.75rem'
});

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left'
};

const tableHeaderRowStyle = {
  borderBottom: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-secondary)'
};

const thStyle = {
  padding: '0.5rem 0.65rem',
  fontSize: '0.65rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-secondary)'
};

const tableRowStyle = {
  borderBottom: '1px solid var(--border-color)'
};

const tdStyle = {
  padding: '0.55rem 0.65rem',
  verticalAlign: 'middle'
};

const avatarStyle = {
  width: '1.5rem',
  height: '1.5rem',
  borderRadius: '50%',
  backgroundColor: 'rgba(212, 175, 55, 0.15)',
  color: 'var(--gold-400)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};
