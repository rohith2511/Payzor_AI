import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Activity, BarChart3, Clock, AlertTriangle, Play, CheckCircle2,
  MessageSquare, Mail, RefreshCw, Layers, ShieldCheck, Sparkles, Bell, Trash2
} from 'lucide-react';
import crmApi from '../../api/crmApi';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ localStorage key Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const LS_KEY = 'testingCenterSimulation';

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { }
  return null;
}

function persistState(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (_) { }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Initial / empty defaults Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const EMPTY_METRICS = { sent: 0, delivered: 0, opened: 0, clicked: 0, purchased: 0, failed: 0 };

export default function CrmTestingCenter() {
  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Restore persisted simulation or use defaults Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const persisted = loadPersistedState();

  const [campaignName, setCampaignName] = useState(persisted?.campaignName ?? 'Ganesh Chaturdhi');
  const [audienceSegment, setAudienceSegment] = useState(persisted?.segment ?? 'Dormant Customers');
  const [channel, setChannel] = useState(persisted?.channel ?? 'WhatsApp');

  const [deliveryQueue, setDeliveryQueue] = useState(persisted?.queue ?? []);
  const [selectedQueueId, setSelectedQueueId] = useState(
    persisted?.queue?.length ? persisted.queue[0].id : null
  );
  const [metrics, setMetrics] = useState(persisted?.metrics ?? EMPTY_METRICS);
  const [auditLogs, setAuditLogs] = useState(persisted?.auditLogs ?? []);

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ UI-only state (not persisted) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const [toasts, setToasts] = useState([]);
  const [activePipelineStage, setActivePipelineStage] = useState(-1);
  const [isLaunching, setIsLaunching] = useState(false);

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Persist to localStorage on every relevant state change Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    persistState({
      campaignName,
      segment: audienceSegment,
      channel,
      queue: deliveryQueue,
      metrics,
      auditLogs,
      timestamp: new Date().toISOString()
    });
  }, [campaignName, audienceSegment, channel, deliveryQueue, metrics, auditLogs]);

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Utilities Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const triggerToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const triggerPipelineAnimation = (startStage, endStage, callback) => {
    let stage = startStage;
    setActivePipelineStage(stage);
    const interval = setInterval(() => {
      stage += 1;
      if (stage <= endStage) {
        setActivePipelineStage(stage);
      } else {
        clearInterval(interval);
        setActivePipelineStage(-1);
        if (callback) callback();
      }
    }, 400);
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Clear simulation Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handleClearSimulation = () => {
    if (!window.confirm('Clear all simulation data?')) return;
    localStorage.removeItem(LS_KEY);
    setDeliveryQueue([]);
    setSelectedQueueId(null);
    setMetrics(EMPTY_METRICS);
    setAuditLogs([]);
    triggerToast('Simulation cleared.');
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Launch Campaign (simulation only Ã¢â‚¬â€ NO production DB writes) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handleLaunchCampaign = async (e) => {
    e.preventDefault();
    if (!campaignName.trim() || isLaunching) return;
    setIsLaunching(true);

    triggerPipelineAnimation(0, 1, async () => {
      try {
        // Fetch ONLY customers in the selected segment from the database
        const segmentCustomers = await crmApi.getCustomersBySegment(audienceSegment);

        if (!segmentCustomers || segmentCustomers.length === 0) {
          triggerToast(`No customers found in segment "${audienceSegment}". Seed the database first.`);
          setIsLaunching(false);
          return;
        }

        // Cap at 8 for a readable simulation queue
        const targetCustomers = segmentCustomers.slice(0, 8);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Build simulation queue entries Ã¢â‚¬â€ purely local, zero DB writes
        const newItems = targetCustomers.map((c, idx) => ({
          id: `sim-${Date.now()}-${idx}`,
          customerId: c.id,
          campaignId: null,           // no real campaign record
          name: c.name,
          segment: c.segment,
          channel: channel,           // exact channel selected, no conversion
          status: 'Queued',
          timestamp: timeStr
        }));

        // Build audit log entries
        const logsToAdd = newItems.map(item => ({
          time: timeStr,
          type: 'campaign_launched',
          customer: item.name,
          campaign: campaignName,
          channel: channel,
          status: 'Queued'
        }));

        setDeliveryQueue(prev => [...newItems, ...prev]);
        setSelectedQueueId(newItems[0].id);
        setMetrics(prev => ({ ...prev, sent: prev.sent + newItems.length }));
        setAuditLogs(prev => [...logsToAdd, ...prev]);

        triggerToast(`[SIMULATION] ${newItems.length} messages queued for "${audienceSegment}" via ${channel}`);
        triggerPipelineAnimation(1, 4);
      } catch (error) {
        console.error('Simulation launch error:', error);
        triggerToast('Failed to fetch segment customers. Check backend connection.');
      } finally {
        setIsLaunching(false);
      }
    });
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Callback event simulation (local state ONLY Ã¢â‚¬â€ no webhook, no DB) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const triggerCallbackEvent = (targetStatus) => {
    const queueItem = deliveryQueue.find(q => q.id === selectedQueueId);
    if (!queueItem) {
      alert('Please select a customer message row from the queue panel first!');
      return;
    }
    const prevStatus = queueItem.status;
    if (prevStatus === targetStatus) return;

    triggerPipelineAnimation(2, 4, () => {
      // Update queue item status locally
      setDeliveryQueue(prev => prev.map(q =>
        q.id === selectedQueueId ? { ...q, status: targetStatus } : q
      ));

      // Update funnel metrics locally
      setMetrics(prev => {
        const next = { ...prev };
        if (targetStatus === 'Failed') {
          next.failed += 1;
        } else if (targetStatus === 'Delivered') {
          next.delivered += 1;
        } else if (targetStatus === 'Opened') {
          next.opened += 1;
          if (prevStatus === 'Sent' || prevStatus === 'Queued') next.delivered += 1;
        } else if (targetStatus === 'Clicked') {
          next.clicked += 1;
          if (prevStatus === 'Sent' || prevStatus === 'Queued') next.delivered += 1;
          if (prevStatus !== 'Opened') next.opened += 1;
        } else if (targetStatus === 'Purchased') {
          next.purchased += 1;
          if (prevStatus === 'Sent' || prevStatus === 'Queued') next.delivered += 1;
          if (prevStatus !== 'Opened' && prevStatus !== 'Clicked') next.opened += 1;
          if (prevStatus !== 'Clicked') next.clicked += 1;
        }
        return next;
      });

      // Append to audit log locally
      const now = new Date();
      setAuditLogs(prev => [
        {
          time: now.toLocaleTimeString(),
          type: 'webhook_received',
          customer: queueItem.name,
          campaign: campaignName,
          channel: queueItem.channel,
          status: targetStatus
        },
        ...prev
      ]);

      triggerToast(`[SIMULATION] "${targetStatus}" event for ${queueItem.name}`);
    });
  };
  const campaignCode = campaignName
  ?.replace(/\s+/g, '')
  ?.substring(0, 12)
  ?.toUpperCase() || "FLASH15";
  const renderMessagePreview = () => {
    switch (channel) {
      case 'WhatsApp':
        return (
          <div style={whatsappPreviewStyle}>
            <div style={whatsappPreviewHeaderStyle}>WhatsApp Template Preview</div>
            <div style={whatsappPreviewBodyStyle}>
              <div style={whatsappBubbleStyle}>
                <span style={{ fontSize: '0.65rem', color: 'var(--gold-400)', fontWeight: 700 }}>PAYZOR AI RECOVERY</span>
                <p style={{ marginTop: '0.2rem' }}>Hi <strong>{"{{customer_name}}"}</strong>! Official account notification. Settle your pending invoice balance securely. Reference code <strong>{campaignCode}</strong>.</p>
                <div style={whatsappPreviewFooterStyle}><span>11:42 AM</span></div>
              </div>
            </div>
          </div>
        );
      case 'Email':
        return (
          <div style={emailPreviewStyle}>
            <div style={emailPreviewHeaderStyle}><strong>Subject:</strong> {campaignName || "Payzor AI — Invoice Statement & Payment Link"}</div>
            <div style={emailPreviewBodyStyle}>
              <p>Dear Accounts Payable,</p>
              <p style={{ marginTop: '0.5rem' }}>Your outstanding receivables statement is ready for review. Please use the secure settlement link to clear your invoice balance.</p>
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <a href="#checkout" style={emailBtnStyle}>Settle Balance Online</a>
              </div>
            </div>
          </div>
        );
      case 'SMS':
        return (
          <div style={smsPreviewStyle}>
            <div style={smsPreviewBodyStyle}>
              [Payzor AI] Statement Notice: Settle your overdue invoice securely.
              Direct link:
              {`https://checkout.payzor.ai/c/${campaignCode}`}
            </div>
          </div>
        );
      case 'RCS':
        return (
          <div style={rcsPreviewStyle}>
            <div style={rcsCardStyle}>
              <span style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>🎁</span>
              <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Exclusive Offer</div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>Get 15% off using coupon {campaignCode}.</p>
              <button style={rcsBtnStyle}>Buy Now</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Funnel rates Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const totalSent = metrics.sent || 1;
  const deliveryRate = ((metrics.delivered / totalSent) * 100).toFixed(0);
  const openRate = ((metrics.opened / totalSent) * 100).toFixed(0);
  const clickRate = ((metrics.clicked / totalSent) * 100).toFixed(0);
  const purchaseRate = ((metrics.purchased / totalSent) * 100).toFixed(0);

  const hasSimulation = deliveryQueue.length > 0;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="gradient-bg">

      {/* Toast Notifications */}
      <div style={toastContainerStyle}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={toastStyle}
            >
              <Bell size={14} style={{ color: 'var(--blue-primary)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 1. Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={testingBadgeStyle}>SANDBOX</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Communication Testing Center
          </h1>
          {/* Isolation indicator */}
          <span style={isolationBadgeStyle}>
            production records created
            🔒 Isolated - No production records created
          </span>
          {/* Clear simulation button */}
          {hasSimulation && (
            <button onClick={handleClearSimulation} style={clearBtnStyle} title="Clear all simulation data">
              <Trash2 size={12} /> Clear Simulation
            </button>
          )}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Simulate outgoing marketing events and callback webhooks in a fully isolated sandbox.
          All data is local - Campaign History, Analytics, and the Dashboard remain untouched.
        </p>
      </div>

      {/* 2. CRM Callback Pipeline Visualization */}
      <div style={panelCardStyle} className="glass-panel">
        <div style={panelHeaderStyle}>
          <Layers size={16} style={{ color: 'var(--blue-primary)' }} />
          <h3 style={panelTitleStyle}>CRM Callback Propagation Pipeline</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
          <div style={pipelineContainerStyle}>
            <div style={pipelineNodeStyle(activePipelineStage === 0)}>
              <span style={{ fontSize: '1.2rem' }}>💻</span>
              <span style={nodeLabelStyle}>CRM</span>
            </div>
            <div style={pipelineConnectorStyle(activePipelineStage === 1)} />
            <div style={pipelineNodeStyle(activePipelineStage === 1)}>
              <span style={{ fontSize: '1.2rem' }}>📡</span>
              <span style={nodeLabelStyle}>Channel Service</span>
            </div>
            <div style={pipelineConnectorStyle(activePipelineStage === 2)} />
            <div style={pipelineNodeStyle(activePipelineStage === 2)}>
              <span style={{ fontSize: '1.2rem' }}>✉️</span>
              <span style={nodeLabelStyle}>Delivery Event</span>
            </div>
            <div style={pipelineConnectorStyle(activePipelineStage === 3)} />
            <div style={pipelineNodeStyle(activePipelineStage === 3)}>
              <span style={{ fontSize: '1.2rem' }}>🔗</span>
              <span style={nodeLabelStyle}>Callback Webhook</span>
            </div>
            <div style={pipelineConnectorStyle(activePipelineStage === 4)} />
            <div style={pipelineNodeStyle(activePipelineStage === 4)}>
              <span style={{ fontSize: '1.2rem' }}>📈</span>
              <span style={nodeLabelStyle}>Analytics Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace */}
      <div style={workspaceGridStyle}>

        {/* Left: Campaign Simulator */}
        <div style={panelCardStyle} className="glass-panel">
          <div style={panelHeaderStyle}>
            <Play size={16} style={{ color: 'var(--blue-primary)' }} />
            <h3 style={panelTitleStyle}>Campaign Simulator</h3>
          </div>

          <form onSubmit={handleLaunchCampaign} style={formStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Campaign Name</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Audience Segment</label>
              <select
                value={audienceSegment}
                onChange={(e) => setAudienceSegment(e.target.value)}
                style={inputStyle}
              >
                <option>Dormant Customers</option>
                <option>High Value Customers</option>
                <option>Loyal Customers</option>
                <option>At Risk Customers</option>
                <option>New Customers</option>
                <option>Regular Customers</option>
              </select>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Delivery Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                style={inputStyle}
              >
                <option>WhatsApp</option>
                <option>Email</option>
                <option>SMS</option>
                <option>RCS</option>
              </select>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <span style={labelStyle}>Message Preview - {channel}</span>
              <div style={{ marginTop: '0.35rem' }}>
                {renderMessagePreview()}
              </div>
            </div>

            <button type="submit" style={{ ...launchBtnStyle, opacity: isLaunching ? 0.7 : 1 }} disabled={isLaunching}>
              {isLaunching
                ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Launching...</>
                : <><Play size={14} fill="#ffffff" /> Launch Campaign</>
              }
            </button>
          </form>
        </div>

        {/* Center: Live Message Queue */}
        <div style={panelCardStyle} className="glass-panel">
          <div style={panelHeaderStyle}>
            <Clock size={16} style={{ color: 'var(--blue-primary)' }} />
            <h3 style={panelTitleStyle}>Live Message Queue</h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
            {deliveryQueue.length === 0 ? (
              <div style={emptyQueueStyle}>
                Queue is empty. Launch a simulation to see pending items.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {deliveryQueue.map((item) => {
                  const isSelected = item.id === selectedQueueId;
                  const isWA = item.channel === 'WhatsApp';
                  const isEmail = item.channel === 'Email';
                  const isSMS = item.channel === 'SMS';

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedQueueId(item.id)}
                      style={{
                        ...queueRowStyle,
                        backgroundColor: isSelected ? 'var(--blue-light)' : '#ffffff',
                        border: isSelected ? '1px solid var(--blue-primary)' : '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{item.name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.1rem' }}>
                            {isWA && <MessageSquare size={10} />}
                            {isEmail && <Mail size={10} />}
                            {isSMS && <Send size={10} />}
                            <span>{item.channel} | {item.segment}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={statusBadgeStyle(item.status)}>{item.status}</span>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.timestamp}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Callback Simulator */}
        <div style={panelCardStyle} className="glass-panel">
          <div style={panelHeaderStyle}>
            <RefreshCw size={16} style={{ color: 'var(--blue-primary)' }} />
            <h3 style={panelTitleStyle}>Trigger Callback Events</h3>
          </div>

          {selectedQueueId ? (() => {
            const selectedItem = deliveryQueue.find(q => q.id === selectedQueueId);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={targetCustomerCardStyle}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-secondary)' }}>Selected Contact</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{selectedItem?.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Channel: <strong>{selectedItem?.channel}</strong> &nbsp;|&nbsp;
                    State: <strong>{selectedItem?.status}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <span style={labelStyle}>Click state to simulate locally:</span>
                  <button onClick={() => triggerCallbackEvent('Delivered')} disabled={selectedItem?.status === 'Delivered'} style={callbackBtnStyle('#10b981')}>
                    <CheckCircle2 size={12} /> Simulate Delivery Callback
                  </button>
                  <button onClick={() => triggerCallbackEvent('Opened')} disabled={selectedItem?.status === 'Opened'} style={callbackBtnStyle('var(--blue-primary)')}>
                    Simulate Opened (Read) Callback
                  </button>
                  <button onClick={() => triggerCallbackEvent('Clicked')} disabled={selectedItem?.status === 'Clicked'} style={callbackBtnStyle('#f59e0b')}>
                    Simulate Link Clicked Callback
                  </button>
                  <button onClick={() => triggerCallbackEvent('Purchased')} disabled={selectedItem?.status === 'Purchased'} style={callbackBtnStyle('#8b5cf6')}>
                    Simulate Purchase Conversion
                  </button>
                  <button onClick={() => triggerCallbackEvent('Failed')} disabled={selectedItem?.status === 'Failed'} style={callbackBtnStyle('#ef4444')}>
                    <AlertTriangle size={12} /> Simulate Delivery Failed
                  </button>
                </div>
              </div>
            );
          })() : (
            <div style={emptyQueueStyle}>
              Please select a message item from the queue to enable callback simulation.
            </div>
          )}
        </div>
      </div>

      {/* 4. Analytics & Funnel */}
      <div style={analyticsGridStyle}>
        <div style={metricsBoxStyle}>
          <div style={analyticsMetricCardStyle}><span style={metricLabelStyle}>Messages Sent</span><span style={analyticsMetricValStyle}>{metrics.sent}</span></div>
          <div style={analyticsMetricCardStyle}><span style={metricLabelStyle}>Delivered</span><span style={analyticsMetricValStyle}>{metrics.delivered}</span></div>
          <div style={analyticsMetricCardStyle}><span style={metricLabelStyle}>Opened / Read</span><span style={analyticsMetricValStyle}>{metrics.opened}</span></div>
          <div style={analyticsMetricCardStyle}><span style={metricLabelStyle}>Link Clicked</span><span style={analyticsMetricValStyle}>{metrics.clicked}</span></div>
          <div style={analyticsMetricCardStyle}><span style={metricLabelStyle}>Purchases</span><span style={{ ...analyticsMetricValStyle, color: 'var(--green-primary)' }}>{metrics.purchased}</span></div>
          <div style={analyticsMetricCardStyle}><span style={metricLabelStyle}>Failed</span><span style={{ ...analyticsMetricValStyle, color: '#ef4444' }}>{metrics.failed}</span></div>
        </div>

        <div style={panelCardStyle} className="glass-panel">
          <div style={panelHeaderStyle}>
            <BarChart3 size={16} style={{ color: 'var(--blue-primary)' }} />
            <h3 style={panelTitleStyle}>Simulation Conversion Funnel</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { label: 'Sent', pct: '100', color: 'var(--text-muted)' },
              { label: 'Delivered', pct: deliveryRate, color: 'var(--blue-primary)' },
              { label: 'Opened', pct: openRate, color: '#8b5cf6' },
              { label: 'Clicked', pct: clickRate, color: '#f59e0b' },
              { label: 'Purchased', pct: purchaseRate, color: 'var(--green-primary)' }
            ].map(({ label, pct, color }) => (
              <div key={label} style={funnelRowStyle}>
                <span style={funnelLabelStyle}>{label}</span>
                <div style={funnelTrackStyle}>
                  <div style={{ ...funnelProgressStyle, width: `${pct}%`, backgroundColor: color }} />
                </div>
                <span style={{ ...funnelPctStyle, color: label === 'Purchased' ? 'var(--green-primary)' : undefined }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Audit Logs & AI Observations */}
      <div style={auditGridStyle}>
        <div style={{ ...panelCardStyle, flex: 2 }} className="glass-panel">
          <div style={panelHeaderStyle}>
            <ShieldCheck size={16} style={{ color: 'var(--blue-primary)' }} />
            <h3 style={panelTitleStyle}>Callback Event Audit Logs</h3>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '250px' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={tableHeaderStyle}>Timestamp</th>
                  <th style={tableHeaderStyle}>Event Type</th>
                  <th style={tableHeaderStyle}>Customer</th>
                  <th style={tableHeaderStyle}>Channel</th>
                  <th style={tableHeaderStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ ...tableCellStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No events audited yet. Launch a simulation or trigger callbacks.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log, idx) => (
                    <tr key={idx} style={tableRowStyle}>
                      <td style={{ ...tableCellStyle, color: 'var(--text-secondary)' }}>{log.time}</td>
                      <td style={tableCellStyle}><span style={eventTypeBadgeStyle(log.type)}>{log.type}</span></td>
                      <td style={{ ...tableCellStyle, fontWeight: 700 }}>{log.customer}</td>
                      <td style={tableCellStyle}>{log.channel}</td>
                      <td style={tableCellStyle}><span style={statusBadgeStyle(log.status)}>{log.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...panelCardStyle, flex: 1 }} className="glass-panel">
          <div style={panelHeaderStyle}>
            <Sparkles size={16} style={{ color: 'var(--blue-primary)' }} />
            <h3 style={panelTitleStyle}>AI Observations</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={observationCardStyle}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--green-primary)' }}>WhatsApp Efficiency</div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                WhatsApp shows a <strong>+35%</strong> higher conversion efficiency than standard SMS formats.
              </p>
            </div>
            <div style={observationCardStyle}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--blue-primary)' }}>Trigger Status</div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                Campaign re-engagement callbacks are running with average response time of <strong>140ms</strong>. Performance is trending upward.
              </p>
            </div>
            <div style={observationCardStyle}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#8b5cf6' }}>CTR Benchmarking</div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                The click-through conversion rate of SMS and RCS channels currently <strong>exceeds the benchmark</strong> by 4.2%.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
// Styling components
const testingBadgeStyle = {
  backgroundColor: '#fef3c7',
  color: '#b45309',
  fontSize: '0.65rem',
  fontWeight: 700,
  padding: '0.15rem 0.4rem',
  borderRadius: '4px',
  border: '1px solid #fde68a'
};

const isolationBadgeStyle = {
  backgroundColor: '#f0fdf4',
  color: '#16a34a',
  fontSize: '0.68rem',
  fontWeight: 700,
  padding: '0.2rem 0.55rem',
  borderRadius: '999px',
  border: '1px solid #bbf7d0',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem'
};

const clearBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  backgroundColor: '#fff1f2',
  color: '#e11d48',
  border: '1px solid #fecdd3',
  borderRadius: '6px',
  padding: '0.25rem 0.65rem',
  fontSize: '0.72rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.15s ease'
};

/* Pipeline visualization flowchart */
const pipelineContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  maxWidth: '900px',
  justifyContent: 'space-between',
  padding: '1.5rem 0'
};

const pipelineNodeStyle = (active) => ({
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: active ? 'var(--blue-light)' : '#ffffff',
  border: `2px solid ${active ? 'var(--blue-primary)' : '#cbd5e1'}`,
  boxShadow: active ? '0 0 16px var(--blue-glow)' : 'var(--shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  transition: 'all 0.3s ease',
  zIndex: 10
});

const nodeLabelStyle = {
  position: 'absolute',
  bottom: '-24px',
  fontSize: '0.68rem',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  color: 'var(--text-secondary)'
};

const pipelineConnectorStyle = (active) => ({
  flex: 1,
  height: '4px',
  backgroundColor: active ? 'var(--blue-primary)' : '#e2e8f0',
  boxShadow: active ? '0 0 8px var(--blue-glow)' : 'none',
  transition: 'background-color 0.3s ease',
  position: 'relative',
  margin: '0 -2px',
  zIndex: 1
});

const workspaceGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '1.5rem'
};

const panelCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box'
};

const panelHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.75rem',
  marginBottom: '1.25rem'
};

const panelTitleStyle = {
  fontSize: '0.9rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-family-title)'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.85rem'
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem'
};

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase'
};

const inputStyle = {
  padding: '0.55rem 0.75rem',
  fontSize: '0.8rem',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  boxSizing: 'border-box'
};

const launchBtnStyle = {
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c',
  border: 'none',
  padding: '0.6rem 1rem',
  borderRadius: '6px',
  fontWeight: 700,
  fontSize: '0.82rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
  cursor: 'pointer',
  marginTop: '0.5rem',
  boxShadow: '0 4px 12px var(--gold-glow)'
};

/* Previews */
const whatsappPreviewStyle = {
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  overflow: 'hidden'
};

const whatsappPreviewHeaderStyle = {
  backgroundColor: '#1f2c34',
  color: '#e9edef',
  padding: '0.4rem 0.7rem',
  fontSize: '0.68rem',
  fontWeight: 700,
  borderBottom: '1px solid rgba(255,255,255,0.06)'
};

const whatsappPreviewBodyStyle = {
  backgroundColor: '#0b141a',
  padding: '0.75rem'
};

const whatsappBubbleStyle = {
  backgroundColor: '#005c4b',
  borderRadius: '0 8px 8px 8px',
  padding: '0.6rem 0.75rem',
  maxWidth: '90%',
  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
  fontSize: '0.72rem',
  color: '#e9edef',
  lineHeight: 1.45
};

const whatsappPreviewFooterStyle = {
  textAlign: 'right',
  fontSize: '0.55rem',
  color: '#8696a0',
  marginTop: '0.3rem'
};

const emailPreviewStyle = {
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  backgroundColor: 'var(--bg-card)',
  overflow: 'hidden'
};

const emailPreviewHeaderStyle = {
  backgroundColor: 'var(--bg-secondary)',
  borderBottom: '1px solid var(--border-color)',
  padding: '0.4rem 0.6rem',
  fontSize: '0.7rem'
};

const emailPreviewBodyStyle = {
  padding: '0.75rem',
  fontSize: '0.7rem',
  color: 'var(--text-secondary)'
};

const emailBtnStyle = {
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c',
  textDecoration: 'none',
  padding: '0.4rem 0.8rem',
  borderRadius: '4px',
  fontSize: '0.68rem',
  fontWeight: 700,
  display: 'inline-block'
};

const smsPreviewStyle = {
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  backgroundColor: 'var(--bg-secondary)',
  padding: '0.6rem'
};

const smsPreviewBodyStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '0.5rem 0.75rem',
  fontSize: '0.7rem',
  color: 'var(--text-primary)',
  maxWidth: '90%'
};

