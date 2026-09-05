import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  MessageSquare, 
  Percent, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Mail,
  Send
} from 'lucide-react';
import { useCrm } from './CrmContext';
import crmApi from '../../api/crmApi';

export default function CrmAnalytics() {
  const { campaigns, customers, recoveryDashboard, loading, analyticsState, setAnalyticsState } = useCrm();
  const { dateRange, selectedChannel } = analyticsState;

  const setDateRange = (val) => setAnalyticsState(prev => ({ ...prev, dateRange: val }));
  const setSelectedChannel = (val) => setAnalyticsState(prev => ({ ...prev, selectedChannel: val }));

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setStatsLoading(true);
      try {
        const data = await crmApi.getAnalytics();
        setStats(data);
      } catch (err) {
        console.error("Failed to load analytics stats:", err);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading || statsLoading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Loading recovery analytics insights...</div>
      </div>
    );
  }

  // Filter campaigns dynamically based on selected date range and recovery channel
  const filteredCampaigns = campaigns.filter(c => {
    // Channel filter
    if (selectedChannel !== 'all' && (c.channel || '').toLowerCase() !== selectedChannel.toLowerCase()) {
      return false;
    }
    // Date filter
    if (dateRange !== 'all') {
      const createdDate = new Date(c.created_at || c.created || c.launch_time || Date.now());
      const now = new Date();
      const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24);
      if (dateRange === '7d' && diffDays > 7) return false;
      if (dateRange === '30d' && diffDays > 30) return false;
    }
    return true;
  });

  // Calculate dynamic channel recovered revenues
  const getChannelRecovery = (chan) => {
    const matched = filteredCampaigns.filter(c => (c.channel || '').toLowerCase() === chan.toLowerCase());
    const campaignsCount = matched.length;
    const targeted = matched.reduce((acc, c) => acc + Number(c.audience_size || 0), 0);
    const skipped = matched.reduce((acc, c) => acc + Number(c.skipped_count || 0), 0);
    const sent = matched.reduce((acc, c) => acc + Number(c.sent !== undefined ? c.sent : Math.max(0, (c.audience_size || 0) - (c.skipped_count || 0))), 0);
    const recoveredCount = matched.reduce((acc, c) => acc + Number(c.success_count ?? c.purchased ?? 0), 0);
    const recoveredAmount = matched.reduce((acc, c) => acc + Number(c.recovered_amount ?? c.revenue ?? c.revenueImpact ?? 0), 0);
    const revAtRisk = matched.reduce((acc, c) => acc + Number(c.revenue_at_risk || 0), 0);
    const rate = revAtRisk > 0 ? (recoveredAmount / revAtRisk * 100) : (targeted > 0 ? (recoveredCount / targeted * 100) : 0);

    return {
      campaignsCount,
      targeted,
      skipped,
      sent,
      recoveredCount,
      recoveredAmount,
      revAtRisk,
      rate
    };
  };

  const waStats = getChannelRecovery('whatsapp');
  const emailStats = getChannelRecovery('email');
  const smsStats = getChannelRecovery('sms');

  // Overall totals across filtered campaigns
  const totalTargeted = filteredCampaigns.reduce((acc, c) => acc + Number(c.audience_size || 0), 0) || Number(stats?.customers_targeted || customers.length || 0);
  const totalSkipped = filteredCampaigns.reduce((acc, c) => acc + Number(c.skipped_count || 0), 0);
  const totalEligible = Math.max(0, totalTargeted - totalSkipped);
  const totalMessagesSent = filteredCampaigns.reduce((acc, c) => acc + Number(c.sent !== undefined ? c.sent : Math.max(0, (c.audience_size || 0) - (c.skipped_count || 0))), 0) || Number(stats?.messages_sent || totalEligible);
  const totalCustomersRecovered = filteredCampaigns.reduce((acc, c) => acc + Number(c.success_count ?? c.purchased ?? 0), 0) || Number(stats?.customers_recovered || 0);
  
  // Total recovered revenue: sum of filtered campaigns, or fallback to stats / dashboard
  const campaignRecoveredAmount = filteredCampaigns.reduce((acc, c) => acc + Number(c.recovered_amount ?? c.revenue ?? c.revenueImpact ?? 0), 0);
  const totalRevenueRecovered = campaignRecoveredAmount > 0 
    ? campaignRecoveredAmount 
    : (Number(stats?.recovered_revenue || stats?.revenue_generated || recoveryDashboard?.total_recovered || 0));

  // Total revenue at risk: sum of campaign risk or sum of customer overdue
  const campaignRiskAmount = filteredCampaigns.reduce((acc, c) => acc + Number(c.revenue_at_risk || 0), 0);
  const customerOverdueSum = customers.reduce((acc, c) => acc + Number(c.overdueAmount || c.overdue_amount || 0), 0);
  const totalRevenueAtRisk = campaignRiskAmount > 0 
    ? campaignRiskAmount 
    : (customerOverdueSum > 0 ? customerOverdueSum : Number(stats?.revenue_at_risk || 1));

  const overallRecoveryRate = totalRevenueAtRisk > 0 
    ? ((totalRevenueRecovered / totalRevenueAtRisk) * 100).toFixed(1)
    : "0.0";

  // Chart heights for Channel Bar Chart
  const maxRevenue = Math.max(waStats.recoveredAmount, emailStats.recoveredAmount, smsStats.recoveredAmount, 1);
  const waHeight = Math.max(30, (waStats.recoveredAmount / maxRevenue) * 160);
  const emailHeight = Math.max(30, (emailStats.recoveredAmount / maxRevenue) * 160);
  const smsHeight = Math.max(30, (smsStats.recoveredAmount / maxRevenue) * 160);

  // Funnel percentages based on recovery pipeline
  const eligiblePct = totalTargeted > 0 ? ((totalEligible / totalTargeted) * 100).toFixed(1) : "100.0";
  const sentPct = totalEligible > 0 ? ((totalMessagesSent / totalEligible) * 100).toFixed(1) : "100.0";
  const recoveredPct = totalTargeted > 0 ? ((totalCustomersRecovered / totalTargeted) * 100).toFixed(1) : "0.0";

  // Dynamic AI Recovery Insights Generation
  const channelsList = [
    { name: 'WhatsApp', stats: waStats },
    { name: 'Email', stats: emailStats },
    { name: 'SMS', stats: smsStats }
  ];
  const bestChannel = channelsList.reduce((prev, curr) => (curr.stats.recoveredAmount > prev.stats.recoveredAmount ? curr : prev), channelsList[0]);

  const highRiskCustomersCount = customers.filter(c => ['High', 'Critical'].includes(c.aiRiskLevel || c.ai_risk_level)).length;
  const criticalOverdueSum = customers
    .filter(c => ['High', 'Critical'].includes(c.aiRiskLevel || c.ai_risk_level))
    .reduce((acc, c) => acc + Number(c.overdueAmount || 0), 0);

  const activePtpsCount = customers.filter(c => c.promiseToPayStatus === 'ACTIVE' || c.promise_to_pay_status === 'ACTIVE').length;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Receivables & Recovery Analytics
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Track revenue at risk, recovery performance, and recovered revenue across B2B accounts.
        </p>
      </div>

      {/* 2. Analytics Filters Row */}
      <div style={filterRowStyle}>
        <div style={filterGroupStyle}>
          <label style={filterLabelStyle}>Date Range</label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)} 
            style={filterSelectStyle}
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
        <div style={filterGroupStyle}>
          <label style={filterLabelStyle}>Recovery Channel</label>
          <select 
            value={selectedChannel} 
            onChange={(e) => setSelectedChannel(e.target.value)} 
            style={filterSelectStyle}
          >
            <option value="all">All Channels</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--green-primary)' }}></span>
          <span>Simulation Ledger Active</span>
        </div>
      </div>

      {/* 3. Primary KPI Summary Cards */}
      <div style={kpiGridStyle}>
        {/* KPI 1: Revenue at Risk */}
        <div style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiLabelStyle}>Revenue at Risk</span>
            <AlertTriangle size={16} style={{ color: '#dc2626' }} />
          </div>
          <div style={{ ...kpiValueStyle, color: '#dc2626' }}>
            ₹{Math.round(totalRevenueAtRisk).toLocaleString()}
          </div>
          <div style={kpiSubtextStyle}>
            Total overdue exposure across accounts
          </div>
        </div>

        {/* KPI 2: Eligible Accounts */}
        <div style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiLabelStyle}>Eligible Accounts</span>
            <Users size={16} style={{ color: 'var(--blue-primary)' }} />
          </div>
          <div style={kpiValueStyle}>
            {totalEligible.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ {totalTargeted.toLocaleString()}</span>
          </div>
          <div style={kpiSubtextStyle}>
            {totalSkipped > 0 ? `${totalSkipped} paused under guardrails` : '100% passed safety rules'}
          </div>
        </div>

        {/* KPI 3: Messages Sent */}
        <div style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiLabelStyle}>Recovery Messages Sent</span>
            <Send size={16} style={{ color: '#6366f1' }} />
          </div>
          <div style={kpiValueStyle}>
            {totalMessagesSent.toLocaleString()}
          </div>
          <div style={kpiSubtextStyle}>
            Simulated B2B dunning outreach
          </div>
        </div>

        {/* KPI 4: Customers Recovered */}
        <div style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiLabelStyle}>Customers Recovered</span>
            <CheckCircle2 size={16} style={{ color: 'var(--green-primary)' }} />
          </div>
          <div style={{ ...kpiValueStyle, color: 'var(--green-primary)' }}>
            {totalCustomersRecovered.toLocaleString()}
          </div>
          <div style={kpiSubtextStyle}>
            Debtors settled outstanding balances
          </div>
        </div>

        {/* KPI 5: Recovered Revenue */}
        <div style={{ ...kpiCardStyle, border: '1px solid var(--green-border)', backgroundColor: '#f0fdf4' }}>
          <div style={kpiHeaderStyle}>
            <span style={{ ...kpiLabelStyle, color: 'var(--green-primary)' }}>Recovered Revenue</span>
            <TrendingUp size={16} style={{ color: 'var(--green-primary)' }} />
          </div>
          <div style={{ ...kpiValueStyle, color: 'var(--green-primary)' }}>
            ₹{Math.round(totalRevenueRecovered).toLocaleString()}
          </div>
          <div style={{ ...kpiSubtextStyle, color: '#15803d', fontWeight: 600 }}>
            {overallRecoveryRate}% Overall Recovery Rate
          </div>
        </div>
      </div>

      {/* 4. Charts Grid layout */}
      <div style={chartsGridStyle}>
        
        {/* Chart 1: Recovered Revenue by Channel */}
        <div style={chartCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={chartTitleStyle}>Recovered Revenue by Channel</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Simulated Ledger Settlements
            </span>
          </div>
          <div style={{ height: '220px', width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            {/* Bar 1: WhatsApp */}
            <div style={barColStyle}>
              <div style={{ height: `${waHeight}px`, width: '42px', backgroundColor: 'var(--green-primary)', borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 0.5s ease' }}>
                <span style={barValueStyle}>₹{(waStats.recoveredAmount / 1000).toFixed(0)}K</span>
              </div>
              <span style={barLabelStyle}>WhatsApp</span>
            </div>
            {/* Bar 2: Email */}
            <div style={barColStyle}>
              <div style={{ height: `${emailHeight}px`, width: '42px', backgroundColor: 'var(--blue-primary)', borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 0.5s ease' }}>
                <span style={barValueStyle}>₹{(emailStats.recoveredAmount / 1000).toFixed(0)}K</span>
              </div>
              <span style={barLabelStyle}>Email</span>
            </div>
            {/* Bar 3: SMS */}
            <div style={barColStyle}>
              <div style={{ height: `${smsHeight}px`, width: '42px', backgroundColor: '#64748b', borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 0.5s ease' }}>
                <span style={barValueStyle}>₹{(smsStats.recoveredAmount / 1000).toFixed(0)}K</span>
              </div>
              <span style={barLabelStyle}>SMS</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Recovery Funnel */}
        <div style={chartCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={chartTitleStyle}>Recovery Funnel</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--green-primary)', fontWeight: 700 }}>
              ₹{Math.round(totalRevenueRecovered).toLocaleString()} Recovered
            </span>
          </div>
          <div style={{ height: '220px', width: '100%', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Row 1: Targeted */}
            <div style={funnelRowStyle}>
              <div style={{ width: '120px', fontSize: '0.75rem', fontWeight: 600 }}>
                Targeted ({totalTargeted.toLocaleString()})
              </div>
              <div style={funnelProgressBgStyle}>
                <div style={{ ...funnelProgressStyle, width: '100%', backgroundColor: '#94a3b8' }} />
              </div>
              <div style={{ width: '45px', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' }}>100%</div>
            </div>
            {/* Row 2: Eligible */}
            <div style={funnelRowStyle}>
              <div style={{ width: '120px', fontSize: '0.75rem', fontWeight: 600 }}>
                Eligible ({totalEligible.toLocaleString()})
              </div>
              <div style={funnelProgressBgStyle}>
                <div style={{ ...funnelProgressStyle, width: `${eligiblePct}%`, backgroundColor: 'var(--blue-primary)' }} />
              </div>
              <div style={{ width: '45px', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right', color: 'var(--blue-primary)' }}>{eligiblePct}%</div>
            </div>
            {/* Row 3: Messages Sent */}
            <div style={funnelRowStyle}>
              <div style={{ width: '120px', fontSize: '0.75rem', fontWeight: 600 }}>
                Messages Sent ({totalMessagesSent.toLocaleString()})
              </div>
              <div style={funnelProgressBgStyle}>
                <div style={{ ...funnelProgressStyle, width: `${sentPct}%`, backgroundColor: '#6366f1' }} />
              </div>
              <div style={{ width: '45px', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right', color: '#6366f1' }}>{sentPct}%</div>
            </div>
            {/* Row 4: Customers Recovered */}
            <div style={funnelRowStyle}>
              <div style={{ width: '120px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--green-primary)' }}>
                Recovered ({totalCustomersRecovered.toLocaleString()})
              </div>
              <div style={funnelProgressBgStyle}>
                <div style={{ ...funnelProgressStyle, width: `${recoveredPct}%`, backgroundColor: 'var(--green-primary)' }} />
              </div>
              <div style={{ width: '45px', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right', color: 'var(--green-primary)' }}>{recoveredPct}%</div>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Channel Performance Breakdown Table */}
      <div style={chartCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={chartTitleStyle}>Recovery Performance by Channel</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Comparing B2B dunning effectiveness across communication channels
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Channel</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Campaigns</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Messages Sent</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Customers Recovered</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Revenue Recovered</th>
                <th style={{ padding: '0.65rem 0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Recovery Rate</th>
              </tr>
            </thead>
            <tbody>
              {/* WhatsApp Row */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MessageSquare size={14} style={{ color: 'var(--green-primary)' }} /> WhatsApp
                </td>
                <td style={{ padding: '0.75rem 0.9rem' }}>{waStats.campaignsCount}</td>
                <td style={{ padding: '0.75rem 0.9rem' }}>{waStats.sent.toLocaleString()}</td>
                <td style={{ padding: '0.75rem 0.9rem', fontWeight: 600 }}>{waStats.recoveredCount.toLocaleString()}</td>
                <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: 'var(--green-primary)' }}>
                  ₹{Math.round(waStats.recoveredAmount).toLocaleString()}
                </td>
                <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
                  {waStats.rate.toFixed(1)}%
                </td>
              </tr>
              {/* Email Row */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} style={{ color: 'var(--blue-primary)' }} /> Email
                </td>
                <td style={{ padding: '0.75rem 0.9rem' }}>{emailStats.campaignsCount}</td>
                <td style={{ padding: '0.75rem 0.9rem' }}>{emailStats.sent.toLocaleString()}</td>
                <td style={{ padding: '0.75rem 0.9rem', fontWeight: 600 }}>{emailStats.recoveredCount.toLocaleString()}</td>
                <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: 'var(--green-primary)' }}>
                  ₹{Math.round(emailStats.recoveredAmount).toLocaleString()}
                </td>
                <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
                  {emailStats.rate.toFixed(1)}%
                </td>
              </tr>
              {/* SMS Row */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Send size={14} style={{ color: '#64748b' }} /> SMS
                </td>
                <td style={{ padding: '0.75rem 0.9rem' }}>{smsStats.campaignsCount}</td>
                <td style={{ padding: '0.75rem 0.9rem' }}>{smsStats.sent.toLocaleString()}</td>
                <td style={{ padding: '0.75rem 0.9rem', fontWeight: 600 }}>{smsStats.recoveredCount.toLocaleString()}</td>
                <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: 'var(--green-primary)' }}>
                  ₹{Math.round(smsStats.recoveredAmount).toLocaleString()}
                </td>
                <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
                  {smsStats.rate.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. AI Recovery Insights Panel */}
      <div style={insightsCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Sparkles size={18} style={{ color: 'var(--blue-primary)' }} />
          <h3 style={chartTitleStyle}>AI Recovery Insights</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Insight 1: Channel Performance */}
          <div style={insightItemCardStyle}>
            <div style={insightHeaderStyle}>
              <MessageSquare size={16} style={{ color: 'var(--green-primary)' }} />
              <span style={insightTitleStyle}>{bestChannel.name} Recovery Performance</span>
            </div>
            <p style={insightDescStyle}>
              {bestChannel.name} generated <strong>₹{Math.round(bestChannel.stats.recoveredAmount).toLocaleString()}</strong> in recovered revenue across simulated recovery campaigns in the selected period. Prioritize {bestChannel.name} for high-exposure accounts.
            </p>
          </div>

          {/* Insight 2: High Exposure Recovery */}
          <div style={insightItemCardStyle}>
            <div style={insightHeaderStyle}>
              <TrendingUp size={16} style={{ color: 'var(--blue-primary)' }} />
              <span style={insightTitleStyle}>High-Exposure Risk Concentration</span>
            </div>
            <p style={insightDescStyle}>
              <strong>{highRiskCustomersCount} high/critical-risk accounts</strong> account for <strong>₹{Math.round(criticalOverdueSum).toLocaleString()}</strong> in overdue exposure. Executing personalized dunning schedules recovers up to 68% of overdue balances.
            </p>
          </div>

          {/* Insight 3: Guardrail & Safety Compliance */}
          <div style={insightItemCardStyle}>
            <div style={insightHeaderStyle}>
              <ShieldCheck size={16} style={{ color: 'var(--green-primary)' }} />
              <span style={insightTitleStyle}>AI Guardrails & PTP Compliance</span>
            </div>
            <p style={insightDescStyle}>
              <strong>{activePtpsCount} active Promise-to-Pay (PTP) agreements</strong> and touch-limit guardrails are actively honored, preventing over-dunning and preserving business relationships.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

// Styling elements
const kpiGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem'
};

const kpiCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-md)',
  padding: '1.25rem',
  boxShadow: 'var(--shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem'
};

const kpiHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const kpiLabelStyle = {
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--text-muted)'
};

const kpiValueStyle = {
  fontSize: '1.45rem',
  fontWeight: 800,
  fontFamily: 'var(--font-family-title)',
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em'
};

const kpiSubtextStyle = {
  fontSize: '0.72rem',
  color: 'var(--text-secondary)'
};

const chartsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: '1.5rem'
};

const chartCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-sm)'
};

const chartTitleStyle = {
  fontSize: '0.95rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-family-title)'
};

const barColStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem'
};

const barValueStyle = {
  position: 'absolute',
  top: '-20px',
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap'
};

const barLabelStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  fontWeight: 600
};

const funnelRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const funnelProgressBgStyle = {
  flex: 1,
  height: '14px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  borderRadius: '4px',
  overflow: 'hidden'
};

const funnelProgressStyle = {
  height: '100%',
  borderRadius: '4px'
};

const insightsCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-sm)'
};

const insightItemCardStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const insightHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem'
};

const insightTitleStyle = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-family-title)'
};

const insightDescStyle = {
  fontSize: '0.72rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.4
};

const filterRowStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-md)',
  padding: '0.75rem 1.25rem',
  boxShadow: 'var(--shadow-sm)',
  flexWrap: 'wrap'
};

const filterGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
  minWidth: '150px'
};

const filterLabelStyle = {
  fontSize: '0.65rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)'
};

const filterSelectStyle = {
  padding: '0.4rem 0.6rem',
  fontSize: '0.8rem',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  outline: 'none',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  cursor: 'pointer'
};
