import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Activity, AlertTriangle, ShieldCheck, CheckCircle, 
  XCircle, Clock, Send, BarChart3, Settings, ShieldAlert, 
  ChevronRight, RefreshCw, AlertCircle, Play, FileText, ExternalLink,
  Lock, ArrowUpRight, HelpCircle, Sparkles, CheckSquare, Square,
  Calendar, PauseCircle, PlayCircle, ArrowRight, Layers, UserCheck, X
} from 'lucide-react';
import { useCrm } from './CrmContext';

export default function CrmRevenueRecovery() {
  const {
    customers,
    recoveryDashboard,
    recoveryQueue,
    recoveryAudits,
    recoveryLoading,
    refreshRecoveryData,
    refreshAllData,
    approveRecoveryAction,
    approveRecoveryBatch,
    registerPromiseToPay,
    cancelPromiseToPay,
    simulatePaymentSuccess
  } = useCrm();

  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [actionProcessingId, setActionProcessingId] = useState(null);
  const [forceFailStates, setForceFailStates] = useState({});
  const [activeMessagePreviewId, setActiveMessagePreviewId] = useState(null);

  const handleManualRefresh = async () => {
    if (refreshAllData) {
      await refreshAllData();
    } else {
      await refreshRecoveryData();
    }
    showToast("Payzor Revenue Engine & ledgers synchronized in real-time.", "success");
  };

  // Batch Selection State
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [showBatchReviewModal, setShowBatchReviewModal] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Promise-to-Pay (PTP) State
  const [ptpModalCustomer, setPtpModalCustomer] = useState(null);
  const [ptpAmount, setPtpAmount] = useState('');
  const [ptpDate, setPtpDate] = useState('');
  const [ptpNotes, setPtpNotes] = useState('');
  const [ptpProcessing, setPtpProcessing] = useState(false);

  // Before vs After State Mutation Proof Modal
  const [stateProofData, setStateProofData] = useState(null);

  // Settings state (stored in local storage)
  const [safetyConfig, setSafetyConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_recovery_safety_config');
      return saved ? JSON.parse(saved) : {
        maxRemindersWeekly: 3,
        cooldownHours: 24,
        approvalThreshold: 50000,
        enableAutoReminders: false
      };
    } catch {
      return {
        maxRemindersWeekly: 3,
        cooldownHours: 24,
        approvalThreshold: 50000,
        enableAutoReminders: false
      };
    }
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    refreshRecoveryData();
  }, []);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('crm_recovery_safety_config', JSON.stringify(safetyConfig));
    showToast('Safety rules and configurations updated successfully.');
  };

  // Single Action Approval
  const handleApproveAction = async (customerId, actionType, forceFail = false) => {
    setActionProcessingId(customerId);
    const res = await approveRecoveryAction(customerId, actionType, forceFail);
    setActionProcessingId(null);
    if (res.success) {
      if (res.data.payment_link) {
        showToast(
          <span>
            Action approved! Link generated.{' '}
            <a href={res.data.payment_link} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'inherit', fontWeight: 700 }}>
              Open Payment Link <ExternalLink size={12} style={{ display: 'inline', marginLeft: 2 }} />
            </a>
          </span>,
          'success'
        );
      } else {
        showToast(`Recovery action successfully executed: ${actionType}`, 'success');
      }
    } else {
      showToast(res.error || 'Recovery action failed.', 'error');
    }
  };

  // Simulate Customer Payment
  const handleSimulatePayment = async (customerId, amount, customerName) => {
    setActionProcessingId(customerId + '-pay');
    const res = await simulatePaymentSuccess(customerId, amount);
    setActionProcessingId(null);
    if (res.success) {
      showToast(`Simulated Payment Success! ₹${Number(amount).toLocaleString()} recovered.`, 'success');
      if (res.data && res.data.before_state && res.data.after_state) {
        setStateProofData({
          customerName: customerName || `Customer #${customerId}`,
          actionType: 'Simulated Payment Link Callback',
          amount: amount,
          before: res.data.before_state,
          after: res.data.after_state,
          delta: res.data.delta
        });
      }
    } else {
      showToast(res.error || 'Payment simulation failed.', 'error');
    }
  };

  // Batch Selection Helpers
  const handleToggleSelect = (customerId) => {
    setSelectedCustomerIds(prev => 
      prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    const allEligibleIds = recoveryQueue.map(q => q.customer_id);
    setSelectedCustomerIds(allEligibleIds);
  };

  const handleSelectHighAndCritical = () => {
    const ids = recoveryQueue
      .filter(q => q.risk_level === 'High' || q.risk_level === 'Critical')
      .map(q => q.customer_id);
    setSelectedCustomerIds(ids);
  };

  const handleSelectHighOverdue = () => {
    const ids = recoveryQueue
      .filter(q => Number(q.overdue_amount || 0) >= 100000)
      .map(q => q.customer_id);
    setSelectedCustomerIds(ids);
  };

  const handleClearSelection = () => {
    setSelectedCustomerIds([]);
  };

  // Selected Batch Aggregates
  const selectedQueueItems = useMemo(() => {
    return recoveryQueue.filter(item => selectedCustomerIds.includes(item.customer_id));
  }, [recoveryQueue, selectedCustomerIds]);

  const batchSummary = useMemo(() => {
    const totalOutstanding = selectedQueueItems.reduce((acc, item) => acc + Number(item.outstanding_amount || 0), 0);
    const totalOverdue = selectedQueueItems.reduce((acc, item) => acc + Number(item.overdue_amount || 0), 0);
    const criticalCount = selectedQueueItems.filter(i => i.risk_level === 'Critical').length;
    const highCount = selectedQueueItems.filter(i => i.risk_level === 'High').length;
    const mediumCount = selectedQueueItems.filter(i => i.risk_level === 'Medium').length;
    const ptpActiveCount = selectedQueueItems.filter(i => i.is_ptp_paused).length;

    return {
      count: selectedQueueItems.length,
      totalOutstanding,
      totalOverdue,
      criticalCount,
      highCount,
      mediumCount,
      ptpActiveCount
    };
  }, [selectedQueueItems]);

  // Batch Execution
  const handleExecuteBatch = async () => {
    if (selectedCustomerIds.length === 0) return;
    setBatchProcessing(true);
    const res = await approveRecoveryBatch(selectedCustomerIds, true);
    setBatchProcessing(false);
    setShowBatchReviewModal(false);

    if (res.success) {
      setBatchResults(res.data);
      showToast(`Recovery Batch Completed! ₹${Number(res.data.summary.total_recovered).toLocaleString()} recovered.`, 'success');
      setSelectedCustomerIds([]);
    } else {
      showToast(res.error || 'Batch recovery execution failed.', 'error');
    }
  };

  // Promise-to-Pay Handlers
  const handleOpenPtpModal = (customer) => {
    setPtpModalCustomer(customer);
    setPtpAmount(String(customer.overdue_amount || customer.outstanding_amount || ''));
    // Default 7 days in future
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setPtpDate(d.toISOString().split('T')[0]);
    setPtpNotes('Customer confirmed repayment date after invoice reconciliation.');
  };

  const handleSavePtp = async (e) => {
    e.preventDefault();
    if (!ptpModalCustomer || !ptpAmount || !ptpDate) return;
    setPtpProcessing(true);
    const res = await registerPromiseToPay(
      ptpModalCustomer.customer_id,
      parseFloat(ptpAmount),
      ptpDate,
      ptpNotes
    );
    setPtpProcessing(false);
    setPtpModalCustomer(null);

    if (res.success) {
      showToast(`Promise-to-Pay registered for ₹${parseFloat(ptpAmount).toLocaleString()}. Automated outreach paused.`, 'success');
    } else {
      showToast(res.error || 'Failed to register Promise to Pay.', 'error');
    }
  };

  const handleCancelPtp = async (customerId) => {
    setActionProcessingId(customerId);
    const res = await cancelPromiseToPay(customerId);
    setActionProcessingId(null);
    if (res.success) {
      showToast('Promise-to-Pay cancelled. Account returned to recovery eligibility.', 'success');
    } else {
      showToast(res.error || 'Failed to cancel Promise to Pay.', 'error');
    }
  };

  const dashboardData = recoveryDashboard || {
    summary: {
      total_outstanding: 0, due_today: 0, due_this_week: 0, overdue: 0,
      high_risk_receivables: 0, amount_recovered: 0, amount_targeted: 0,
      recovery_rate: 0, customers_analyzed: 0, high_risk_customers: 0,
      recommended_actions: 0, successful_recoveries: 0, failed_actions: 0, exceptions: 0,
      active_ptp_count: 0, active_ptp_amount: 0
    },
    audits: [],
    chart: []
  };

  const chartData = dashboardData.chart || [];
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map(d => Math.max(Number(d.recovered || 0), Number(d.target || 0)))) || 1 : 1;
  const hasChartData = chartData.some(d => Number(d.recovered || 0) > 0);

  const lowRiskCount = customers.filter(c => c.aiRiskLevel === 'Low').length;
  const mediumRiskCount = customers.filter(c => c.aiRiskLevel === 'Medium').length;
  const highRiskCount = customers.filter(c => c.aiRiskLevel === 'High').length;
  const criticalRiskCount = customers.filter(c => c.aiRiskLevel === 'Critical').length;
  const totalRiskCount = lowRiskCount + mediumRiskCount + highRiskCount + criticalRiskCount || 1;

  return (
    <div style={containerStyle}>
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              ...toastStyle,
              backgroundColor: toast.type === 'success' ? 'var(--green-primary)' : '#ef4444'
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Row */}
      <div style={headerStyle}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              AI Revenue Recovery Engine
            </h1>
            <span style={rzpBadgeStyle}>Razorpay Track 03</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Detect at-risk receivables, enforce compliant escalation & stopping rules, and measure verified money recovered across batches.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleManualRefresh}
            style={refreshButtonStyle}
            title="Refresh Recovery Metrics"
          >
            <RefreshCw size={14} className={recoveryLoading ? 'spin-animation' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={tabsRowStyle}>
        <button
          onClick={() => setActiveSubTab('overview')}
          style={{ ...tabButtonStyle, ...(activeSubTab === 'overview' ? activeTabButtonStyle : {}) }}
        >
          <BarChart3 size={15} />
          Recovery Dashboard
        </button>
        <button
          onClick={() => setActiveSubTab('queue')}
          style={{ ...tabButtonStyle, ...(activeSubTab === 'queue' ? activeTabButtonStyle : {}) }}
        >
          <Play size={15} />
          AI Action Queue
          {recoveryQueue.length > 0 && (
            <span style={tabCountBadgeStyle}>{recoveryQueue.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('audits')}
          style={{ ...tabButtonStyle, ...(activeSubTab === 'audits' ? activeTabButtonStyle : {}) }}
        >
          <FileText size={15} />
          Audit Trail & Proof
          {recoveryAudits.length > 0 && (
            <span style={tabCountBadgeStyle}>{recoveryAudits.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('rules')}
          style={{ ...tabButtonStyle, ...(activeSubTab === 'rules' ? activeTabButtonStyle : {}) }}
        >
          <Settings size={15} />
          Guardrails & Stopping Rules
        </button>
      </div>

      {/* Tab Contents */}
      <div style={{ marginTop: '1.5rem' }}>
        {/* OVERVIEW TAB */}
        {activeSubTab === 'overview' && (
          <div style={tabPanelStyle}>
            {/* Top Metric Cards */}
            <div style={metricsGridStyle}>
              <div style={metricCardStyle}>
                <div style={metricHeaderStyle}>
                  <span style={metricLabelStyle}>Total Outstanding Dues</span>
                  <div style={{ ...iconBoxStyle, color: 'var(--blue-primary)', backgroundColor: 'var(--blue-light)' }}>
                    <DollarSign size={16} />
                  </div>
                </div>
                <h2 style={metricValueStyle}>₹{dashboardData.summary.total_outstanding.toLocaleString()}</h2>
                <div style={metricFooterStyle}>
                  <span style={{ color: 'var(--text-muted)' }}>Analyzed: </span>
                  <strong>{dashboardData.summary.customers_analyzed} B2B Accounts</strong>
                </div>
              </div>

              <div style={metricCardStyle}>
                <div style={metricHeaderStyle}>
                  <span style={metricLabelStyle}>Overdue Revenue at Risk</span>
                  <div style={{ ...iconBoxStyle, color: '#f97316', backgroundColor: '#fff7ed' }}>
                    <AlertTriangle size={16} />
                  </div>
                </div>
                <h2 style={{ ...metricValueStyle, color: '#f97316' }}>₹{dashboardData.summary.overdue.toLocaleString()}</h2>
                <div style={metricFooterStyle}>
                  <span style={{ color: 'var(--text-muted)' }}>Due Today/Week: </span>
                  <strong style={{ color: '#f97316' }}>₹{dashboardData.summary.due_this_week.toLocaleString()}</strong>
                </div>
              </div>

              <div style={metricCardStyle}>
                <div style={metricHeaderStyle}>
                  <span style={metricLabelStyle}>Amount Recovered (Measured)</span>
                  <div style={{ ...iconBoxStyle, color: 'var(--green-primary)', backgroundColor: 'var(--green-light)' }}>
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <h2 style={{ ...metricValueStyle, color: 'var(--green-primary)' }}>₹{dashboardData.summary.amount_recovered.toLocaleString()}</h2>
                <div style={metricFooterStyle}>
                  <span style={{ color: 'var(--text-muted)' }}>Recovery Rate: </span>
                  <strong style={{ color: 'var(--green-primary)' }}>{dashboardData.summary.recovery_rate}%</strong>
                </div>
              </div>

              <div style={metricCardStyle}>
                <div style={metricHeaderStyle}>
                  <span style={metricLabelStyle}>Promise-to-Pay (PTP) Active</span>
                  <div style={{ ...iconBoxStyle, color: '#8b5cf6', backgroundColor: '#f5f3ff' }}>
                    <Calendar size={16} />
                  </div>
                </div>
                <h2 style={{ ...metricValueStyle, color: '#8b5cf6' }}>₹{Number(dashboardData.summary.active_ptp_amount || 0).toLocaleString()}</h2>
                <div style={metricFooterStyle}>
                  <span style={{ color: 'var(--text-muted)' }}>Paused Accounts: </span>
                  <strong style={{ color: '#8b5cf6' }}>{dashboardData.summary.active_ptp_count || 0} Commitments</strong>
                </div>
              </div>
            </div>

            {/* Recovery Rate Progress Panel */}
            <div style={recoveryProgressCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Measured Batch & Dues Recovery Progress</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--green-primary)' }}>{dashboardData.summary.recovery_rate}% Collected</span>
              </div>
              <div style={progressBarContainerStyle}>
                <div style={{ ...progressBarFillStyle, width: `${dashboardData.summary.recovery_rate}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Total Collected: <strong>₹{dashboardData.summary.amount_recovered.toLocaleString()}</strong></span>
                <span>Active At Risk: <strong>₹{dashboardData.summary.overdue.toLocaleString()}</strong></span>
                <span>Queue Pending: <strong>{recoveryQueue.length} Accounts</strong></span>
              </div>
            </div>

            {/* Split row: SVG charts and AI highlights */}
            <div style={splitRowStyle}>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Recovery Collection Performance</h3>
                <p style={cardSubtitleStyle}>Monthly credit recovery totals (Current vs AI Targets)</p>
                
                {!hasChartData ? (
                  <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
                    <Clock size={24} style={{ marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Not enough recovery history yet.</span>
                    <span style={{ fontSize: '0.65rem', marginTop: '0.2rem', color: 'var(--text-secondary)' }}>Historical recovery data will appear as transactions are recorded.</span>
                  </div>
                ) : (
                  <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '1rem 2rem 0', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 40, borderBottom: '1px dashed #e2e8f0', zIndex: 0 }} />
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 90, borderBottom: '1px dashed #e2e8f0', zIndex: 0 }} />
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 140, borderBottom: '1px dashed #e2e8f0', zIndex: 0 }} />
                    
                    {chartData.map((d, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1, width: '12%' }}>
                        <div style={{ display: 'flex', width: '100%', gap: '0.2rem', height: 120, alignItems: 'flex-end', justifyContent: 'center' }}>
                          <div style={{ width: 10, height: `${(d.recovered / maxVal) * 100}%`, backgroundColor: 'var(--green-primary)', borderRadius: '3px 3px 0 0', position: 'relative' }} title={`Recovered: ₹${d.recovered.toLocaleString()} / Target: ₹${d.target.toLocaleString()}`} />
                          <div style={{ width: 10, height: `${(d.target / maxVal) * 100}%`, backgroundColor: 'var(--blue-primary)', opacity: 0.15, borderRadius: '3px 3px 0 0', position: 'relative' }} title={`Target: ₹${d.target.toLocaleString()}`} />
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{d.month}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', fontSize: '0.7rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--green-primary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Recovered Dues</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--blue-primary)', opacity: 0.4 }} />
                    <span style={{ color: 'var(--text-secondary)' }}>AI Credit Exposure Target</span>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>AI Accounts Health Diagnostics</h3>
                <p style={cardSubtitleStyle}>Risk level distribution of B2B credit buyers</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div style={riskBarRowStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                      <span style={{ color: '#ef4444' }}>Critical Risk (Legal Escalation / Credit Freeze)</span>
                      <span>{criticalRiskCount} Accounts</span>
                    </div>
                    <div style={riskBarTrackStyle}><div style={{ ...riskBarFillStyle, backgroundColor: '#ef4444', width: `${(criticalRiskCount / totalRiskCount) * 100}%` }} /></div>
                  </div>
                  <div style={riskBarRowStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                      <span style={{ color: '#f97316' }}>High Risk (Requires Payment Links)</span>
                      <span>{highRiskCount} Accounts</span>
                    </div>
                    <div style={riskBarTrackStyle}><div style={{ ...riskBarFillStyle, backgroundColor: '#f97316', width: `${(highRiskCount / totalRiskCount) * 100}%` }} /></div>
                  </div>
                  <div style={riskBarRowStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                      <span style={{ color: '#eab308' }}>Medium Risk (Approaching Due Date)</span>
                      <span>{mediumRiskCount} Accounts</span>
                    </div>
                    <div style={riskBarTrackStyle}><div style={{ ...riskBarFillStyle, backgroundColor: '#eab308', width: `${(mediumRiskCount / totalRiskCount) * 100}%` }} /></div>
                  </div>
                  <div style={riskBarRowStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--green-primary)' }}>Low Risk (Standard Standings)</span>
                      <span>{lowRiskCount} Accounts</span>
                    </div>
                    <div style={riskBarTrackStyle}><div style={{ ...riskBarFillStyle, backgroundColor: 'var(--green-primary)', width: `${(lowRiskCount / totalRiskCount) * 100}%` }} /></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Audits List in Dashboard */}
            <div style={{ ...cardStyle, marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={cardTitleStyle}>Recent Actions & Verified State Transitions</h3>
                  <p style={cardSubtitleStyle}>Audit trace results of the recovery agent with Before vs After proofs</p>
                </div>
                <button onClick={() => setActiveSubTab('audits')} style={textLinkButtonStyle}>
                  View Full Audit Log <ChevronRight size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {dashboardData.audits.slice(0, 4).map((a, idx) => (
                  <div key={idx} style={auditDashboardRowStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      {a.status === 'success' ? (
                        <CheckCircle size={16} style={{ color: 'var(--green-primary)' }} />
                      ) : a.status === 'blocked' ? (
                        <Lock size={16} style={{ color: '#eab308' }} />
                      ) : (
                        <XCircle size={16} style={{ color: '#ef4444' }} />
                      )}
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {a.action_type} for {a.customer_name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(a.created_at).toLocaleString()} • Risk Tier: {a.risk_level} {a.batch_id ? `• Batch: ${a.batch_id}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹{a.amount.toLocaleString()}</span>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: a.status === 'success' ? 'var(--green-primary)' : (a.status === 'blocked' ? '#eab308' : '#ef4444') }}>
                          {a.status.toUpperCase()}
                        </div>
                      </div>
                      {a.before_state && a.after_state && (
                        <button
                          onClick={() => setStateProofData({
                            customerName: a.customer_name,
                            actionType: a.action_type,
                            amount: a.amount,
                            before: a.before_state,
                            after: a.after_state,
                            delta: {
                              recovered_amount: a.recovered_amount || a.amount,
                              outstanding_reduction: (a.before_state.outstanding || 0) - (a.after_state.outstanding || 0),
                              overdue_reduction: (a.before_state.overdue || 0) - (a.after_state.overdue || 0),
                              risk_score_reduction: (a.before_state.risk_score || 0) - (a.after_state.risk_score || 0),
                              risk_level_transition: `${a.before_state.risk_level} → ${a.after_state.risk_level}`
                            }
                          })}
                          style={proofBadgeButtonStyle}
                          title="View Before vs After Proof"
                        >
                          Proof <ArrowUpRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {dashboardData.audits.length === 0 && (
                  <div style={emptyStateStyle}>No recovery actions executed yet. Go to the Action Queue tab to dispatch your first recovery link!</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI ACTION QUEUE TAB (With Batch Selection & PTP Tracker) */}
        {activeSubTab === 'queue' && (
          <div style={tabPanelStyle}>
            {/* Action Queue Info Banner */}
            <div style={queueInfoBoxStyle}>
              <Sparkles size={16} style={{ color: 'var(--blue-primary)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <strong>AI Revenue Recovery queue:</strong> The agent automatically diagnoses debtors and recommends appropriate bounded interventions. Select multiple debtors for <strong>Batch Recovery Execution</strong> or register <strong>Promise-to-Pay (PTP)</strong> commitments.
              </span>
            </div>

            {/* Batch Selection Controls Bar */}
            <div style={batchControlsBarStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginRight: '0.25rem' }}>
                  Batch Select:
                </span>
                <button onClick={handleSelectAll} style={filterPillStyle}>
                  Select All ({recoveryQueue.length})
                </button>
                <button onClick={handleSelectHighAndCritical} style={filterPillStyle}>
                  High & Critical ({recoveryQueue.filter(q => q.risk_level === 'High' || q.risk_level === 'Critical').length})
                </button>
                <button onClick={handleSelectHighOverdue} style={filterPillStyle}>
                  Overdue &gt; ₹1L ({recoveryQueue.filter(q => Number(q.overdue_amount || 0) >= 100000).length})
                </button>
                {selectedCustomerIds.length > 0 && (
                  <button onClick={handleClearSelection} style={{ ...filterPillStyle, color: '#ef4444', borderColor: '#fecaca' }}>
                    Clear ({selectedCustomerIds.length})
                  </button>
                )}
              </div>

              {selectedCustomerIds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Selected: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{batchSummary.count} accounts</strong>
                    <span style={{ margin: '0 0.35rem', color: '#cbd5e1' }}>|</span>
                    <span style={{ color: 'var(--text-muted)' }}>Overdue: </span>
                    <strong style={{ color: '#f97316' }}>₹{batchSummary.totalOverdue.toLocaleString()}</strong>
                  </div>
                  <button
                    onClick={() => setShowBatchReviewModal(true)}
                    style={batchActionPrimaryBtnStyle}
                  >
                    <Layers size={14} />
                    Review & Execute Batch ({selectedCustomerIds.length})
                  </button>
                </div>
              )}
            </div>

            {/* Queue Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {recoveryQueue.map((item) => {
                const isProcessing = actionProcessingId === item.customer_id;
                const isPaying = actionProcessingId === (item.customer_id + '-pay');
                const isMessageOpen = activeMessagePreviewId === item.customer_id;
                const isSelected = selectedCustomerIds.includes(item.customer_id);
                const isPausedPtp = item.is_ptp_paused;

                return (
                  <div
                    key={item.customer_id}
                    style={{
                      ...queueCardStyle,
                      border: isSelected ? '2px solid var(--blue-primary)' : '1px solid var(--border-color)',
                      backgroundColor: isPausedPtp ? '#fefce8' : '#ffffff'
                    }}
                  >
                    {/* Top Row with Selection Checkbox & Details */}
                    <div style={queueRowStyle}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                        <button
                          onClick={() => handleToggleSelect(item.customer_id)}
                          style={checkboxBtnStyle}
                          title={isSelected ? 'Deselect customer' : 'Select for batch recovery'}
                        >
                          {isSelected ? (
                            <CheckSquare size={18} style={{ color: 'var(--blue-primary)' }} />
                          ) : (
                            <Square size={18} style={{ color: '#94a3b8' }} />
                          )}
                        </button>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h3 style={debtorNameStyle}>{item.customer_name}</h3>
                            <span style={riskBadgeStyle(item.risk_level)}>{item.risk_level} Risk</span>
                            {isPausedPtp && (
                              <span style={ptpPausedBadgeStyle}>
                                <PauseCircle size={12} />
                                PTP ACTIVE (Until {item.promise_to_pay_date ? new Date(item.promise_to_pay_date).toLocaleDateString() : 'Scheduled Date'})
                              </span>
                            )}
                          </div>
                          <div style={debtorDetailsStyle}>
                            <span>Outstanding: <strong>₹{Number(item.outstanding_amount || 0).toLocaleString()}</strong></span>
                            {Number(item.overdue_amount || 0) > 0 && (
                              <span style={{ color: '#f97316' }}>Overdue: <strong>₹{Number(item.overdue_amount || 0).toLocaleString()}</strong> ({item.days_overdue || 0} days)</span>
                            )}
                            <span>Contact: {item.phone || item.email || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Risk Score</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--blue-primary)' }}>{Number(item.risk_score || 0).toFixed(0)}%</div>
                      </div>
                    </div>

                    {/* Middle Section: AI recommendation */}
                    <div style={recBoxStyle}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <Sparkles size={14} style={{ color: 'var(--blue-primary)', marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--blue-primary)' }}>
                            Recommended Action: {item.recommended_action}
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            <strong>Diagnostic Reason:</strong> {item.recommended_reason}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontStyle: 'italic', borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
                            "{item.explanation}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Message Preview */}
                    {isMessageOpen && (
                      <div style={messagePreviewBoxStyle}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Personalized Message Copy</div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{item.personalized_message}</p>
                      </div>
                    )}

                    {/* Lower Row: Action buttons */}
                    <div style={queueActionsStyle}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => setActiveMessagePreviewId(isMessageOpen ? null : item.customer_id)}
                          style={previewBtnStyle}
                        >
                          {isMessageOpen ? 'Hide Copy' : 'Review Copy'}
                        </button>

                        {/* Promise to Pay button */}
                        {!isPausedPtp ? (
                          <button
                            onClick={() => handleOpenPtpModal(item)}
                            style={ptpActionButtonStyle}
                            title="Register a Promise to Pay to pause automated outreach"
                          >
                            <Calendar size={13} />
                            Promise to Pay
                          </button>
                        ) : (
                          <button
                            disabled={isProcessing}
                            onClick={() => handleCancelPtp(item.customer_id)}
                            style={cancelPtpBtnStyle}
                            title="Cancel active PTP and resume recovery eligibility"
                          >
                            <PlayCircle size={13} />
                            Cancel PTP & Resume
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* Simulated failure check */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={!!forceFailStates[item.customer_id]}
                            onChange={(e) => setForceFailStates(prev => ({ ...prev, [item.customer_id]: e.target.checked }))}
                          />
                          Fail Sandbox
                        </label>

                        {/* Direct simulated payment link checkout */}
                        {item.recommended_action !== 'Suspend Credit & Escalate' && !isPausedPtp && (
                          <button
                            disabled={isProcessing || isPaying}
                            onClick={() => handleSimulatePayment(item.customer_id, item.overdue_amount || item.outstanding_amount, item.customer_name)}
                            style={simulatePaymentBtnStyle}
                          >
                            {isPaying ? 'Processing...' : 'Simulate Payment'}
                          </button>
                        )}

                        <button
                          disabled={isProcessing || isPaying || isPausedPtp}
                          onClick={() => handleApproveAction(item.customer_id, item.recommended_action, !!forceFailStates[item.customer_id])}
                          style={{ ...approveBtnStyle, opacity: isPausedPtp ? 0.5 : 1 }}
                        >
                          {isProcessing ? 'Executing...' : (isPausedPtp ? 'Outreach Paused' : 'Approve Action')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {recoveryQueue.length === 0 && (
                <div style={emptyStateStyle}>
                  <ShieldCheck size={40} style={{ color: 'var(--green-primary)', marginBottom: '0.75rem' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Outstanding Accounts Clear</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    All customer credit payments are current and settled.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AUDIT TRAIL TAB (With Before vs After Proof Details) */}
        {activeSubTab === 'audits' && (
          <div style={tabPanelStyle}>
            <div style={auditGridStyle}>
              {/* Left Audits list */}
              <div style={auditsListColumnStyle}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Chronological Recovery Audits
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recoveryAudits.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAuditId(a.id)}
                      style={{
                        ...auditRowButtonStyle,
                        borderColor: selectedAuditId === a.id ? 'var(--blue-primary)' : 'rgba(15, 23, 42, 0.05)',
                        backgroundColor: selectedAuditId === a.id ? 'var(--blue-light)' : '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                        {a.status === 'success' ? (
                          <CheckCircle size={14} style={{ color: 'var(--green-primary)' }} />
                        ) : a.status === 'blocked' ? (
                          <Lock size={14} style={{ color: '#eab308' }} />
                        ) : (
                          <XCircle size={14} style={{ color: '#ef4444' }} />
                        )}
                        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {a.action_type} - {a.customer_name}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {new Date(a.created_at).toLocaleString()} {a.batch_id ? `• ${a.batch_id}` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>₹{Number(a.amount).toLocaleString()}</span>
                          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: a.status === 'success' ? 'var(--green-primary)' : (a.status === 'blocked' ? '#eab308' : '#ef4444') }}>
                            {a.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {recoveryAudits.length === 0 && (
                    <div style={emptyStateStyle}>No logged recovery audit trails found.</div>
                  )}
                </div>
              </div>

              {/* Right Audit detail pane */}
              <div style={auditDetailColumnStyle}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Execution Diagnostic Log & State Delta
                </h3>
                {selectedAuditId ? (() => {
                  const audit = recoveryAudits.find(a => a.id === selectedAuditId);
                  if (!audit) return <div style={emptyStateStyle}>Select an audit item to view tracing details.</div>;

                  return (
                    <div style={auditDetailBoxStyle}>
                      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>{audit.action_type} Action</h4>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: audit.status === 'success' ? 'var(--green-light)' : (audit.status === 'blocked' ? '#fffbeb' : '#fef2f2'),
                            color: audit.status === 'success' ? 'var(--green-primary)' : (audit.status === 'blocked' ? '#eab308' : '#ef4444')
                          }}>
                            {audit.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          Customer: <strong>{audit.customer_name}</strong> • Amount: <strong>₹{Number(audit.amount).toLocaleString()}</strong>
                        </div>
                        {audit.batch_id && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--blue-primary)', fontWeight: 600, marginTop: '0.2rem' }}>
                            Batch ID: {audit.batch_id}
                          </div>
                        )}
                      </div>

                      {/* Before vs After Summary Box if Available */}
                      {audit.before_state && audit.after_state && (
                        <div style={auditBeforeAfterBoxStyle}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Verified Ledger State Mutation</span>
                            <button
                              onClick={() => setStateProofData({
                                customerName: audit.customer_name,
                                actionType: audit.action_type,
                                amount: audit.amount,
                                before: audit.before_state,
                                after: audit.after_state,
                                delta: {
                                  recovered_amount: audit.recovered_amount || audit.amount,
                                  outstanding_reduction: (audit.before_state.outstanding || 0) - (audit.after_state.outstanding || 0),
                                  overdue_reduction: (audit.before_state.overdue || 0) - (audit.after_state.overdue || 0),
                                  risk_score_reduction: (audit.before_state.risk_score || 0) - (audit.after_state.risk_score || 0),
                                  risk_level_transition: `${audit.before_state.risk_level} → ${audit.after_state.risk_level}`
                                }
                              })}
                              style={proofExpandBtnStyle}
                            >
                              Expand Visual Proof <ArrowUpRight size={12} />
                            </button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.7rem' }}>
                            <div style={stateColumnStyle}>
                              <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>BEFORE ACTION</span>
                              <div>Outstanding: ₹{audit.before_state.outstanding?.toLocaleString()}</div>
                              <div>Overdue: ₹{audit.before_state.overdue?.toLocaleString()}</div>
                              <div>Risk: {audit.before_state.risk_level} ({audit.before_state.risk_score}%)</div>
                            </div>
                            <div style={stateColumnStyle}>
                              <span style={{ fontWeight: 700, color: 'var(--green-primary)' }}>AFTER ACTION</span>
                              <div>Outstanding: ₹{audit.after_state.outstanding?.toLocaleString()}</div>
                              <div>Overdue: ₹{audit.after_state.overdue?.toLocaleString()}</div>
                              <div>Risk: {audit.after_state.risk_level} ({audit.after_state.risk_score}%)</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pipeline Trace Logs</span>
                        <pre style={auditLogsPreStyle}>{audit.details || 'No execution trace logs recorded.'}</pre>
                      </div>
                    </div>
                  );
                })() : (
                  <div style={emptyStateStyle}>Select an audit item from the left to view pipeline traces and state mutations.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RULES & GUARDRAILS TAB */}
        {activeSubTab === 'rules' && (
          <div style={tabPanelStyle}>
            <div style={rulesCardStyle}>
              <h3 style={cardTitleStyle}>Recovery Safety Guardrails & Stopping Rules</h3>
              <p style={cardSubtitleStyle}>Enforce bounded execution, frequency limits, and stopping conditions across batches</p>

              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={ruleRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} style={{ color: 'var(--green-primary)' }} />
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Zero-Balance Stopping Rule</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Immediately halts any automated outreach if customer dues are cleared or outstanding balance is ₹0.</p>
                    </div>
                  </div>
                  <span style={activeRuleTagStyle}>ENFORCED (ACTIVE)</span>
                </div>

                <div style={ruleRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} style={{ color: '#8b5cf6' }} />
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Promise-to-Pay (PTP) Grace Stopping Rule</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Freezes all reminders, payment links, and escalation while an active PTP commitment is registered.</p>
                    </div>
                  </div>
                  <span style={activeRuleTagStyle}>ENFORCED (ACTIVE)</span>
                </div>

                <div style={ruleRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} style={{ color: 'var(--blue-primary)' }} />
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Contact Frequency Cooldown (24 Hours)</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Blocks consecutive recovery communications to the same debtor within a 24-hour rolling window.</p>
                    </div>
                  </div>
                  <span style={activeRuleTagStyle}>ENFORCED (ACTIVE)</span>
                </div>

                <div style={ruleRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} style={{ color: '#f97316' }} />
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Weekly Touch Ceiling (Max 3 / 7 Days)</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Caps outreach frequency at 3 touches per week to maintain compliance with regulatory guidelines.</p>
                    </div>
                  </div>
                  <span style={activeRuleTagStyle}>ENFORCED (ACTIVE)</span>
                </div>

                <div style={ruleRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={18} style={{ color: '#ef4444' }} />
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Credit Facility Freeze on Critical Risk</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Automatically suspends purchasing credit limits (sets to ₹0) when critical risk escalation is approved.</p>
                    </div>
                  </div>
                  <span style={activeRuleTagStyle}>ENFORCED (ACTIVE)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: BATCH REVIEW & CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showBatchReviewModal && (
          <div style={modalBackdropStyle}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={modalContentStyle}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} style={{ color: 'var(--blue-primary)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Review & Confirm Recovery Batch</h3>
                </div>
                <button onClick={() => setShowBatchReviewModal(false)} style={closeModalBtnStyle}><X size={16} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={batchStatBoxStyle}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target Accounts</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{batchSummary.count}</div>
                </div>
                <div style={batchStatBoxStyle}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Revenue at Risk</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f97316' }}>₹{batchSummary.totalOverdue.toLocaleString()}</div>
                </div>
                <div style={batchStatBoxStyle}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target Recovery</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-primary)' }}>₹{batchSummary.totalOverdue.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Proposed Interventions Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0.65rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <span>Send Payment Link (High Risk):</span>
                    <strong style={{ color: 'var(--gold-champagne)' }}>{batchSummary.highCount} accounts</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0.65rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <span>Suspend Credit & Escalate (Critical Risk):</span>
                    <strong style={{ color: '#f87171' }}>{batchSummary.criticalCount} accounts</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0.65rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <span>Send Friendly Reminder (Medium Risk):</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{batchSummary.mediumCount} accounts</strong>
                  </div>
                  {batchSummary.ptpActiveCount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0.65rem', backgroundColor: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '6px', color: 'var(--gold-champagne)' }}>
                      <span>Promise-to-Pay Active (Will be skipped by stopping rule):</span>
                      <strong style={{ color: 'var(--gold-primary)' }}>{batchSummary.ptpActiveCount} accounts</strong>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '1.25rem', fontSize: '0.75rem', color: '#34D399' }}>
                <strong style={{ color: '#34D399' }}>Safety Verification:</strong> All 4 guardrails (Zero-Balance, PTP Active, 24h Cooldown, Weekly Touch limit) will be enforced for each customer in this batch during backend processing.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setShowBatchReviewModal(false)} style={cancelBtnStyle}>Cancel</button>
                <button
                  disabled={batchProcessing}
                  onClick={handleExecuteBatch}
                  style={batchActionPrimaryBtnStyle}
                >
                  {batchProcessing ? 'Executing Batch in Sandbox...' : `Approve & Execute Batch (${batchSummary.count} Accounts)`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: BATCH EXECUTION RESULTS MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {batchResults && (
          <div style={modalBackdropStyle}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={modalCardStyle}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Batch Recovery Execution Results</h3>
                <button onClick={() => setBatchResults(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={batchStatBoxStyle}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Targeted</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{batchResults.summary.customers_targeted}</div>
                </div>
                <div style={batchStatBoxStyle}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Recovered</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green-primary)' }}>{batchResults.summary.successfully_recovered}</div>
                </div>
                <div style={batchStatBoxStyle}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Skipped (Rules)</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold-champagne)' }}>{batchResults.summary.skipped}</div>
                </div>
                <div style={batchStatBoxStyle}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Recovery Rate</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold-primary)' }}>{batchResults.summary.recovery_rate}%</div>
                </div>
              </div>

              {/* Financial Totals */}
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div>Targeted Revenue: <strong style={{ color: 'var(--text-primary)' }}>₹{batchResults.summary.total_targeted?.toLocaleString()}</strong></div>
                <div style={{ color: 'var(--green-primary)' }}>Measured Money Recovered: <strong style={{ color: 'var(--green-primary)' }}>₹{batchResults.summary.total_recovered?.toLocaleString()}</strong></div>
              </div>

              {/* Itemized Results */}
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Execution Outcomes</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                  {batchResults.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem', backgroundColor: item.status === 'recovered' ? 'rgba(16, 185, 129, 0.08)' : (item.status === 'skipped' ? 'rgba(212, 175, 55, 0.08)' : 'var(--bg-secondary)'), border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem' }}>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>{item.customer_name}</strong> <span style={{ color: 'var(--text-muted)' }}>({item.risk_level} Risk)</span>
                        {item.reason && <span style={{ color: 'var(--gold-champagne)', marginLeft: '0.5rem' }}>• {item.reason}</span>}
                      </div>
                      <div>
                        {item.amount_recovered > 0 ? (
                          <strong style={{ color: 'var(--green-primary)' }}>+₹{item.amount_recovered.toLocaleString()}</strong>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>{item.status.toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setBatchResults(null)} style={batchActionPrimaryBtnStyle}>Done & Refresh Dashboard</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: PROMISE-TO-PAY (PTP) REGISTRATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {ptpModalCustomer && (
          <div style={modalBackdropStyle}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={modalContentStyle}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} style={{ color: '#8b5cf6' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Register Promise to Pay (PTP)</h3>
                </div>
                <button onClick={() => setPtpModalCustomer(null)} style={closeModalBtnStyle}><X size={16} /></button>
              </div>

              <form onSubmit={handleSavePtp}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={formLabelStyle}>Customer Account</label>
                  <input
                    type="text"
                    disabled
                    value={`${ptpModalCustomer.customer_name} (Overdue: ₹${Number(ptpModalCustomer.overdue_amount || 0).toLocaleString()})`}
                    style={formInputDisabledStyle}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={formLabelStyle}>Promised Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={ptpAmount}
                    onChange={(e) => setPtpAmount(e.target.value)}
                    style={formInputStyle}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={formLabelStyle}>Promised Payment Date</label>
                  <input
                    type="date"
                    required
                    value={ptpDate}
                    onChange={(e) => setPtpDate(e.target.value)}
                    style={formInputStyle}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={formLabelStyle}>Notes / Commitment Reference</label>
                  <textarea
                    rows={3}
                    value={ptpNotes}
                    onChange={(e) => setPtpNotes(e.target.value)}
                    style={{ ...formInputStyle, resize: 'vertical' }}
                  />
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: '#f5f3ff', borderRadius: '6px', border: '1px solid #ddd6fe', marginBottom: '1.25rem', fontSize: '0.75rem', color: '#5b21b6' }}>
                  <strong>Stopping Rule Activated:</strong> Registering this commitment will pause all automated recovery outreach until {ptpDate ? new Date(ptpDate).toLocaleDateString() : 'the scheduled date'}.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setPtpModalCustomer(null)} style={cancelBtnStyle}>Cancel</button>
                  <button type="submit" disabled={ptpProcessing} style={ptpSubmitBtnStyle}>
                    {ptpProcessing ? 'Recording Commitment...' : 'Confirm Promise-to-Pay'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: BEFORE VS AFTER STATE MUTATION PROOF MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {stateProofData && (
          <div style={modalBackdropStyle}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ ...modalContentStyle, maxWidth: '600px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--green-primary)' }} />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Verified Ledger State Mutation Proof</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stateProofData.customerName} • {stateProofData.actionType}</span>
                  </div>
                </div>
                <button onClick={() => setStateProofData(null)} style={closeModalBtnStyle}><X size={16} /></button>
              </div>

              {/* Visual State Progression Flow */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                {/* BEFORE */}
                <div style={proofStateCardStyle('#fef2f2', '#ef4444')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991b1b' }}>1. BEFORE RECOVERY</span>
                    <span style={riskBadgeStyle(stateProofData.before?.risk_level || 'High')}>{stateProofData.before?.risk_level} Risk ({Number(stateProofData.before?.risk_score || 0).toFixed(0)}%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <div>Outstanding: <strong>₹{Number(stateProofData.before?.outstanding || 0).toLocaleString()}</strong></div>
                    <div>Overdue: <strong style={{ color: '#ef4444' }}>₹{Number(stateProofData.before?.overdue || 0).toLocaleString()}</strong></div>
                  </div>
                </div>

                {/* ARROW DOWN */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--green-primary)', gap: '0.5rem' }}>
                  <div style={{ height: 1, backgroundColor: '#bbf7d0', flex: 1 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    +₹{Number(stateProofData.delta?.recovered_amount || stateProofData.amount || 0).toLocaleString()} Settled via Simulated Payment Link
                  </span>
                  <div style={{ height: 1, backgroundColor: '#bbf7d0', flex: 1 }} />
                </div>

                {/* AFTER */}
                <div style={proofStateCardStyle('rgba(16, 185, 129, 0.08)', 'var(--green-primary)')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399' }}>2. AFTER RECOVERY (Post-Settlement)</span>
                    <span style={riskBadgeStyle(stateProofData.after?.risk_level || 'Low')}>{stateProofData.after?.risk_level} Risk ({Number(stateProofData.after?.risk_score || 0).toFixed(0)}%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <div>Outstanding: <strong style={{ color: 'var(--text-primary)' }}>₹{Number(stateProofData.after?.outstanding || 0).toLocaleString()}</strong></div>
                    <div>Overdue: <strong style={{ color: 'var(--green-primary)' }}>₹{Number(stateProofData.after?.overdue || 0).toLocaleString()}</strong></div>
                  </div>
                </div>
              </div>

              {/* Financial Deltas Summary */}
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Financial Deltas</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.35rem', fontSize: '0.75rem' }}>
                  <div>Outstanding: <strong style={{ color: 'var(--green-primary)' }}>-₹{Number(stateProofData.delta?.outstanding_reduction || 0).toLocaleString()}</strong></div>
                  <div>Overdue: <strong style={{ color: 'var(--green-primary)' }}>-₹{Number(stateProofData.delta?.overdue_reduction || 0).toLocaleString()}</strong></div>
                  <div>Risk Score: <strong style={{ color: 'var(--gold-champagne)' }}>{Number(stateProofData.before?.risk_score || 0).toFixed(0)}% → {Number(stateProofData.after?.risk_score || 0).toFixed(0)}%</strong></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setStateProofData(null)} style={batchActionPrimaryBtnStyle}>Close Proof Window</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --------------------------------------------------------------------------
// Styles
// --------------------------------------------------------------------------
const containerStyle = {
  padding: '1.5rem 2rem',
  maxWidth: '1280px',
  margin: '0 auto',
  color: 'var(--text-primary)',
  position: 'relative'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1.25rem'
};

const rzpBadgeStyle = {
  fontSize: '0.7rem',
  fontWeight: 800,
  padding: '0.2rem 0.5rem',
  borderRadius: '4px',
  backgroundColor: '#0a0a0c',
  color: 'var(--gold-primary)',
  letterSpacing: '0.02em',
  textTransform: 'uppercase'
};

const refreshButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.45rem 0.85rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  cursor: 'pointer',
  color: 'var(--text-primary)'
};

const tabsRowStyle = {
  display: 'flex',
  gap: '0.5rem',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.5rem',
  overflowX: 'auto'
};

const tabButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.5rem 1rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const activeTabButtonStyle = {
  color: 'var(--gold-primary)',
  backgroundColor: 'rgba(212, 175, 55, 0.12)',
  fontWeight: 700
};

const tabCountBadgeStyle = {
  fontSize: '0.65rem',
  fontWeight: 700,
  padding: '0.1rem 0.4rem',
  borderRadius: '10px',
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c'
};

const tabPanelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem'
};

const metricCardStyle = {
  backgroundColor: 'var(--bg-card)',
  padding: '1.25rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  boxShadow: 'var(--shadow-sm)'
};

const metricHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.75rem'
};

const metricLabelStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const iconBoxStyle = {
  width: 28,
  height: 28,
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const metricValueStyle = {
  fontSize: '1.5rem',
  fontWeight: 800,
  color: 'var(--text-primary)',
  marginBottom: '0.5rem',
  letterSpacing: '-0.02em'
};

const metricFooterStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)'
};

const recoveryProgressCardStyle = {
  backgroundColor: 'var(--bg-card)',
  padding: '1.25rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)'
};

const progressBarContainerStyle = {
  height: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  borderRadius: '5px',
  overflow: 'hidden'
};

const progressBarFillStyle = {
  height: '100%',
  backgroundColor: 'var(--gold-primary)',
  borderRadius: '5px',
  transition: 'width 0.6s ease'
};

const splitRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: '1.25rem'
};

const cardStyle = {
  backgroundColor: 'var(--bg-card)',
  padding: '1.25rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)'
};

const cardTitleStyle = {
  fontSize: '0.95rem',
  fontWeight: 800,
  color: 'var(--text-primary)'
};

const cardSubtitleStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  marginTop: '0.15rem'
};

const riskBarRowStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const riskBarTrackStyle = {
  height: '6px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  borderRadius: '3px',
  overflow: 'hidden'
};

const riskBarFillStyle = {
  height: '100%',
  borderRadius: '3px'
};

const auditDashboardRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  backgroundColor: 'var(--bg-secondary)'
};

const proofBadgeButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.2rem',
  padding: '0.25rem 0.5rem',
  fontSize: '0.65rem',
  fontWeight: 700,
  backgroundColor: 'rgba(212, 175, 55, 0.12)',
  color: 'var(--gold-primary)',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  borderRadius: '4px',
  cursor: 'pointer'
};

const queueInfoBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.85rem 1rem',
  backgroundColor: 'rgba(212, 175, 55, 0.08)',
  border: '1px solid rgba(212, 175, 55, 0.25)',
  borderRadius: '8px'
};

const batchControlsBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 1rem',
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  flexWrap: 'wrap',
  gap: '0.75rem'
};

const filterPillStyle = {
  padding: '0.3rem 0.65rem',
  fontSize: '0.7rem',
  fontWeight: 600,
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '14px',
  cursor: 'pointer',
  color: 'var(--text-secondary)'
};

const batchActionPrimaryBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.45rem 1rem',
  fontSize: '0.8rem',
  fontWeight: 700,
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  boxShadow: '0 2px 8px var(--gold-glow)'
};

const queueCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '1.25rem',
  boxShadow: 'var(--shadow-sm)',
  transition: 'all 0.2s ease'
};

const queueRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '0.85rem'
};

const checkboxBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0.1rem',
  display: 'flex',
  alignItems: 'center'
};

const debtorNameStyle = {
  fontSize: '1rem',
  fontWeight: 800,
  color: 'var(--text-primary)'
};

const debtorDetailsStyle = {
  display: 'flex',
  gap: '1rem',
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  marginTop: '0.25rem',
  flexWrap: 'wrap'
};

const ptpPausedBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  fontSize: '0.65rem',
  fontWeight: 800,
  padding: '0.15rem 0.5rem',
  borderRadius: '4px',
  backgroundColor: 'rgba(245, 158, 11, 0.15)',
  color: 'var(--gold-primary)',
  border: '1px solid rgba(245, 158, 11, 0.3)',
  letterSpacing: '0.02em'
};

const recBoxStyle = {
  padding: '0.85rem 1rem',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  marginBottom: '0.85rem'
};

const messagePreviewBoxStyle = {
  padding: '0.75rem 1rem',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px dashed var(--border-color)',
  borderRadius: '6px',
  marginBottom: '0.85rem'
};

const queueActionsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderTop: '1px solid var(--border-color)',
  paddingTop: '0.85rem',
  flexWrap: 'wrap',
  gap: '0.5rem'
};

const previewBtnStyle = {
  padding: '0.35rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '5px',
  cursor: 'pointer',
  color: 'var(--text-secondary)'
};

const ptpActionButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: '0.35rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: 'rgba(212, 175, 55, 0.12)',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  borderRadius: '5px',
  cursor: 'pointer',
  color: 'var(--gold-primary)'
};

const cancelPtpBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: '0.35rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '5px',
  cursor: 'pointer',
  color: '#f87171'
};

const simulatePaymentBtnStyle = {
  padding: '0.4rem 0.85rem',
  fontSize: '0.75rem',
  fontWeight: 700,
  backgroundColor: 'rgba(16, 185, 129, 0.15)',
  color: '#34d399',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  borderRadius: '5px',
  cursor: 'pointer'
};

const approveBtnStyle = {
  padding: '0.4rem 1rem',
  fontSize: '0.75rem',
  fontWeight: 700,
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  boxShadow: '0 2px 8px var(--gold-glow)'
};

const auditGridStyle = {
  display: 'grid',
  gridTemplateColumns: '380px 1fr',
  gap: '1.25rem'
};

const auditsListColumnStyle = {
  backgroundColor: 'var(--bg-card)',
  padding: '1.25rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  maxHeight: '650px',
  overflowY: 'auto'
};

const auditDetailColumnStyle = {
  backgroundColor: 'var(--bg-card)',
  padding: '1.25rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)'
};

const auditRowButtonStyle = {
  display: 'block',
  width: '100%',
  padding: '0.65rem 0.75rem',
  border: '1px solid transparent',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.1s ease',
  textAlign: 'left'
};

const auditDetailBoxStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const auditBeforeAfterBoxStyle = {
  padding: '0.85rem',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px'
};

const proofExpandBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.2rem',
  background: 'none',
  border: 'none',
  color: 'var(--gold-primary)',
  fontSize: '0.7rem',
  fontWeight: 700,
  cursor: 'pointer'
};

const stateColumnStyle = {
  padding: '0.5rem',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '4px',
  border: '1px solid var(--border-color)'
};

const auditLogsPreStyle = {
  padding: '0.75rem',
  backgroundColor: '#0a0a0c',
  color: '#f8fafc',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  fontSize: '0.7rem',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  maxHeight: '250px',
  overflowY: 'auto',
  marginTop: '0.35rem'
};

const rulesCardStyle = {
  backgroundColor: 'var(--bg-card)',
  padding: '1.5rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)'
};

const ruleRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.85rem',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px'
};

const activeRuleTagStyle = {
  fontSize: '0.65rem',
  fontWeight: 800,
  padding: '0.2rem 0.5rem',
  backgroundColor: 'rgba(16, 185, 129, 0.15)',
  color: '#34d399',
  borderRadius: '4px',
  border: '1px solid rgba(16, 185, 129, 0.3)'
};

const modalBackdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalContentStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  padding: '1.5rem',
  width: '100%',
  maxWidth: '520px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.8)'
};

const closeModalBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-muted)'
};

const batchStatBoxStyle = {
  padding: '0.65rem',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  textAlign: 'center'
};

const cancelBtnStyle = {
  padding: '0.45rem 1rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  cursor: 'pointer',
  color: 'var(--text-secondary)'
};

const ptpSubmitBtnStyle = {
  padding: '0.45rem 1.25rem',
  fontSize: '0.8rem',
  fontWeight: 700,
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  boxShadow: '0 2px 8px var(--gold-glow)'
};

const formLabelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: '0.35rem'
};

const formInputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.8rem',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  borderRadius: '6px',
  outline: 'none',
  boxSizing: 'border-box'
};

const formInputDisabledStyle = {
  ...formInputStyle,
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  color: 'var(--text-muted)'
};

const proofStateCardStyle = (bgColor, borderColor) => ({
  padding: '0.85rem 1rem',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px'
});

const toastStyle = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.25rem',
  borderRadius: '8px',
  color: '#ffffff',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  zIndex: 2000
};

const textLinkButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--gold-primary)',
  fontSize: '0.75rem',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.2rem'
};

const emptyStateStyle = {
  padding: '2rem',
  textAlign: 'center',
  color: 'var(--text-muted)',
  fontSize: '0.85rem'
};

const riskBadgeStyle = (level) => {
  let bg = 'rgba(16, 185, 129, 0.15)';
  let color = '#34d399';
  if (level === 'Critical') {
    bg = 'rgba(239, 68, 68, 0.15)';
    color = '#f87171';
  } else if (level === 'High') {
    bg = 'rgba(249, 115, 22, 0.15)';
    color = '#fb923c';
  } else if (level === 'Medium') {
    bg = 'rgba(234, 179, 8, 0.15)';
    color = '#fde047';
  }
  return {
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    backgroundColor: bg,
    color: color
  };
};