const rcsPreviewStyle = {
  display: 'flex',
  justifyContent: 'center'
};

const rcsCardStyle = {
  width: '180px',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  backgroundColor: 'var(--bg-card)',
  padding: '0.6rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  boxShadow: 'var(--shadow-sm)'
};

const rcsBtnStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  padding: '0.25rem 0.75rem',
  fontSize: '0.62rem',
  fontWeight: 700,
  cursor: 'default',
  width: '100%',
  color: 'var(--gold-primary)'
};

/* Queue panel */
const emptyQueueStyle = {
  padding: '3rem 1rem',
  color: 'var(--text-muted)',
  fontSize: '0.75rem',
  textAlign: 'center'
};

const queueRowStyle = {
  padding: '0.65rem 0.75rem',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box'
};

/* Webhook Trigger Buttons */
const targetCustomerCardStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '0.75rem'
};

const callbackBtnStyle = (color) => ({
  width: '100%',
  border: 'none',
  padding: '0.55rem 0.75rem',
  borderRadius: '6px',
  backgroundColor: 'var(--bg-card)',
  color: color,
  border: `1px solid ${color}35`,
  fontWeight: 700,
  fontSize: '0.72rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
  transition: 'all 0.15s ease'
});

/* Real-Time Analytics metric elements */
const analyticsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '1.5rem',
  alignItems: 'start'
};

const metricsBoxStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: '0.75rem'
};

const analyticsMetricCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-md)',
  padding: '1rem',
  boxShadow: 'var(--shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const analyticsMetricValStyle = {
  fontSize: '1.6rem',
  fontWeight: 800,
  fontFamily: 'var(--font-family-title)',
  color: 'var(--text-primary)'
};

const metricLabelStyle = {
  fontSize: '0.65rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase'
};

/* Funnel bars */
const funnelRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem'
};

const funnelLabelStyle = {
  width: '70px',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-secondary)'
};

const funnelTrackStyle = {
  flex: 1,
  height: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  borderRadius: '4px',
  overflow: 'hidden'
};

const funnelProgressStyle = {
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.5s ease'
};

const funnelPctStyle = {
  width: '35px',
  fontSize: '0.72rem',
  fontWeight: 700,
  textAlign: 'right'
};

/* Observation & Logs bottom row */
const auditGridStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.5rem'
};

const observationCardStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '0.75rem'
};

/* Tables */
const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '0.75rem',
  marginTop: '0.5rem'
};

const tableHeaderRowStyle = {
  borderBottom: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-secondary)'
};

const tableHeaderStyle = {
  padding: '0.55rem 0.65rem',
  fontWeight: 700,
  color: 'var(--text-secondary)'
};

