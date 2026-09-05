import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Percent, DollarSign, AlertCircle, Sparkles, Smile, User, 
  ThumbsUp, ThumbsDown, Check, X, Phone, MoreVertical, ShieldCheck,
  TrendingUp, RefreshCw, Lock, MessageSquare, Info
} from 'lucide-react';
import { useCrm } from './CrmContext';
import crmApi from '../../api/crmApi';

const stripBackendTags = (text) => {
  if (!text) return '';
  return text.replace(/\{{1,2}[A-Z0-9_]+(?:=[A-Z0-9_]+|\d+)?\}{1,2}/ig, '').trim();
};

export default function CrmCartNegotiator() {
  const { customers, orders, negotiatorState, setNegotiatorState } = useCrm();
  const {
    selectedCustomerId,
    negotiationId,
    customerName,
    phoneNumber,
    productName,
    productCategory,
    originalPrice,
    marginFloorPrice,
    maxDiscountPercent,
    strategy,
    negotiationActive,
    messages,
    inputText,
    turns,
    currentOffer,
    status,
    probability,
    logs,
    insights,
    hasFreeShipping
  } = negotiatorState;

  const setSelectedCustomerId = (val) => setNegotiatorState(prev => ({ ...prev, selectedCustomerId: val }));
  const setNegotiationId = (val) => setNegotiatorState(prev => ({ ...prev, negotiationId: val }));
  const setCustomerName = (val) => setNegotiatorState(prev => ({ ...prev, customerName: val }));
  const setPhoneNumber = (val) => setNegotiatorState(prev => ({ ...prev, phoneNumber: val }));
  const setProductName = (val) => setNegotiatorState(prev => ({ ...prev, productName: val }));
  const setProductCategory = (val) => setNegotiatorState(prev => ({ ...prev, productCategory: val }));
  const setOriginalPrice = (val) => setNegotiatorState(prev => ({ ...prev, originalPrice: val }));
  const setMarginFloorPrice = (val) => setNegotiatorState(prev => ({ ...prev, marginFloorPrice: val }));
  const setMaxDiscountPercent = (val) => setNegotiatorState(prev => ({ ...prev, maxDiscountPercent: val }));
  const setStrategy = (val) => setNegotiatorState(prev => ({ ...prev, strategy: val }));
  const setNegotiationActive = (val) => setNegotiatorState(prev => ({ ...prev, negotiationActive: val }));
  const setMessages = (val) => setNegotiatorState(prev => ({ ...prev, messages: typeof val === 'function' ? val(prev.messages) : val }));
  const setInputText = (val) => setNegotiatorState(prev => ({ ...prev, inputText: val }));
  const setTurns = (val) => setNegotiatorState(prev => ({ ...prev, turns: typeof val === 'function' ? val(prev.turns) : val }));
  const setCurrentOffer = (val) => setNegotiatorState(prev => ({ ...prev, currentOffer: typeof val === 'function' ? val(prev.currentOffer) : val }));
  const setStatus = (val) => setNegotiatorState(prev => ({ ...prev, status: val }));
  const setProbability = (val) => setNegotiatorState(prev => ({ ...prev, probability: typeof val === 'function' ? val(prev.probability) : val }));
  const setLogs = (val) => setNegotiatorState(prev => ({ ...prev, logs: typeof val === 'function' ? val(prev.logs) : val }));
  const setInsights = (val) => setNegotiatorState(prev => ({ ...prev, insights: typeof val === 'function' ? val(prev.insights) : val }));
  const setHasFreeShipping = (val) => setNegotiatorState(prev => ({ ...prev, hasFreeShipping: val }));

  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);
  const prevCustomerIdRef = useRef(selectedCustomerId);

  useEffect(() => {
    if (customers && customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (selectedCustomerId && String(selectedCustomerId) !== String(prevCustomerIdRef.current)) {
      prevCustomerIdRef.current = selectedCustomerId;
      const cust = customers.find(c => String(c.id) === String(selectedCustomerId));
      if (cust) {
        // Reset negotiation state when switching target customers
        setNegotiationActive(false);
        setStatus('Active');
        setMessages([]);
        setLogs([]);
        setInsights([]);
        
        setCustomerName(cust.name);
        setPhoneNumber(cust.phone || '+91 98765 43210');

        // Look up orders for this customer to auto-fill product details
        const customerOrders = orders.filter(o => String(o.customerId) === String(cust.id));
        if (customerOrders.length > 0) {
          const latestOrder = customerOrders[customerOrders.length - 1];
          setProductName(latestOrder.productName || 'Nike Air Max 90');
          setProductCategory(latestOrder.productCategory || latestOrder.category || 'Footwear');
          const value = Number(latestOrder.orderValue || 9999);
          setOriginalPrice(value);
          setMarginFloorPrice(Math.round(value * 0.7)); // 70% floor
        } else {
          setProductName('Nike Air Max 90');
          setProductCategory('Footwear');
          setOriginalPrice(9999);
          setMarginFloorPrice(6999);
        }
      }
    } else if (selectedCustomerId && !prevCustomerIdRef.current) {
      prevCustomerIdRef.current = selectedCustomerId;
    }
  }, [selectedCustomerId, customers, orders]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Compute values
  const maxDiscountValue = Math.floor(originalPrice * (maxDiscountPercent / 100));
  const absoluteFloorPrice = Math.max(marginFloorPrice, originalPrice - maxDiscountValue);
  const discountGiven = originalPrice - currentOffer;
  const discountPercent = ((discountGiven / originalPrice) * 100).toFixed(0);
  const marginSaved = currentOffer - marginFloorPrice;

  // Initialize negotiation
  const startNegotiation = async (e) => {
    e.preventDefault();
    if (Number(marginFloorPrice) >= Number(originalPrice)) {
      alert("Margin Floor Price must be lower than Original Price!");
      return;
    }

    let custId = Number(selectedCustomerId);
    if (!custId && customers.length > 0) {
      custId = customers[0].id;
      setSelectedCustomerId(customers[0].id);
    } else if (!custId) {
      alert("Please select a target customer. Seed the database first if empty.");
      return;
    }

    try {
      setStatus('Negotiating');
      setNegotiationActive(true);

      // Call API to start negotiation on the backend
      const response = await crmApi.startNegotiation({
        customer_id: custId,
        product_name: productName,
        original_price: Number(originalPrice),
        margin_floor: Number(marginFloorPrice),
        max_discount: Number(maxDiscountPercent),
        strategy: strategy
      });

      setNegotiationId(response.id);
      
      const initOffer = response.current_offer || Math.floor(originalPrice * 0.95);
      setCurrentOffer(initOffer);
      setTurns(0);
      setProbability(strategy === 'Aggressive' ? 55 : (strategy === 'Balanced' ? 45 : 35));
      setHasFreeShipping(false);

      const initTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Initial greeting message from AI
      const initialMsg = {
        id: 'msg-0',
        speaker: 'AI Agent',
        text: `Hi ${customerName}! I noticed you left the ${productName} in your cart. 🛍️ I can offer an initial discount reducing it to ₹${initOffer.toLocaleString()} if you'd like to complete your purchase today!`,
        time: initTime,
        offerValue: initOffer
      };

      setMessages([initialMsg]);
      setInputText('');
      setLogs([
        {
          time: new Date().toLocaleTimeString(),
          speaker: 'System',
          message: `Abandoned cart event generated for ${customerName} (ID: ${custId}). Product: ${productName}.`,
          offerValue: originalPrice,
          action: 'Event Triggered'
        },
        {
          time: new Date().toLocaleTimeString(),
          speaker: 'AI Agent',
          message: `Initial greeting sent. Offered 5% discount (₹${initOffer}).`,
          offerValue: initOffer,
          action: 'Calculate Offer'
        }
      ]);

      setInsights([
        { type: 'info', text: 'Checkout flow abandoned 15 mins ago.' },
        { type: 'strategy', text: `AI Strategy set to ${strategy}. Target floor price is ₹${absoluteFloorPrice.toLocaleString()}.` }
      ]);
    } catch (error) {
      console.error("Failed to start negotiation on backend:", error);
      const errorMessage = error.response?.data?.detail || "Failed to start negotiation session on backend. Make sure database is seeded.";
      alert(errorMessage);
      setStatus('Active');
      setNegotiationActive(false);
    }
  };

  // Run AI negotiation logic
  const handleCustomerMessage = async (textToSend) => {
    if (!textToSend.trim() || status === 'Deal Accepted' || status === 'Deal Lost' || !negotiationId) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `msg-user-${Date.now()}`,
      speaker: 'Customer',
      text: textToSend,
      time: userTime,
      offerValue: currentOffer
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setTurns(prev => prev + 1);

    setLogs(prev => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        speaker: 'Customer',
        message: textToSend,
        offerValue: currentOffer,
        action: 'Customer Reply'
      }
    ]);

    // Show AI typing indicator
    setIsTyping(true);

    const lowercaseMsg = textToSend.toLowerCase();
    const numberMatches = lowercaseMsg.match(/\d+/g);
    let proposedOffer = currentOffer;
    if (numberMatches) {
      const candidates = numberMatches.map(Number).filter(n => n > 100 && n < originalPrice);
      if (candidates.length > 0) {
        proposedOffer = candidates[0];
      }
    }

    try {
      const response = await crmApi.sendNegotiationMessage(negotiationId, textToSend, proposedOffer, strategy);
      setIsTyping(false);
      
      const { negotiation, reply, current_offer, status: apiStatus } = response;
      const agentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      let nextOffer = currentOffer;
      // Prefer root-level current_offer from backend, fallback to nested model
      const latestOffer = (current_offer !== undefined && current_offer !== null) 
        ? current_offer 
        : (negotiation && negotiation.current_offer !== null && negotiation.current_offer !== undefined ? negotiation.current_offer : nextOffer);
      
      nextOffer = latestOffer;
      const currentStatus = apiStatus || (negotiation ? negotiation.status : 'active');
      const negotiatedPrice = negotiation ? negotiation.negotiated_price : null;
      
      // Hardened Frontend Safety: Ensure Deal Accepted state is set ONLY when the backend returns status === 'accepted'
      if (currentStatus === 'accepted') {
        const finalPrice = negotiatedPrice || latestOffer || proposedOffer;
        setCurrentOffer(finalPrice);
        setStatus('Deal Accepted');
        setProbability(100);
        nextOffer = finalPrice;
      } else if (currentStatus === 'lost') {
        setStatus('Deal Lost');
        setProbability(0);
      } else {
        setCurrentOffer(nextOffer);
        setStatus('Negotiating');
        setProbability(prev => Math.min(95, prev + 5));
      }

      const agentMsg = {
        id: `msg-agent-${Date.now()}`,
        speaker: 'AI Agent',
        text: reply,
        time: agentTime,
        offerValue: nextOffer
      };

      setMessages(prev => [...prev, agentMsg]);

      setLogs(prev => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          speaker: 'AI Agent',
          message: reply,
          offerValue: nextOffer,
          action: currentStatus === 'accepted' ? 'Deal Accepted' : 'Counter Offered'
        }
      ]);

      if (currentStatus === 'accepted') {
        const finalPrice = negotiatedPrice || latestOffer || proposedOffer;
        setInsights(prev => [
          ...prev,
          { type: 'success', text: `Revenue recovered: ₹${finalPrice.toLocaleString()}!` }
        ]);
      } else if (currentStatus === 'lost') {
        setInsights(prev => [
          ...prev,
          { type: 'error', text: 'Abandoned cart marked as unrecoverable.' }
        ]);
      }
    } catch (error) {
      console.error("Failed to send negotiation message:", error);
      setIsTyping(false);
      const errorMessage = error.response?.data?.detail || "Failed to get agent response. Please check your backend.";
      alert(errorMessage);
    }
  };

  const stopNegotiation = async () => {
    if (!negotiationId) return;
    try {
      await crmApi.stopNegotiation(negotiationId);
      setStatus('Deal Lost');
      setProbability(0);
      setLogs(prev => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          speaker: 'System',
          message: 'Negotiation was stopped manually by user.',
          offerValue: currentOffer,
          action: 'Stopped'
        }
      ]);
      setInsights(prev => [
        ...prev,
        { type: 'error', text: 'Negotiation stopped by agent.' }
      ]);
    } catch (error) {
      console.error("Failed to stop negotiation:", error);
      alert("Failed to stop negotiation. Please check your backend.");
    }
  };

  // Calculate a dynamic reasonable customer counter-offer for the quick reply (e.g., 20% off rounded)
  const targetQuickReplyPrice = Math.max(Math.round((originalPrice * 0.8) / 100) * 100, marginFloorPrice);

  // Quick reply options for testing simulator
  const quickReplies = [
    "Amazon is offering it cheaper.",
    "Can you offer free shipping?",
    `Make it ₹${targetQuickReplyPrice.toLocaleString()} and we have a deal.`,
    "Okay, accept. Send me the checkout link!"
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }} className="gradient-bg">
      
      {/* 1. Page Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={aiBadgeStyle}>AI LAB</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Abandoned Cart Negotiator Lab
          </h1>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Test and optimize autonomous AI agent negotiation models to rescue lost checkouts under strict margin constraints.
        </p>
      </div>

      {/* 2. Main Workspace Layout */}
      <div style={workspaceGridStyle}>
        
        {/* Left Column: Negotiation Setup */}
        <div style={panelCardStyle} className="glass-panel">
          <div style={panelHeaderStyle}>
            <SlidersIcon size={16} style={{ color: 'var(--blue-primary)' }} />
            <h3 style={panelTitleStyle}>Cart Negotiation Setup</h3>
          </div>
          
          <form onSubmit={startNegotiation} style={formStyle}>
            <div style={{ ...formRowStyle, gridColumn: 'span 2', display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
              <div style={{ ...formGroupStyle, width: '100%' }}>
                <label style={labelStyle}>Target CRM Customer Profile (Required for DB Reference)</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  disabled={status === 'Negotiating'}
                  style={inputStyle}
                  required
                >
                  <option value="">-- Choose Existing CRM Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email || c.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={formRowStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Customer Name</label>
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  disabled={status === 'Negotiating'}
                  style={inputStyle}
                  required
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Customer Phone</label>
                <input 
                  type="text" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  disabled={status === 'Negotiating'}
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <div style={formRowStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Product Name</label>
                <input 
                  type="text" 
                  value={productName} 
                  onChange={(e) => setProductName(e.target.value)} 
                  disabled={status === 'Negotiating'}
                  style={inputStyle}
                  required
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Category</label>
                <select 
                  value={productCategory} 
                  onChange={(e) => setProductCategory(e.target.value)}
                  disabled={status === 'Negotiating'}
                  style={inputStyle}
                >
                  <option>Footwear</option>
                  <option>Apparel</option>
                  <option>Outerwear</option>
                  <option>Electronics</option>
                  <option>Accessories</option>
                </select>
              </div>
            </div>

            {/* Custom Interactive Product Image Mock */}
            <div style={imageUploadContainerStyle}>
              <span style={labelStyle}>Product Image Preview</span>
              <div style={imagePreviewBoxStyle}>
                <span style={{ fontSize: '2.5rem' }}>
                  {productCategory === 'Footwear' ? '👟' : 
                   productCategory === 'Apparel' ? '👕' :
                   productCategory === 'Outerwear' ? '🧥' :
                   productCategory === 'Electronics' ? '📱' : '🎒'}
                </span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{productName}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Category: {productCategory}</div>
                </div>
              </div>
            </div>

            <div style={formRowStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Original Price (₹)</label>
                <input 
                  type="number" 
                  value={originalPrice} 
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setOriginalPrice(val);
                    setCurrentOffer(val);
                  }}
                  disabled={status === 'Negotiating'}
                  style={inputStyle}
                  min="1"
                  required
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Margin Floor Price (₹)</label>
                <input 
                  type="number" 
                  value={marginFloorPrice} 
                  onChange={(e) => setMarginFloorPrice(Number(e.target.value))} 
                  disabled={status === 'Negotiating'}
                  style={inputStyle}
                  min="1"
                  required
                />
              </div>
            </div>

            <div style={formRowStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Max Discount (%)</label>
                <input 
                  type="number" 
                  value={maxDiscountPercent} 
                  onChange={(e) => setMaxDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))} 
                  disabled={status === 'Negotiating'}
                  style={inputStyle}
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>AI Agent Strategy</label>
                <select 
                  value={strategy} 
                  onChange={(e) => setStrategy(e.target.value)}
                  disabled={status === 'Negotiating'}
                  style={inputStyle}
                >
                  <option>Conservative</option>
                  <option>Balanced</option>
                  <option>Aggressive</option>
                </select>
              </div>
            </div>

            <div style={infoBannerStyle}>
              <Info size={14} style={{ color: 'var(--blue-primary)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                <strong>Absolute Price Floor: ₹{absoluteFloorPrice.toLocaleString()}</strong> (based on {maxDiscountPercent}% discount limit & ₹{marginFloorPrice.toLocaleString()} cost floor). The AI will never offer a lower price.
              </div>
            </div>

            <button 
              type="submit" 
              style={{
                ...startBtnStyle,
                backgroundColor: status === 'Negotiating' ? 'var(--text-muted)' : 'var(--blue-primary)',
                cursor: status === 'Negotiating' ? 'not-allowed' : 'pointer'
              }}
              disabled={status === 'Negotiating'}
            >
              <Sparkles size={16} /> Start Negotiation
            </button>

            {status !== 'Negotiating' && negotiationActive && (
              <button 
                type="button" 
                onClick={() => {
                  setNegotiationActive(false);
                  setStatus('Active');
                  setMessages([]);
                  setLogs([]);
                  setInsights([]);
                }}
                style={resetBtnStyle}
              >
                Reset Setup
              </button>
            )}
          </form>
        </div>

        {/* Center Column: WhatsApp Mobile Simulator */}
        <div style={phoneMockupContainerStyle}>
          {/* External Phone Shell */}
          <div style={phoneShellStyle}>
            {/* Phone Screen Container */}
            <div style={phoneScreenStyle}>
              
              {/* WhatsApp Header */}
              <div style={phoneHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={avatarStyle}>
                    <User size={14} style={{ color: '#ffffff' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={phoneHeaderTitleStyle}>Payzor AI 🟡</span>
                    <span style={phoneHeaderSubStyle}>
                      {status === 'Deal Accepted' ? 'Deal Completed' : 
                       status === 'Deal Lost' ? 'Offline' : 'Online'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ffffff' }}>
                  <Phone size={14} style={{ cursor: 'pointer' }} />
                  <MoreVertical size={14} style={{ cursor: 'pointer' }} />
                </div>
              </div>

              {/* Chat Wallpaper Area */}
              <div style={chatAreaStyle}>
                
                {/* Secure Chat Header info */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <div style={lockNoticeStyle}>
                    <Lock size={9} /> Messages are secured using Payzor AI Sandbox.
                  </div>
                </div>

                {messages.length === 0 ? (
                  <div style={emptyChatStyle}>
                    <span style={{ fontSize: '3rem', filter: 'grayscale(0.4)' }}>💬</span>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>WhatsApp Mock Simulator</div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '180px', marginTop: '0.5rem' }}>
                      Configure the settings on the left and click <strong>"Start Negotiation"</strong> to initiate recovery.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {messages.map((m) => {
                      const isAI = m.speaker === 'AI Agent';
                      return (
                        <motion.div 
                          key={m.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                          style={{
                            alignSelf: isAI ? 'flex-start' : 'flex-end',
                            maxWidth: '85%'
                          }}
                        >
                          <div style={isAI ? aiBubbleStyle : customerBubbleStyle}>
                            <div style={{ fontSize: '0.78rem', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                              {stripBackendTags(m.text)}
                            </div>
                            <div style={bubbleMetaStyle}>
                              {m.time} {isAI ? null : <span style={{ color: '#53bdeb' }}>✓✓</span>}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {isTyping && (
                      <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.4rem', padding: '0.5rem 0.8rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div className="typing-dot" style={dotStyle(0)} />
                        <div className="typing-dot" style={dotStyle(0.15)} />
                        <div className="typing-dot" style={dotStyle(0.3)} />
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div style={chatInputBarStyle}>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomerMessage(inputText)}
                  placeholder="Type customer reply..."
                  disabled={!negotiationActive || status === 'Deal Accepted' || status === 'Deal Lost'}
                  style={phoneInputStyle}
                />
                <button 
                  onClick={() => handleCustomerMessage(inputText)}
                  disabled={!inputText.trim() || !negotiationActive || status === 'Deal Accepted' || status === 'Deal Lost'}
                  style={{
                    ...phoneSendBtnStyle,
                    backgroundColor: inputText.trim() && negotiationActive ? '#00a884' : '#b2e4d8',
                    cursor: inputText.trim() && negotiationActive ? 'pointer' : 'default'
                  }}
                >
                  <Send size={14} style={{ color: '#ffffff' }} />
                </button>
              </div>

            </div>
          </div>

          {/* Quick reply recommendations to ease manual evaluations */}
          {negotiationActive && status === 'Negotiating' && (
            <div style={quickRepliesContainerStyle}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Quick replies (click to send):</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                {quickReplies.map((qr, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleCustomerMessage(qr)}
                    style={quickReplyBtnStyle}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Negotiation Metrics & Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Analytics Card */}
          <div style={panelCardStyle} className="glass-panel">
            <div style={panelHeaderStyle}>
              <TrendingUp size={16} style={{ color: 'var(--green-primary)' }} />
              <h3 style={panelTitleStyle}>Negotiation Metrics</h3>
            </div>

            {/* Status indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Session Status</span>
              <span style={statusBadgeStyle(status)}>
                {status}
              </span>
            </div>

            {/* Metrics Grid */}
            <div style={metricsGridStyle}>
              <div style={metricItemCardStyle}>
                <span style={metricLabelStyle}>Original Price</span>
                <span style={metricValStyle}>₹{originalPrice.toLocaleString()}</span>
              </div>
              <div style={metricItemCardStyle}>
                <span style={metricLabelStyle}>Current Offer</span>
                <span style={{ ...metricValStyle, color: 'var(--blue-primary)' }}>₹{currentOffer.toLocaleString()}</span>
              </div>
              <div style={metricItemCardStyle}>
                <span style={metricLabelStyle}>Discount Given</span>
                <span style={{ ...metricValStyle, color: 'var(--green-primary)' }}>
                  {discountPercent}% <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-secondary)' }}>(₹{discountGiven.toLocaleString()})</span>
                </span>
              </div>
              <div style={metricItemCardStyle}>
                <span style={metricLabelStyle}>Turns Elapsed</span>
                <span style={metricValStyle}>{turns}</span>
              </div>
            </div>

            {/* Circular Progress Gauge */}
            <div style={gaugeContainerStyle}>
              <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="42" 
                    fill="none" 
                    stroke={status === 'Deal Accepted' ? 'var(--green-primary)' : (status === 'Deal Lost' ? '#ef4444' : 'var(--blue-primary)')} 
                    strokeWidth="8" 
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - probability / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div style={gaugeCenterTextStyle}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{probability}%</span>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recovery Prob</span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>Margin Saved Allocation</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  <span>Margin Floor: ₹{marginFloorPrice.toLocaleString()}</span>
                  <span style={{ fontWeight: 700, color: 'var(--green-primary)' }}>Saved: ₹{Math.max(0, marginSaved).toLocaleString()}</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      backgroundColor: 'var(--green-primary)', 
                      width: `${Math.min(100, Math.max(0, (marginSaved / (originalPrice - marginFloorPrice || 1)) * 100))}%`,
                      transition: 'width 0.4s ease'
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Quick Action Decisions (Accepted / Lost Buttons) */}
            {status === 'Negotiating' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button 
                  onClick={() => handleCustomerMessage("I accept this deal. Proceed with checkout.")}
                  style={{ ...actionBtnStyle, backgroundColor: 'var(--green-primary)', color: '#ffffff' }}
                >
                  <ThumbsUp size={12} /> Force Accept Deal
                </button>
                <button 
                  onClick={() => handleCustomerMessage("No thanks, I will look elsewhere.")}
                  style={{ ...actionBtnStyle, backgroundColor: '#ef4444', color: '#ffffff' }}
                >
                  <ThumbsDown size={12} /> Force Reject Deal
                </button>
                <button 
                  onClick={stopNegotiation}
                  style={{ ...actionBtnStyle, backgroundColor: '#64748b', color: '#ffffff' }}
                >
                  <X size={12} /> Stop Negotiation
                </button>
              </div>
            )}
          </div>

          {/* AI Insights panel */}
          <div style={panelCardStyle} className="glass-panel">
            <div style={panelHeaderStyle}>
              <Sparkles size={16} style={{ color: 'var(--blue-primary)' }} />
              <h3 style={panelTitleStyle}>AI Observations</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {insights.length === 0 ? (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                  No active insights. Start negotiation to trigger AI audit.
                </div>
              ) : (
                insights.map((ins, idx) => (
                  <div 
                    key={idx}
                    style={{
                      ...insightBadgeStyle,
                      borderLeft: `3px solid ${
                        ins.type === 'success' ? 'var(--green-primary)' : 
                        ins.type === 'warning' ? '#f59e0b' : 
                        ins.type === 'error' ? '#ef4444' : 'var(--blue-primary)'
                      }`
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)' }}>{ins.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 3. Negotiation Log Section (Full-Width Table) */}
      <div style={panelCardStyle} className="glass-panel">
        <div style={panelHeaderStyle}>
          <ShieldCheck size={16} style={{ color: 'var(--blue-primary)' }} />
          <h3 style={panelTitleStyle}>System Audit Trail & Negotiation Logs</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={tableHeaderStyle}>Time</th>
                <th style={tableHeaderStyle}>Speaker</th>
                <th style={tableHeaderStyle}>Event / Message</th>
                <th style={tableHeaderStyle}>Offer Value</th>
                <th style={tableHeaderStyle}>System Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ ...tableCellStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No audit records available. Start the simulator to populate logs.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={idx} style={tableRowStyle}>
                    <td style={{ ...tableCellStyle, width: '100px', color: 'var(--text-secondary)' }}>{log.time}</td>
                    <td style={{ ...tableCellStyle, width: '120px', fontWeight: 700 }}>
                      <span style={{
                        color: log.speaker === 'AI Agent' ? 'var(--blue-primary)' : 
                               log.speaker === 'Customer' ? 'var(--green-primary)' : 'var(--text-secondary)'
                      }}>
                        {log.speaker}
                      </span>
                    </td>
                    <td style={tableCellStyle}>{stripBackendTags(log.message)}</td>
                    <td style={{ ...tableCellStyle, width: '100px', fontWeight: 700 }}>
                      ₹{log.offerValue.toLocaleString()}
                    </td>
                    <td style={{ ...tableCellStyle, width: '180px' }}>
                      <span style={actionBadgeStyle(log.action)}>
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Local keyframe styling inject */}
      <style>{`
        @keyframes bounce-dots {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .typing-dot {
          animation: bounce-dots 0.8s infinite;
        }
      `}</style>

    </div>
  );
}

// Inline Icon fallback
function SlidersIcon({ size, style }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={style}
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="2" y1="14" x2="6" y2="14" />
      <line x1="10" y1="8" x2="14" y2="8" />
      <line x1="18" y1="16" x2="22" y2="16" />
    </svg>
  );
}

// Styling definitions
const aiBadgeStyle = {
  backgroundColor: 'var(--blue-light)',
  color: 'var(--blue-primary)',
  fontSize: '0.65rem',
  fontWeight: 700,
  padding: '0.15rem 0.4rem',
  borderRadius: '4px',
  border: '1px solid var(--blue-border)'
};

const workspaceGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '1.5rem',
  alignItems: 'start'
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
  gap: '1rem'
};

const formRowStyle = {
  display: 'flex',
  gap: '0.75rem'
};

const formGroupStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem'
};

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.02em'
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
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
};

const imageUploadContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  border: '1px dashed var(--border-color)',
  padding: '0.75rem',
  borderRadius: '8px',
  backgroundColor: 'var(--bg-secondary)'
};

const imagePreviewBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '0.25rem'
};

const infoBannerStyle = {
  display: 'flex',
  gap: '0.5rem',
  padding: '0.6rem 0.75rem',
  backgroundColor: 'rgba(212, 175, 55, 0.08)',
  border: '1px solid rgba(212, 175, 55, 0.25)',
  borderRadius: '6px'
};

const startBtnStyle = {
  color: '#0a0a0c',
  border: 'none',
  padding: '0.65rem 1rem',
  borderRadius: '6px',
  fontWeight: 700,
  fontSize: '0.82rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
  transition: 'background-color 0.2s',
  boxShadow: 'var(--shadow-sm)'
};

const resetBtnStyle = {
  backgroundColor: 'transparent',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  padding: '0.55rem 1rem',
  borderRadius: '6px',
  fontWeight: 500,
  fontSize: '0.8rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  textAlign: 'center'
};

/* WhatsApp Simulator Styling */
const phoneMockupContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%'
};

const phoneShellStyle = {
  width: '100%',
  maxWidth: '310px',
  height: '520px',
  backgroundColor: '#0a0a0c',
  borderRadius: '36px',
  padding: '10px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.8), 0 0 0 2px var(--border-color)',
  border: '3px solid #1e293b',
  position: 'relative',
  boxSizing: 'border-box'
};

const phoneScreenStyle = {
  width: '100%',
  height: '100%',
  backgroundColor: '#efeae2', // Typical WhatsApp beige
  borderRadius: '26px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  border: '1px solid #000000'
};

const phoneHeaderStyle = {
  backgroundColor: '#008069', // WhatsApp Green
  color: '#ffffff',
  padding: '0.6rem 0.8rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
  flexShrink: 0
};

const avatarStyle = {
  width: '26px',
  height: '26px',
  borderRadius: '50%',
  backgroundColor: '#94a3b8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const phoneHeaderTitleStyle = {
  fontSize: '0.82rem',
  fontWeight: 700,
  lineHeight: 1.1
};

const phoneHeaderSubStyle = {
  fontSize: '0.6rem',
  color: '#c2f0e3',
  fontWeight: 500
};

const chatAreaStyle = {
  flex: 1,
  padding: '0.75rem',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  backgroundColor: '#0b141a'
};

const lockNoticeStyle = {
  fontSize: '0.55rem',
  backgroundColor: 'rgba(212, 175, 55, 0.1)',
  color: 'var(--gold-champagne)',
  border: '1px solid rgba(212, 175, 55, 0.25)',
  padding: '0.25rem 0.5rem',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem'
};

const emptyChatStyle = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  color: 'var(--text-muted)'
};

const aiBubbleStyle = {
  backgroundColor: '#202c33',
  borderRadius: '0 8px 8px 8px',
  padding: '0.5rem 0.7rem',
  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
  color: '#e9edef',
  position: 'relative'
};

const customerBubbleStyle = {
  backgroundColor: '#005c4b',
  borderRadius: '8px 0 8px 8px',
  padding: '0.5rem 0.7rem',
  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
  color: '#e9edef',
  position: 'relative'
};

const bubbleMetaStyle = {
  fontSize: '0.55rem',
  color: '#8696a0',
  textAlign: 'right',
  marginTop: '0.2rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '0.15rem'
};

const dotStyle = (delay) => ({
  width: '6px',
  height: '6px',
  backgroundColor: '#8696a0',
  borderRadius: '50%',
  animationDelay: `${delay}s`
});

const chatInputBarStyle = {
  backgroundColor: '#202c33',
  padding: '0.45rem 0.6rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexShrink: 0,
  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
};

const phoneInputStyle = {
  flex: 1,
  backgroundColor: '#2a3942',
  border: 'none',
  borderRadius: '16px',
  padding: '0.4rem 0.8rem',
  fontSize: '0.78rem',
  outline: 'none',
  color: '#e9edef',
  fontFamily: 'inherit'
};

const phoneSendBtnStyle = {
  border: 'none',
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const quickRepliesContainerStyle = {
  marginTop: '0.75rem',
  width: '100%',
  maxWidth: '310px'
};

const quickReplyBtnStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '0.3rem 0.55rem',
  fontSize: '0.65rem',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  boxShadow: 'var(--shadow-xs)'
};

/* Metrics Panel Elements */
const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.65rem',
  marginBottom: '1rem'
};

const metricItemCardStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '0.65rem 0.75rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem'
};

const metricLabelStyle = {
  fontSize: '0.65rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase'
};

const metricValStyle = {
  fontSize: '0.95rem',
  fontWeight: 800,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-family-title)'
};

const gaugeContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginTop: '1rem',
  paddingTop: '1rem',
  borderTop: '1px solid var(--border-color)'
};

const gaugeCenterTextStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  lineHeight: 1
};

const actionBtnStyle = {
  flex: 1,
  border: 'none',
  padding: '0.45rem 0.6rem',
  borderRadius: '6px',
  fontSize: '0.72rem',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.3rem',
  cursor: 'pointer',
  boxShadow: 'var(--shadow-sm)'
};

const insightBadgeStyle = {
  padding: '0.5rem 0.75rem',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '6px',
  border: '1px solid var(--border-color)'
};

/* Log Table Styles */
const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '0.78rem',
  marginTop: '0.5rem'
};

const tableHeaderRowStyle = {
  borderBottom: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-secondary)'
};

const tableHeaderStyle = {
  padding: '0.6rem 0.75rem',
  fontWeight: 700,
  color: 'var(--text-secondary)'
};

const tableRowStyle = {
  borderBottom: '1px solid var(--border-color)',
  transition: 'background-color 0.15s'
};

const tableCellStyle = {
  padding: '0.65rem 0.75rem',
  color: 'var(--text-primary)',
  verticalAlign: 'middle'
};

const actionBadgeStyle = (action) => {
  const isGood = action.includes('Closed') || action.includes('Accepted');
  const isBad = action.includes('Abandoned') || action.includes('Floor') || action.includes('Firm');
  return {
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
    backgroundColor: isGood ? 'rgba(16, 185, 129, 0.15)' : (isBad ? 'rgba(245, 158, 11, 0.15)' : 'rgba(212, 175, 55, 0.15)'),
    color: isGood ? '#34d399' : (isBad ? '#fbbf24' : 'var(--gold-primary)'),
    border: `1px solid ${isGood ? 'rgba(16, 185, 129, 0.3)' : (isBad ? 'rgba(245, 158, 11, 0.3)' : 'rgba(212, 175, 55, 0.3)')}`,
    display: 'inline-block'
  };
};

const statusBadgeStyle = (status) => {
  const isAccepted = status === 'Deal Accepted';
  const isLost = status === 'Deal Lost';
  const isNegotiating = status === 'Negotiating';
  return {
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
    backgroundColor: isAccepted ? 'rgba(16, 185, 129, 0.15)' : (isLost ? 'rgba(239, 68, 68, 0.15)' : 'rgba(212, 175, 55, 0.15)'),
    color: isAccepted ? '#34d399' : (isLost ? '#f87171' : 'var(--gold-primary)'),
    border: `1px solid ${isAccepted ? 'rgba(16, 185, 129, 0.3)' : (isLost ? 'rgba(239, 68, 68, 0.3)' : 'rgba(212, 175, 55, 0.3)')}`
  };
};
