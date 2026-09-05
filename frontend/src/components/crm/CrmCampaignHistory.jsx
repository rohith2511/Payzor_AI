import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mail, Send, BarChart3, X, Calendar, TrendingUp, Activity, CheckCircle, ShieldCheck, DollarSign, Users, Eye } from 'lucide-react';

import { useCrm } from './CrmContext';
import crmApi from '../../api/crmApi';

export default function CrmCampaignHistory() {
  const { campaigns, loading, cancelCampaign } = useCrm();
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };
  const [performanceData, setPerformanceData] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [secondsTick, setSecondsTick] = useState(0);

  // Tick every second so running campaign badge animates
  useEffect(() => {
    const t = setInterval(() => setSecondsTick(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const runningCampaigns = campaigns.filter(c => c.status === 'Running');

  const handleSelectCampaign = async (c) => {
    const isWhatsApp = (c.channel || '').toLowerCase() === 'whatsapp';
    const isEmail = (c.channel || '').toLowerCase() === 'email';
    const badgeBg = isWhatsApp ? 'var(--green-light)' : (isEmail ? 'var(--blue-light)' : '#f1f5f9');
    const badgeColor = isWhatsApp ? 'var(--green-primary)' : (isEmail ? 'var(--blue-primary)' : 'var(--text-secondary)');
    const icon = isWhatsApp ? <MessageSquare size={14} /> : (isEmail ? <Mail size={14} /> : <Send size={14} />);
    const status = c.status || 'Completed';

    setSelectedCampaign({ ...c, badgeBg, badgeColor, icon, status });
    setPerfLoading(true);
    setPerformanceData([]);
    setFilterType('All');
    try {
      const res = await crmApi.getCampaignPerformance(c.id);
      setPerformanceData(res.performance || []);
    } catch (err) {
      console.error("Failed to fetch recovery campaign performance:", err);
    } finally {
      setPerfLoading(false);
    }
  };

  const filteredPerfData = performanceData.filter(p => {
    if (filterType === 'All') return true;
    if (filterType === 'Recovered') return p.purchased || (p.recovered_amount && p.recovered_amount > 0) || (p.status || '').toLowerCase().includes('recover');
    if (filterType === 'Sent') return p.sent;
    if (filterType === 'Skipped') return p.failed || (p.status || '').toLowerCase().includes('skip') || p.stopping_reason;
    if (filterType === 'Failed') return p.failed;
    return true;
  });

  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Loading recovery campaign records...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', position: 'relative', minHeight: '85vh' }}>
      
      {/* 1. Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Recovery Campaign History
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Historical recovery campaigns, simulated outreach, and recovered revenue.
        </p>
      </div>

      {/* 2. Running Campaign Banner */}
      {runningCampaigns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: 'var(--border-radius-sm)',
            padding: '0.75rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.82rem',
            color: '#92400e'
          }}
        >
          <Activity size={16} style={{ color: '#f59e0b', flexShrink: 0 }} className="animate-pulse" />
          <span>
            <strong>{runningCampaigns.length} recovery campaign{runningCampaigns.length > 1 ? 's' : ''} running</strong>
            {' '}— Dunning outreach and debtor settlement metrics update in real-time. Simulated debtor payments settle within
            <strong> 5–10 seconds</strong> after execution.
          </span>
        </motion.div>
      )}

      {/* 3. Empty State or Campaigns Table */}
      {campaigns.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(212, 175, 55, 0.15)',
            color: 'var(--gold-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <ShieldCheck size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No recovery campaigns yet.
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
            Launch a recovery campaign from Campaign Studio to track simulated outreach and recovered revenue.
          </p>
        </div>
      ) : (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeaderStyle}>Recovery Campaign</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Channel</th>
                <th style={tableHeaderStyle}>Customers Targeted</th>
                <th style={tableHeaderStyle}>Messages Sent</th>
                <th style={tableHeaderStyle}>Customers Recovered</th>
                <th style={tableHeaderStyle}>Amount Recovered</th>
                <th style={tableHeaderStyle}>Recovery Rate</th>
                <th style={tableHeaderStyle}>Execution Time</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, idx) => {
                const isWhatsApp = (c.channel || '').toLowerCase() === 'whatsapp';
                const isEmail = (c.channel || '').toLowerCase() === 'email';
                
                const badgeBg = isWhatsApp ? 'var(--green-light)' : (isEmail ? 'var(--blue-light)' : '#f1f5f9');
                const badgeColor = isWhatsApp ? 'var(--green-primary)' : (isEmail ? 'var(--blue-primary)' : 'var(--text-secondary)');
                const icon = isWhatsApp ? <MessageSquare size={13} /> : (isEmail ? <Mail size={13} /> : <Send size={13} />);
                const status = c.status || 'Completed';
                
                const isCancelled = status === 'Cancelled';
                const executionTime = (c.launch_time && !isCancelled)
                  ? new Date(c.launch_time).toLocaleString() 
                  : ((c.scheduled_time && !isCancelled) 
                      ? new Date(c.scheduled_time).toLocaleString() 
                      : (c.created_at && !isCancelled ? new Date(c.created_at).toLocaleString() : '-'));
                
                const targeted = c.audience_size || 0;
                const skipped = c.skipped_count || 0;
                const sentMessages = c.sent !== undefined ? c.sent : Math.max(0, targeted - skipped);
                const recoveredCustomers = c.success_count !== undefined ? c.success_count : (c.purchased || 0);
                const recoveredAmt = Number(c.recovered_amount !== undefined ? c.recovered_amount : (c.revenue || c.revenueImpact || 0));
                const revAtRisk = Number(c.revenue_at_risk || 0);

                const recoveryRate = revAtRisk > 0
                  ? ((recoveredAmt / revAtRisk) * 100).toFixed(1) + "%"
                  : (targeted > 0 ? (((recoveredCustomers) / targeted) * 100).toFixed(1) + "%" : "0.0%");
                
                return (
                  <tr 
                    key={c.id || idx} 
                    onClick={() => handleSelectCampaign(c)}
                    style={tableRowStyle}
                    className="campaign-row"
                  >
                    <td style={{ ...tableCellStyle, fontWeight: 700 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                            {c.campaignName || c.campaign_name || 'Recovery Campaign'}
                          </span>
                        </div>
                        {c.objective && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {c.objective}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={statusBadgeStyle(status)}>
                        {status === 'Running' && (
                          <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            backgroundColor: '#f59e0b', display: 'inline-block',
                            animation: 'pulse 1.2s ease-in-out infinite'
                          }} />
                        )}
                        {status}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={channelBadgeStyle(badgeBg, badgeColor)}>
                        {icon} {(c.channel || 'WhatsApp')}
                      </span>
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: 600 }}>{targeted.toLocaleString()}</td>
                    <td style={tableCellStyle}>{sentMessages.toLocaleString()}</td>
                    <td style={{ ...tableCellStyle, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {recoveredCustomers.toLocaleString()}
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: 700, color: 'var(--green-primary)' }}>
                      ₹{recoveredAmt.toLocaleString()}
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: 700, color: 'var(--blue-primary)' }}>
                      {recoveryRate}
                    </td>
                    <td style={{ ...tableCellStyle, color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {executionTime}
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCampaign(c);
                          }}
                          style={viewActionButtonStyle}
                          title="View Recovery Details"
                        >
                          <Eye size={13} /> View
                        </button>
                        {status === 'Scheduled' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const res = await cancelCampaign(c.id);
                              if (res.success) {
                                showToast("Recovery campaign schedule cancelled.", "success");
                              } else {
                                showToast(res.error || "Failed to cancel campaign.", "error");
                              }
                            }}
                            style={cancelActionButtonStyle}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Detailed Recovery Campaign Analytics Drawer */}
      <AnimatePresence>
        {selectedCampaign && (
          <>
            {/* Drawer Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCampaign(null)}
              style={backdropStyle}
            />
            {/* Slide-out Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35, cubicBezier: [0.16, 1, 0.3, 1] }}
              style={drawerStyle}
              className="glass-panel"
            >
              {/* Drawer Header */}
              <div style={drawerHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--blue-primary)' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--text-primary)' }}>
                    Recovery Campaign Details
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedCampaign(null)}
                  style={closeButtonStyle}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div style={drawerContentStyle}>
                
                {/* Basic info profile card */}
                <div style={campaignProfileCardStyle}>
                  <span style={channelBadgeStyle(selectedCampaign.badgeBg, selectedCampaign.badgeColor)}>
                    {selectedCampaign.icon} {selectedCampaign.channel ? selectedCampaign.channel.toUpperCase() : 'WHATSAPP'} (SIMULATION)
                  </span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem', textAlign: 'center', color: 'var(--text-primary)' }}>
                    {selectedCampaign.campaignName || selectedCampaign.campaign_name || 'Recovery Campaign'}
                  </h4>
                  
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    <Users size={12} /> <strong>Cohort:</strong> {selectedCampaign.audience || selectedCampaign.target_segment || 'High Overdue Debtor Cohort'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.2rem', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                    <Calendar size={12} /> <strong>Executed:</strong> {selectedCampaign.status !== 'Cancelled' && (selectedCampaign.launch_time || selectedCampaign.created_at) ? new Date(selectedCampaign.launch_time || selectedCampaign.created_at).toLocaleString() : '-'}
                  </div>
                  {selectedCampaign.batch_id && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--blue-primary)', backgroundColor: '#eff6ff', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid var(--blue-border)' }}>
                      Batch: {selectedCampaign.batch_id}
                    </div>
                  )}
                </div>

                {/* Recovery Outreach Breakdown */}
                <div style={drawerCardStyle}>
                  <h5 style={drawerCardTitleStyle}>
                    <BarChart3 size={14} style={{ color: 'var(--blue-primary)' }} /> 
                    Recovery Outreach Breakdown
                  </h5>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.9rem' }}>
                    <div style={funnelRowStyle}>
                      <span style={funnelLabelStyle}>Customers Targeted</span>
                      <strong style={funnelValStyle}>{(selectedCampaign.audience_size || 0).toLocaleString()}</strong>
                    </div>
                    <div style={funnelRowStyle}>
                      <span style={funnelLabelStyle}>Recovery Messages Sent</span>
                      <strong style={funnelValStyle}>
                        {(selectedCampaign.sent !== undefined ? selectedCampaign.sent : Math.max(0, (selectedCampaign.audience_size || 0) - (selectedCampaign.skipped_count || 0))).toLocaleString()}
                      </strong>
                    </div>
                    {(selectedCampaign.skipped_count || 0) > 0 && (
                      <div style={funnelRowStyle}>
                        <span style={{ ...funnelLabelStyle, color: '#d97706' }}>Guardrails Skipped (Safety Rules)</span>
                        <strong style={{ ...funnelValStyle, color: '#d97706' }}>
                          {selectedCampaign.skipped_count.toLocaleString()} (PTP Active / Cooldown / Zero Balance)
                        </strong>
                      </div>
                    )}
                    <div style={funnelRowStyle}>
                      <span style={{ ...funnelLabelStyle, color: 'var(--green-primary)', fontWeight: 600 }}>Customers Recovered</span>
                      <strong style={{ ...funnelValStyle, color: 'var(--green-primary)' }}>
                        {(selectedCampaign.success_count ?? selectedCampaign.purchased ?? 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Financial Recovery Impact Card */}
                <div style={drawerCardStyle}>
                  <h5 style={drawerCardTitleStyle}>
                    <TrendingUp size={14} style={{ color: 'var(--green-primary)' }} /> 
                    Financial Recovery Impact
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Amount Recovered (Settled)
                      </span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--green-primary)', fontWeight: 800 }}>
                        ₹{(Number(selectedCampaign.recovered_amount || selectedCampaign.revenue || selectedCampaign.revenueImpact || 0)).toLocaleString()}
                      </strong>
                    </div>
                    
                    {Number(selectedCampaign.revenue_at_risk || 0) > 0 && (
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Campaign Revenue at Risk</span>
                        <strong style={{ color: '#dc2626' }}>₹{Number(selectedCampaign.revenue_at_risk).toLocaleString()}</strong>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Recovery Rate</span>
                      <strong style={{ color: 'var(--blue-primary)', fontWeight: 700 }}>
                        {Number(selectedCampaign.revenue_at_risk || 0) > 0 
                          ? ((Number(selectedCampaign.recovered_amount || selectedCampaign.revenue || 0) / Number(selectedCampaign.revenue_at_risk)) * 100).toFixed(1) + "%"
                          : ((selectedCampaign.audience_size > 0 ? (((selectedCampaign.success_count ?? selectedCampaign.purchased ?? 0) / selectedCampaign.audience_size) * 100).toFixed(1) : "0.0") + "%")}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Debtor Execution Log */}
                <div style={drawerCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <h5 style={{ ...drawerCardTitleStyle, borderBottom: 'none', paddingBottom: 0, margin: 0 }}>
                      <Users size={14} style={{ color: 'var(--blue-primary)' }} /> Debtor Execution Log
                    </h5>
                    <select 
                      value={filterType} 
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    >
                      <option value="All">All Debtors</option>
                      <option value="Recovered">Settled / Recovered</option>
                      <option value="Sent">Outreach Sent</option>
                      <option value="Skipped">Skipped Guardrails</option>
                    </select>
                  </div>
                  
                  {perfLoading ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem' }}>
                      Loading recovery audit logs...
                    </div>
                  ) : filteredPerfData.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem' }}>
                      No debtor records match filter.
                    </div>
                  ) : (
                    <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                            <th style={{ padding: '0.45rem 0.6rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Debtor</th>
                            <th style={{ padding: '0.45rem 0.6rem', fontWeight: 600, textAlign: 'right', color: 'var(--text-secondary)' }}>Outcome</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPerfData.map((p, pIdx) => {
                            const isRecovered = p.purchased || (p.recovered_amount && p.recovered_amount > 0) || (p.status || '').toLowerCase().includes('recover');
                            const isSkipped = p.failed || (p.status || '').toLowerCase().includes('skip') || p.stopping_reason;
                            
                            return (
                              <tr key={pIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '0.45rem 0.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  <div>{p.customer_name}</div>
                                  {p.stopping_reason && (
                                    <div style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 500 }}>
                                      Guardrail: {p.stopping_reason}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  {isRecovered ? (
                                    <span style={{ 
                                      color: 'var(--green-primary)', 
                                      backgroundColor: 'var(--green-light)', 
                                      padding: '0.15rem 0.45rem', 
                                      borderRadius: '4px', 
                                      fontWeight: 700,
                                      border: '1px solid var(--green-border)',
                                      fontSize: '0.68rem'
                                    }}>
                                      ✓ Settled {p.recovered_amount ? `(₹${Number(p.recovered_amount).toLocaleString()})` : ''}
                                    </span>
                                  ) : isSkipped ? (
                                    <span style={{ 
                                      color: '#b45309', 
                                      backgroundColor: '#fffbeb', 
                                      padding: '0.15rem 0.45rem', 
                                      borderRadius: '4px', 
                                      fontWeight: 600,
                                      border: '1px solid #fde68a',
                                      fontSize: '0.68rem'
                                    }}>
                                      Skipped
                                    </span>
                                  ) : (
                                    <span style={{ 
                                      color: 'var(--blue-primary)', 
                                      backgroundColor: 'var(--blue-light)', 
                                      padding: '0.15rem 0.45rem', 
                                      borderRadius: '4px', 
                                      fontWeight: 600,
                                      border: '1px solid var(--blue-border)',
                                      fontSize: '0.68rem'
                                    }}>
                                      Outreach Sent
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              backgroundColor: 'var(--bg-card)',
              border: `1px solid ${toast.type === 'success' ? 'var(--green-border)' : 'rgba(239, 68, 68, 0.4)'}`,
              borderRadius: 'var(--border-radius-md)',
              padding: '0.75rem 1.25rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              zIndex: 9999,
              color: toast.type === 'success' ? '#34d399' : '#f87171'
            }}
            className="glass-panel"
          >
            <CheckCircle size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .campaign-row {
          transition: background-color 0.2s;
        }
        .campaign-row:hover {
          background-color: var(--bg-secondary) !important;
          cursor: pointer;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Styling coordinates
const tableContainerStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-md)',
  boxShadow: 'var(--shadow-card)',
  overflowX: 'auto'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '0.8rem'
};

const tableHeaderRowStyle = {
  borderBottom: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-secondary)'
};

const tableHeaderStyle = {
  padding: '0.8rem 1.1rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap'
};

const tableRowStyle = {
  borderBottom: '1px solid var(--border-color)'
};

const tableCellStyle = {
  padding: '0.9rem 1.1rem',
  color: 'var(--text-primary)',
  verticalAlign: 'middle'
};

const viewActionButtonStyle = {
  background: 'linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)',
  color: '#0A0A0B',
  border: 'none',
  padding: '0.35rem 0.65rem',
  borderRadius: '4px',
  fontSize: '0.72rem',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)',
  transition: 'all 0.2s'
};

const cancelActionButtonStyle = {
  backgroundColor: '#ef4444',
  color: '#ffffff',
  border: 'none',
  padding: '0.35rem 0.65rem',
  borderRadius: '4px',
  fontSize: '0.72rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  whiteSpace: 'nowrap'
};

const channelBadgeStyle = (bg, color) => ({
  fontSize: '0.7rem',
  fontWeight: 700,
  padding: '0.2rem 0.45rem',
  borderRadius: '4px',
  backgroundColor: bg,
  color: color,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  border: `1px solid ${color}30`
});

const statusBadgeStyle = (status) => {
  const map = {
    Running:   { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' },
    Scheduled: { bg: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-300)', border: 'rgba(212, 175, 55, 0.4)' },
    Completed: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.4)' },
    Failed:    { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.4)' },
    Cancelled: { bg: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', border: 'rgba(255, 255, 255, 0.15)' },
    Draft:     { bg: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-300)', border: 'rgba(212, 175, 55, 0.25)' },
  };
  const t = map[status] || map.Completed;
  return {
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    backgroundColor: t.bg,
    color: t.color,
    border: `1px solid ${t.border}`,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.2rem',
  };
};

// Drawer style coordinates (synchronized with Customers Explorer)
const backdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000
};

const drawerStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  maxWidth: '420px',
  backgroundColor: '#121318',
  borderLeft: '1px solid var(--border-color)',
  boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
  zIndex: 1001,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box'
};

const drawerHeaderStyle = {
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '0.2rem'
};

const drawerContentStyle = {
  padding: '1.5rem',
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem'
};

const campaignProfileCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-md)',
  padding: '1.25rem'
};

const drawerCardStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-md)',
  padding: '1.1rem',
  boxShadow: 'var(--shadow-card)'
};

const drawerCardTitleStyle = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.5rem',
  fontFamily: 'var(--font-family-title)'
};

const funnelRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.78rem',
  padding: '0.2rem 0'
};

const funnelLabelStyle = {
  color: 'var(--text-secondary)',
  fontWeight: 500
};

const funnelValStyle = {
  color: 'var(--text-primary)',
  fontWeight: 700
};

