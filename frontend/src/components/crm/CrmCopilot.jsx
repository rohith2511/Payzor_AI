import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Send, User, Bot, AlertCircle, TrendingUp, Users, RefreshCw, 
  MessageSquare, Plus, Trash2, Square 
} from 'lucide-react';
import { useCrm } from './CrmContext';
import crmApi from '../../api/crmApi';

const SUGGESTIONS = [
  "Which customers have the highest revenue at risk?",
  "Why is revenue at risk increasing?",
  "Which overdue accounts should we recover first?",
  "How much revenue did we recover this month?",
  "Which recovery campaigns performed best?",
  "What is causing the highest-risk accounts?"
];

export default function CrmCopilot() {
  const { customers } = useCrm();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I am your Payzor AI Financial Copilot. Ask me anything about your B2B receivables, delinquent accounts, risk levels, or recovery strategies. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [hoveredConvId, setHoveredConvId] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const creditsRemaining = Math.max(0, 30 - usageCount);
  const isExhausted = creditsRemaining === 0;
  
  const chatEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load conversations history on mount
  useEffect(() => {
    loadConversations();
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const data = await crmApi.getAiUsage();
      setUsageCount(data.copilot || 0);
    } catch (e) {
      console.error("Failed to fetch AI usage:", e);
    }
  };

  const loadConversations = async () => {
    try {
      const list = await crmApi.getCopilotConversations();
      setConversations(list);

      // Restore last active conversation from cache
      const cachedId = localStorage.getItem('activeCopilotConversationId');
      if (cachedId) {
        const found = list.find(c => String(c.id) === String(cachedId));
        if (found) {
          setActiveConversationId(found.id);
          loadMessages(found.id);
          return;
        }
      }

      // If there is history, open the latest one
      if (list.length > 0) {
        setActiveConversationId(list[0].id);
        loadMessages(list[0].id);
      } else {
        // Default greeting for empty slate
        setActiveConversationId(null);
        setMessages([
          { role: 'assistant', text: "Hello! I am your Payzor AI Financial Copilot. Ask me anything about your B2B receivables, delinquent accounts, risk levels, or recovery strategies. How can I assist you today?" }
        ]);
      }
    } catch (err) {
      console.error("Failed to load Copilot conversations:", err);
    }
  };

  const loadMessages = async (convId) => {
    setChatLoading(true);
    try {
      const list = await crmApi.getCopilotMessages(convId);
      if (list.length > 0) {
        setMessages(list.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          text: m.message
        })));
      } else {
        setMessages([
          { role: 'assistant', text: "Start messaging to ask strategy guidelines, segments recommendations, or campaign insights." }
        ]);
      }
    } catch (err) {
      console.error("Failed to load conversation messages:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSelectConversation = (convId) => {
    setActiveConversationId(convId);
    localStorage.setItem('activeCopilotConversationId', convId);
    loadMessages(convId);
  };

  const handleNewChat = async () => {
    try {
      const newConv = await crmApi.createCopilotConversation("New Chat");
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      localStorage.setItem('activeCopilotConversationId', newConv.id);
      setMessages([
        { role: 'assistant', text: "Let's start a fresh discussion. Ask me anything about your campaigns or audience cohorts!" }
      ]);
      setInput('');
    } catch (err) {
      console.error("Failed to create new copilot conversation:", err);
      // Fallback local new chat state
      setActiveConversationId(null);
      localStorage.removeItem('activeCopilotConversationId');
      setMessages([
        { role: 'assistant', text: "Let's start a fresh discussion. Ask me anything about your campaigns or audience cohorts!" }
      ]);
      setInput('');
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;
    
    try {
      await crmApi.deleteCopilotConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      
      // If deleted active chat, reset or load next
      if (activeConversationId === convId) {
        localStorage.removeItem('activeCopilotConversationId');
        loadConversations();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const isCancelledRef = useRef(false);

  const handleAbort = () => {
    // Set the cancel flag FIRST so the catch block can detect it reliably
    isCancelledRef.current = true;

    // Abort the in-flight Axios request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Notify backend to discard the ongoing LLM call (fire and forget)
    if (activeConversationId) {
      crmApi.cancelCopilotQuery(activeConversationId).catch(() => {});
    }
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      role: 'user',
      text: query
    };

    // Reset cancel flag before starting
    isCancelledRef.current = false;

    // Optimistic UI update
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await crmApi.queryCopilot(query, activeConversationId, controller.signal);

      // If cancelled while the response was in-flight, show stopped message
      if (isCancelledRef.current) {
        setMessages(prev => [...prev, { role: 'assistant', text: 'Generation stopped by user.' }]);
        return;
      }

      const { response: reply, conversation_id, title } = response;

      // Update active ID and cache
      setActiveConversationId(conversation_id);
      localStorage.setItem('activeCopilotConversationId', conversation_id);

      // Refresh list to update title / updated_at
      const updatedList = await crmApi.getCopilotConversations();
      setConversations(updatedList);

      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: reply }
      ]);
    } catch (error) {
      // Check the reliable cancel flag first — don't rely on Axios error types
      if (isCancelledRef.current) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: 'Generation stopped by user.' }
        ]);
        // Refresh sidebar conversation list quietly
        crmApi.getCopilotConversations().then(setConversations).catch(() => {});
      } else {
        console.error('Failed to query Copilot:', error);
        const errorMessage = error.response?.data?.detail || 'I am sorry, I was unable to connect to the Copilot server. Please ensure the backend service is running.';
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: errorMessage
          }
        ]);
      }
    } finally {
      isCancelledRef.current = false;
      abortControllerRef.current = null;
      setLoading(false);
      fetchUsage();
    }
  };


  // Group conversations chronologically
  const groupedConversations = useMemo(() => {
    const groups = {
      today: [],
      yesterday: [],
      last7Days: [],
      older: []
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

    conversations.forEach(c => {
      const date = new Date(c.created_at || c.updated_at);
      if (date >= startOfToday) {
        groups.today.push(c);
      } else if (date >= startOfYesterday) {
        groups.yesterday.push(c);
      } else if (date >= startOf7DaysAgo) {
        groups.last7Days.push(c);
      } else {
        groups.older.push(c);
      }
    });

    return groups;
  }, [conversations]);

  // Pure React Custom Markdown Visualizer (Parses bullet points, headings, bolding, and markdown tables)
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let inTable = false;
    let tableRows = [];
    let tableHeaders = [];

    const flushList = (key) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${key}`} style={{ margin: '0.4rem 0 0.8rem 1.25rem', paddingLeft: 0, listStyleType: 'disc' }}>
            {listItems.map((li, idx) => (
              <li key={idx} style={{ marginBottom: '0.3rem', fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>{li}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const flushTable = (key) => {
      if (inTable) {
        elements.push(
          <div key={`table-container-${key}`} style={{ overflowX: 'auto', margin: '0.75rem 0 1.25rem 0', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              {tableHeaders.length > 0 && (
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    {tableHeaders.map((th, idx) => (
                      <th key={idx} style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--gold-primary)' }}>{th}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {tableRows.map((tr, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: rIdx === tableRows.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                    {tr.map((td, cIdx) => (
                      <td key={cIdx} style={{ padding: '0.5rem 0.8rem', color: 'var(--text-primary)' }}>{td}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        tableHeaders = [];
        inTable = false;
      }
    };

    const parseInline = (lineText) => {
      const parts = lineText.split('**');
      return parts.map((part, idx) => {
        if (idx % 2 === 1) {
          return <strong key={idx} style={{ fontWeight: 700, color: '#ffffff' }}>{part}</strong>;
        }
        return part;
      });
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 1. Table Parsing
      if (line.startsWith('|')) {
        flushList(i);
        const cols = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        const isSeparator = cols.every(c => c.match(/^-+$/) || c.startsWith(':') || c.endsWith(':'));
        if (isSeparator) {
          continue;
        }
        if (!inTable) {
          inTable = true;
          tableHeaders = cols.map(c => parseInline(c));
        } else {
          tableRows.push(cols.map(c => parseInline(c)));
        }
        continue;
      } else {
        flushTable(i);
      }

      // 2. Heading Parsing
      if (line.startsWith('###') || line.startsWith('##') || line.startsWith('#') || 
          line.startsWith('📊') || line.startsWith('👥') || line.startsWith('🚀') || line.startsWith('📈')) {
        flushList(i);
        let headingText = line;
        let headingStyle = { 
          fontSize: '0.92rem', 
          fontWeight: 800, 
          color: 'var(--gold-primary)', 
          margin: '1.25rem 0 0.5rem 0', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem', 
          fontFamily: 'var(--font-family-title)',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.25rem'
        };
        
        if (line.startsWith('###')) {
          headingText = line.substring(3).trim();
          headingStyle = { ...headingStyle, fontSize: '0.88rem' };
        } else if (line.startsWith('##')) {
          headingText = line.substring(2).trim();
          headingStyle = { ...headingStyle, fontSize: '0.95rem' };
        } else if (line.startsWith('#')) {
          headingText = line.substring(1).trim();
          headingStyle = { ...headingStyle, fontSize: '1.05rem' };
        }
        elements.push(
          <h4 key={`heading-${i}`} style={headingStyle}>
            {parseInline(headingText)}
          </h4>
        );
        continue;
      }

      // 3. Bullet List Parsing
      if (line.startsWith('*') || line.startsWith('-')) {
        const listText = line.substring(1).trim();
        listItems.push(parseInline(listText));
        continue;
      } else {
        flushList(i);
      }

      // 4. Regular Paragraphs
      if (line) {
        elements.push(
          <p key={`p-${i}`} style={{ margin: '0 0 0.6rem 0', fontSize: '0.85rem', lineHeight: '1.45', color: '#e5e7eb' }}>
            {parseInline(line)}
          </p>
        );
      }
    }

    flushList(lines.length);
    flushTable(lines.length);

    return elements;
  };

  return (
    <div style={containerStyle}>
      {/* LEFT CHAT HISTORY SIDEBAR */}
      <aside style={sidebarStyle}>
        <button onClick={handleNewChat} style={newChatButtonStyle}>
          <Plus size={14} /> New Chat
        </button>

        <div style={historyScrollContainerStyle}>
          {conversations.length === 0 ? (
            <div style={emptyHistoryTextStyle}>No conversations yet.</div>
          ) : (
            <>
              {/* Today */}
              {groupedConversations.today.length > 0 && (
                <div style={historyGroupStyle}>
                  <div style={historyGroupHeaderStyle}>Today</div>
                  {groupedConversations.today.map(conv => renderSidebarItem(conv))}
                </div>
              )}

              {/* Yesterday */}
              {groupedConversations.yesterday.length > 0 && (
                <div style={historyGroupStyle}>
                  <div style={historyGroupHeaderStyle}>Yesterday</div>
                  {groupedConversations.yesterday.map(conv => renderSidebarItem(conv))}
                </div>
              )}

              {/* Last 7 Days */}
              {groupedConversations.last7Days.length > 0 && (
                <div style={historyGroupStyle}>
                  <div style={historyGroupHeaderStyle}>Last 7 Days</div>
                  {groupedConversations.last7Days.map(conv => renderSidebarItem(conv))}
                </div>
              )}

              {/* Older */}
              {groupedConversations.older.length > 0 && (
                <div style={historyGroupStyle}>
                  <div style={historyGroupHeaderStyle}>Older</div>
                  {groupedConversations.older.map(conv => renderSidebarItem(conv))}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* RIGHT CHAT INTERFACE WORKSPACE */}
      <div style={chatContainerStyle}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              AI Marketing Copilot
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Ask strategy queries, generate segments copy, and forecast campaign lifts.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isExhausted ? 'var(--red-primary)' : 'var(--text-primary)' }}>
                Credits Remaining: {creditsRemaining}/30
              </div>
              {isExhausted && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Available again in 2 hours.
                </div>
              )}
            </div>
            <div style={premiumBadgeStyle}>
              <Sparkles size={13} /> Enterprise Plan
            </div>
          </div>
        </div>

        {/* Chat box container */}
        <div style={chatBoxContainerStyle}>
          {chatLoading ? (
            <div style={loadingOverlayStyle}>
              <RefreshCw size={24} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite', color: 'var(--blue-primary)' }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Loading message history...</span>
            </div>
          ) : (
            <div style={messageListStyle}>
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  style={{
                    ...messageWrapperStyle,
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '85%', alignItems: 'flex-start' }}>
                    {m.role === 'assistant' && (
                      <div style={botAvatarStyle}><Bot size={14} /></div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                      {/* Render markdown / styled bubble */}
                      <div style={{
                        ...chatBubbleStyle,
                        backgroundColor: m.role === 'user' ? 'var(--gold-primary)' : 'var(--bg-secondary)',
                        color: m.role === 'user' ? '#0a0a0c' : 'var(--text-primary)',
                        fontWeight: m.role === 'user' ? 600 : 'normal',
                        borderRadius: m.role === 'user' ? '12px 12px 0 12px' : '0 12px 12px 12px',
                        border: m.role === 'user' ? 'none' : '1px solid var(--border-color)',
                        boxShadow: m.role === 'user' ? '0 2px 10px var(--gold-glow)' : '0 2px 10px rgba(0,0,0,0.3)'
                      }}>
                        {m.role === 'user' ? m.text : renderMarkdown(m.text)}
                      </div>
                    </div>

                    {m.role === 'user' && (
                      <div style={userAvatarStyle}><User size={14} /></div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={messageWrapperStyle}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={botAvatarStyle}><Bot size={14} /></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', flexShrink: 0, color: 'var(--gold-primary)' }} />
                      <span style={{ color: 'var(--text-primary)' }}>Generating response with Gemini AI...</span>
                      <button
                        onClick={handleAbort}
                        title="Stop generation"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backgroundColor: 'rgba(225, 29, 72, 0.15)',
                          color: '#f43f5e',
                          border: '1px solid rgba(225, 29, 72, 0.4)',
                          borderRadius: '6px',
                          padding: '0.25rem 0.6rem',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s ease',
                          flexShrink: 0
                        }}
                      >
                        <Square size={10} fill="#f43f5e" /> Stop
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Suggested presets */}
          {messages.length <= 1 && !chatLoading && (
            <div style={{ padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', flexShrink: 0 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Suggested Queries</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {SUGGESTIONS.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(s)}
                    style={presetButtonStyle}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div style={inputContainerStyle}>
            <input 
              type="text" 
              placeholder={isExhausted ? "You can use this module again after 2 hours." : (loading ? "AI is generating a response..." : "Ask AI Copilot... (e.g. How do I improve open rates?)")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !loading && !isExhausted) handleSend(); }}
              style={inputStyle}
              disabled={chatLoading || isExhausted}
            />
            {loading ? (
              <button
                onClick={handleAbort}
                title="Stop generation"
                style={stopButtonStyle}
              >
                <Square size={13} fill="#ffffff" />
              </button>
            ) : (
              <button 
                onClick={() => handleSend()}
                style={sendButtonStyle}
                disabled={chatLoading || isExhausted}
              >
                <Send size={14} />
              </button>
            )}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  function renderSidebarItem(conv) {
    const isActive = activeConversationId === conv.id;
    const isHovered = hoveredConvId === conv.id;

    return (
      <div 
        key={conv.id} 
        onMouseEnter={() => setHoveredConvId(conv.id)}
        onMouseLeave={() => setHoveredConvId(null)}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}
      >
        <button 
          onClick={() => handleSelectConversation(conv.id)}
          style={{
            ...convButtonStyle,
            backgroundColor: isActive ? '#f1f5f9' : 'transparent',
            color: isActive ? 'var(--blue-primary)' : 'var(--text-secondary)',
            fontWeight: isActive ? 600 : 500,
            paddingRight: isHovered ? '2.25rem' : '0.75rem' // make room for delete trash icon
          }}
        >
          <MessageSquare size={13} style={{ flexShrink: 0 }} />
          <span style={convTitleStyle}>{conv.title}</span>
        </button>
        {isHovered && (
          <button 
            onClick={(e) => handleDeleteConversation(conv.id, e)}
            style={deleteConvButtonStyle}
            title="Delete Chat"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    );
  }
}

// Styling elements
const containerStyle = {
  display: 'flex',
  height: 'calc(100vh - 64px)', // Deduct header height
  boxSizing: 'border-box',
  overflow: 'hidden'
};

const sidebarStyle = {
  width: '260px',
  backgroundColor: 'var(--bg-card)',
  borderRight: '1px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  padding: '1.25rem',
  boxSizing: 'border-box',
  flexShrink: 0,
  height: '100%',
  gap: '1rem'
};

const newChatButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
  padding: '0.65rem',
  fontSize: '0.82rem',
  fontWeight: 600,
  backgroundColor: 'var(--bg-secondary)',
  border: '1px dashed var(--border-color)',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  color: 'var(--gold-primary)',
  width: '100%'
};

const historyScrollContainerStyle = {
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  marginTop: '0.5rem'
};

const historyGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem'
};

const historyGroupHeaderStyle = {
  fontSize: '0.68rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: '0.04em',
  padding: '0.25rem 0.5rem',
  marginBottom: '0.2rem'
};

const convButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.55rem 0.75rem',
  fontSize: '0.82rem',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  fontFamily: 'inherit',
  width: '100%',
  textAlign: 'left',
  boxSizing: 'border-box',
  overflow: 'hidden'
};

const convTitleStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%'
};

const deleteConvButtonStyle = {
  position: 'absolute',
  right: '6px',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '0.25rem',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
};

const emptyHistoryTextStyle = {
  fontSize: '0.78rem',
  color: 'var(--text-muted)',
  textAlign: 'center',
  marginTop: '2rem'
};

const chatContainerStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
  padding: '2rem',
  boxSizing: 'border-box',
  backgroundColor: 'var(--bg-primary)'
};

const premiumBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
  backgroundColor: 'rgba(212, 175, 55, 0.15)',
  color: 'var(--gold-primary)',
  fontSize: '0.72rem',
  fontWeight: 700,
  padding: '0.35rem 0.65rem',
  borderRadius: '999px',
  border: '1px solid rgba(212, 175, 55, 0.3)'
};

const chatBoxContainerStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-lg)',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'hidden',
  boxShadow: 'var(--shadow-sm)'
};

const loadingOverlayStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  backgroundColor: 'var(--bg-card)'
};

const messageListStyle = {
  flex: 1,
  padding: '1.5rem',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const messageWrapperStyle = {
  display: 'flex',
  width: '100%'
};

const botAvatarStyle = {
  width: '1.8rem',
  height: '1.8rem',
  borderRadius: '50%',
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const userAvatarStyle = {
  width: '1.8rem',
  height: '1.8rem',
  borderRadius: '50%',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--gold-primary)',
  border: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const chatBubbleStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.85rem',
  lineHeight: 1.45,
  boxSizing: 'border-box'
};

const presetButtonStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  padding: '0.45rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: '999px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.15s ease'
};

const inputContainerStyle = {
  padding: '1rem 1.5rem 1.5rem',
  backgroundColor: 'var(--bg-card)',
  borderTop: '1px solid var(--border-color)',
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center',
  flexShrink: 0
};

const inputStyle = {
  flex: 1,
  padding: '0.7rem 1rem',
  fontSize: '0.85rem',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)'
};

const sendButtonStyle = {
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c',
  border: 'none',
  width: '2.2rem',
  height: '2.2rem',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 10px var(--gold-glow)',
  transition: 'background-color 0.2s',
  flexShrink: 0
};

const stopButtonStyle = {
  backgroundColor: '#e11d48',
  color: '#ffffff',
  border: 'none',
  width: '2.2rem',
  height: '2.2rem',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 10px rgba(225, 29, 72, 0.35)',
  transition: 'all 0.2s ease',
  flexShrink: 0
};