const tableRowStyle = {
  borderBottom: '1px solid var(--border-color)'
};

const tableCellStyle = {
  padding: '0.55rem 0.65rem',
  color: 'var(--text-primary)',
  verticalAlign: 'middle'
};

const eventTypeBadgeStyle = (type) => {
  const isLaunch = type === 'campaign_launched';
  return {
    fontSize: '0.62rem',
    fontWeight: 700,
    padding: '0.1rem 0.35rem',
    borderRadius: '4px',
    backgroundColor: isLaunch ? 'rgba(212, 175, 55, 0.15)' : 'rgba(124, 58, 237, 0.15)',
    color: isLaunch ? 'var(--gold-primary)' : '#c084fc',
    border: `1px solid ${isLaunch ? 'rgba(212, 175, 55, 0.3)' : 'rgba(124, 58, 237, 0.3)'}`,
    display: 'inline-block'
  };
};

const statusBadgeStyle = (status) => {
  const isQueued = status === 'Queued';
  const isSent = status === 'Sent';
  const isDelivered = status === 'Delivered';
  const isOpened = status === 'Opened';
  const isClicked = status === 'Clicked';
  const isPurchased = status === 'Purchased';
  const isFailed = status === 'Failed';

  let bg = 'var(--bg-secondary)';
  let color = 'var(--text-secondary)';
  if (isSent) { bg = 'rgba(59, 130, 246, 0.15)'; color = '#60a5fa'; }
  else if (isDelivered) { bg = 'rgba(16, 185, 129, 0.15)'; color = '#34d399'; }
  else if (isOpened) { bg = 'rgba(147, 51, 234, 0.15)'; color = '#c084fc'; }
  else if (isClicked) { bg = 'rgba(245, 158, 11, 0.15)'; color = '#fbbf24'; }
  else if (isPurchased) { bg = 'rgba(16, 185, 129, 0.15)'; color = '#34d399'; }
  else if (isFailed) { bg = 'rgba(239, 68, 68, 0.15)'; color = '#f87171'; }

  return {
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '0.15rem 0.35rem',
    borderRadius: '4px',
    backgroundColor: bg,
    color: color,
    display: 'inline-block'
  };
};

/* Toast styles */
const toastContainerStyle = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  zIndex: 10000,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const toastStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
  borderRadius: '8px',
  padding: '0.6rem 1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  minWidth: '220px',
  color: 'var(--text-primary)'
};
