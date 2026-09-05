import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Brain, Send, History, BarChart3, 
  Sparkles, Settings, LogOut, Search, Bell, ChevronDown, User, Activity,
  RefreshCw, DollarSign, ShieldAlert, CheckCircle2, ShieldCheck, Command, Shield
} from 'lucide-react';
import CrmDashboard from './CrmDashboard';
import CrmCustomers from './CrmCustomers';
import CrmAudienceBuilder from './CrmAudienceBuilder';
import CrmCampaignStudio from './CrmCampaignStudio';
import CrmCampaignHistory from './CrmCampaignHistory';
import CrmAnalytics from './CrmAnalytics';
import CrmCopilot from './CrmCopilot';
import CrmSettings from './CrmSettings';
import CrmCartNegotiator from './CrmCartNegotiator';
import CrmTestingCenter from './CrmTestingCenter';
import CrmRevenueRecovery from './CrmRevenueRecovery';
import { useAuth } from '../auth/AuthContext';
import { useCrm } from './CrmContext';

export default function AppShell({ navigate }) {
  const [activePage, setActivePage] = useState('dashboard');
  const { user: authUser, logout } = useAuth();
  const { 
    campaigns, 
    customers,
    setCampaignStudioState,
    setAudienceBuilderState,
    setCopilotState,
    setNegotiatorState,
    setAnalyticsState,
    refreshAllData
  } = useCrm();
  const [user, setUser] = useState({ name: '', email: '', org: '' });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authUser) {
      setUser({
        name: authUser.name || 'Financial Officer',
        email: authUser.email || 'admin@payzor.ai',
        org: authUser.org || 'Payzor Capital & Recovery Technologies'
      });
    }
  }, [authUser]);

  // Keyboard shortcut listener for Command+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('landing');
  };

  // Main Page Router inside CRM
  const renderActivePage = () => {
    switch(activePage) {
      case 'dashboard': return <CrmDashboard setActivePage={setActivePage} />;
      case 'customers': return <CrmCustomers />;
      case 'audience': return <CrmAudienceBuilder setActivePage={setActivePage} />;
      case 'campaign': return <CrmCampaignStudio setActivePage={setActivePage} />;
      case 'history': return <CrmCampaignHistory />;
      case 'analytics': return <CrmAnalytics />;
      case 'copilot': return <CrmCopilot />;
      case 'settings': return <CrmSettings user={user} setUser={setUser} />;
      case 'negotiator': return <CrmCartNegotiator />;
      case 'testing': return <CrmTestingCenter />;
      case 'recovery': return <CrmRevenueRecovery />;
      default: return <CrmDashboard setActivePage={setActivePage} />;
    }
  };

  const navItems = [
    { id: 'dashboard', name: 'Recovery Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'customers', name: 'Customers & Ledgers', icon: <Users size={16} /> },
    { id: 'recovery', name: 'AI Revenue Recovery', icon: <DollarSign size={16} />, highlight: 'AI' },
    { id: 'audience', name: 'Recovery Audience', icon: <Brain size={16} />, highlight: 'AI' },
    { id: 'campaign', name: 'Recovery Campaigns', icon: <Send size={16} /> },
    { id: 'history', name: 'Recovery History', icon: <History size={16} /> },
    { id: 'analytics', name: 'Recovery Analytics', icon: <BarChart3 size={16} /> },
    { id: 'copilot', name: 'AI Copilot', icon: <Sparkles size={16} />, highlight: 'AI' },
    { id: 'settings', name: 'Settings', icon: <Settings size={16} /> }
  ];

  return (
    <div style={shellContainerStyle}>
      {/* 1. LEFT SIDEBAR */}
      <aside style={sidebarStyle}>
        
        {/* Sidebar Logo Header */}
        <div style={logoContainerStyle}>
          <div style={logoIconStyle}>
            <Shield size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div style={logoTextStyle}>
              PAYZOR <span style={{ color: 'var(--gold-primary)', fontWeight: 800 }}>AI</span>
            </div>
            <div style={logoSubTextStyle}>
              AUTONOMOUS RECOVERY
            </div>
          </div>
        </div>

        {/* Navigation Category Label */}
        <div style={navCategoryLabelStyle}>
          OPERATIONS CONSOLE
        </div>

        {/* Navigation Directory */}
        <nav style={navContainerStyle}>
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  ...navButtonStyle,
                  backgroundColor: isActive ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                  color: isActive ? '#F8FAFC' : '#94A3B8',
                  fontWeight: isActive ? 700 : 500,
                  borderLeft: isActive ? '3px solid var(--gold-primary)' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#F8FAFC';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', color: isActive ? 'var(--gold-primary)' : 'inherit', opacity: isActive ? 1 : 0.8 }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1, textAlign: 'left', fontSize: '0.82rem' }}>
                  {item.name}
                </span>
                {item.highlight && (
                  <span style={highlightBadgeStyle}>
                    {item.highlight}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Status Badge */}
        <div style={trackBadgeContainerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.7rem' }}>
            <ShieldCheck size={14} /> Payzor Recovery Engine
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '0.15rem' }}>
            Autonomous Yield: Active
          </div>
        </div>

        {/* Sidebar Footer User Details */}
        <div style={sidebarFooterStyle}>
          <div style={userCardStyle}>
            <div style={avatarStyle}>
              {(user.name || 'FO').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={userNameStyle}>{user.name || 'Financial Officer'}</div>
              <div style={userEmailStyle}>{user.org}</div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            style={logoutButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FB7185'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div style={mainContentStyle}>
        
        {/* Top Header Navigation */}
        <header style={headerStyle}>
          
          {/* Universal Search Command Bar */}
          <div style={searchContainerStyle}>
            <Search size={15} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
            <input 
              id="global-search-input"
              type="text" 
              placeholder="Search debtors, overdue invoices, campaigns..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
            <div style={searchKeyHintStyle}>
              <Command size={10} /> K
            </div>
          </div>

          {/* Right Header Utility Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
            
            {/* Environment Badge */}
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '0.22rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              color: 'var(--gold-champagne)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 0 10px rgba(212, 175, 55, 0.1)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
              Payzor AI Live Engine
            </span>

            {/* Refresh Data Button */}
            <button 
              onClick={() => {
                if (refreshAllData) refreshAllData();
              }}
              title="Refresh ledger and recovery data"
              style={utilityIconButtonStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <RefreshCw size={16} />
            </button>

            {/* Notification Badge */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                style={utilityIconButtonStyle}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Bell size={16} />
                <span style={bellBadgeStyle} />
              </button>
              
              {showNotifications && (() => {
                const totalRecovered = campaigns.reduce((acc, c) => acc + (c.revenueImpact || c.revenueRecovered || 0), 0);
                return (
                  <div style={notificationDropdownStyle} className="glass-panel">
                    <div style={dropdownHeaderStyle}>Payzor Recovery Telemetry</div>
                    <div style={dropdownItemStyle}>
                      <div style={{ fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={13} /> Recovery Dispatch Active
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                        {totalRecovered > 0 
                          ? `Total ₹${Math.round(totalRecovered).toLocaleString('en-IN')} recovered across active campaigns.` 
                          : "AI recovery workflows ready for dispatch in Campaign Studio."}
                      </div>
                    </div>
                    <div style={dropdownItemStyle}>
                      <div style={{ fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Brain size={13} style={{ color: 'var(--gold-primary)' }} /> AI Risk Scanning
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                        {customers.length > 0 
                          ? `${customers.length} debtor accounts evaluated with multi-factor risk scoring.` 
                          : "Debtor ledgers connected and synchronized."}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Profile Dropdown */}
            <div>
              <button 
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                style={profileTriggerStyle}
              >
                <div style={avatarHeaderStyle}>
                  {(user.name || 'FO').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <ChevronDown size={13} style={{ color: 'var(--gold-champagne)' }} />
              </button>
              
              {showProfileMenu && (
                <div style={profileDropdownStyle} className="glass-panel">
                  <div style={dropdownHeaderStyle}>{user.name || 'Finance Admin'}</div>
                  <div 
                    onClick={() => { setActivePage('settings'); setShowProfileMenu(false); }} 
                    style={{ ...dropdownItemStyle, cursor: 'pointer' }}
                  >
                    Account Settings
                  </div>
                  <div 
                    onClick={handleLogout} 
                    style={{ ...dropdownItemStyle, color: '#FB7185', cursor: 'pointer', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
                  >
                    Sign Out
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Scrollable Work Area */}
        <main style={workspaceStyle}>
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

// Layout styling tokens (Obsidian Black & Metallic Gold)
const shellContainerStyle = {
  display: 'flex',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  backgroundColor: '#0A0A0B',
  color: '#F8FAFC'
};

const sidebarStyle = {
  width: '254px',
  backgroundColor: '#0D0E12',
  borderRight: '1px solid rgba(212, 175, 55, 0.18)',
  display: 'flex',
  flexDirection: 'column',
  padding: '1.25rem 1rem',
  flexShrink: 0,
  boxSizing: 'border-box'
};

const logoContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
  marginBottom: '1.5rem',
  padding: '0 0.5rem'
};

const logoIconStyle = {
  width: '2.1rem',
  height: '2.1rem',
  borderRadius: '8px',
  background: 'var(--gold-gradient)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#0A0A0B',
  boxShadow: '0 0 14px rgba(212, 175, 55, 0.35)'
};

const logoTextStyle = {
  fontSize: '1rem',
  fontWeight: 800,
  fontFamily: 'var(--font-family-title)',
  letterSpacing: '-0.02em',
  lineHeight: 1,
  color: '#F8FAFC'
};

const logoSubTextStyle = {
  fontSize: '0.52rem',
  fontWeight: 800,
  color: 'var(--gold-champagne)',
  letterSpacing: '0.08em',
  marginTop: '0.15rem'
};

const navCategoryLabelStyle = {
  fontSize: '0.62rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#64748B',
  padding: '0 0.5rem',
  marginBottom: '0.4rem'
};

const navContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
  flex: 1
};

const navButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.55rem 0.65rem',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box'
};

const highlightBadgeStyle = {
  fontSize: '0.55rem',
  fontWeight: 800,
  background: 'var(--gold-gradient)',
  color: '#0A0A0B',
  padding: '0.1rem 0.4rem',
  borderRadius: '4px',
  marginLeft: 'auto',
  letterSpacing: '0.04em'
};

const trackBadgeContainerStyle = {
  marginTop: 'auto',
  marginBottom: '0.75rem',
  padding: '0.6rem 0.75rem',
  backgroundColor: '#121318',
  borderRadius: '8px',
  border: '1px solid rgba(212, 175, 55, 0.2)'
};

const sidebarFooterStyle = {
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  paddingTop: '0.85rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.65rem'
};

const userCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
  fontSize: '0.78rem'
};

const avatarStyle = {
  width: '1.9rem',
  height: '1.9rem',
  borderRadius: '50%',
  background: 'var(--gold-gradient)',
  color: '#0A0A0B',
  fontWeight: 800,
  fontSize: '0.72rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const userNameStyle = {
  fontWeight: 700,
  color: '#F8FAFC',
  fontSize: '0.78rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const userEmailStyle = {
  fontSize: '0.65rem',
  color: '#94A3B8',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const logoutButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: '#64748B',
  fontSize: '0.75rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0 0.25rem',
  fontFamily: 'inherit',
  transition: 'color 0.2s ease',
  alignSelf: 'flex-start'
};

const mainContentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
  boxSizing: 'border-box',
  backgroundColor: '#0A0A0B'
};

const headerStyle = {
  height: '60px',
  backgroundColor: '#0D0E12',
  borderBottom: '1px solid rgba(212, 175, 55, 0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 1.75rem',
  flexShrink: 0,
  boxSizing: 'border-box'
};

const searchContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  backgroundColor: '#0A0A0B',
  border: '1px solid rgba(212, 175, 55, 0.25)',
  borderRadius: '8px',
  padding: '0.38rem 0.75rem',
  width: '340px',
  transition: 'border-color 0.2s'
};

const searchInputStyle = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '0.78rem',
  fontFamily: 'inherit',
  width: '100%',
  color: '#F8FAFC'
};

const searchKeyHintStyle = {
  fontSize: '0.6rem',
  fontWeight: 700,
  color: 'var(--gold-champagne)',
  backgroundColor: '#14151B',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  borderRadius: '4px',
  padding: '0.1rem 0.35rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.15rem'
};

const utilityIconButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: '#94A3B8',
  cursor: 'pointer',
  padding: '0.35rem',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.15s, color 0.15s'
};

const bellBadgeStyle = {
  position: 'absolute',
  top: '3px',
  right: '3px',
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#D4AF37',
  boxShadow: '0 0 6px #FFD700'
};

const profileTriggerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 0
};

const avatarHeaderStyle = {
  width: '1.85rem',
  height: '1.85rem',
  borderRadius: '50%',
  background: 'var(--gold-gradient)',
  color: '#0A0A0B',
  fontWeight: 800,
  fontSize: '0.72rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(212, 175, 55, 0.3)'
};

const workspaceStyle = {
  flex: 1,
  overflowY: 'auto',
  boxSizing: 'border-box',
  backgroundColor: '#0A0A0B'
};

const notificationDropdownStyle = {
  position: 'absolute',
  top: '42px',
  right: '40px',
  width: '300px',
  backgroundColor: '#121318',
  border: '1px solid rgba(212, 175, 55, 0.25)',
  borderRadius: '10px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.9)',
  zIndex: 100,
  padding: '0.4rem 0',
  display: 'flex',
  flexDirection: 'column'
};

const profileDropdownStyle = {
  position: 'absolute',
  top: '42px',
  right: '0px',
  width: '180px',
  backgroundColor: '#121318',
  border: '1px solid rgba(212, 175, 55, 0.25)',
  borderRadius: '10px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.9)',
  zIndex: 100,
  padding: '0.4rem 0',
  display: 'flex',
  flexDirection: 'column'
};

const dropdownHeaderStyle = {
  fontSize: '0.68rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--gold-champagne)',
  padding: '0.4rem 0.9rem',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
};

const dropdownItemStyle = {
  padding: '0.55rem 0.9rem',
  fontSize: '0.78rem',
  color: '#F8FAFC',
  lineHeight: 1.35
};
