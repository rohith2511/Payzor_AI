import React, { useState } from 'react';
import { User, Building2, Bell, Shield, Key, Database, RefreshCw, Plus, Check, Cpu, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function CrmSettings({ user, setUser }) {
  const { updateUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [keys, setKeys] = useState([
    { id: '1', label: 'Production Public Key', val: 'pk_live_51NvREAc2...', created: 'June 1, 2026' }
  ]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiKey, setAiKey] = useState('');
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');

  const handleSaveAiKey = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('payzor_token')}`
        },
        body: JSON.stringify({ api_key: aiKey })
      });
      if (response.ok) {
        alert('AI Configuration updated successfully!');
        setAiKey('');
      } else {
        const data = await response.json();
        alert(`Error: ${data.detail || 'Failed to update key'}`);
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAiKey = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/api-key`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('payzor_token')}`
        }
      });
      if (response.ok) {
        alert('API Key deleted successfully!');
        setAiKey('');
      } else {
        const data = await response.json();
        alert(`Error: ${data.detail || 'Failed to delete key'}`);
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const expected = `Delete Account/${user?.email?.trim()}`.toLowerCase();
    if (deleteEmailConfirm.trim().toLowerCase() !== expected) {
      alert('Confirmation text does not match.');
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('payzor_token')}`
        }
      });
      if (response.ok) {
        alert('Account deleted permanently.');
        localStorage.removeItem('payzor_token');
        window.location.href = '/login';
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const result = await updateUser({ name: user.name });
      if (result.success) {
        setUser(prev => ({ ...prev, name: result.user.name }));
        alert('Profile saved successfully!');
      } else {
        alert(`Failed to save: ${result.error}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOrg = async () => {
    setIsSaving(true);
    try {
      const result = await updateUser({ org: user.org });
      if (result.success) {
        setUser(prev => ({ ...prev, org: result.user.org }));
        alert('Organization saved successfully!');
      } else {
        alert(`Failed to save: ${result.error}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateKey = () => {
    const newKey = {
      id: String(keys.length + 1),
      label: 'Developer SDK Key',
      val: 'sk_live_' + Math.random().toString(36).substring(2, 12) + '...',
      created: 'Just now'
    };
    setKeys(prev => [...prev, newKey]);
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('Data integrations synced successfully! Re-indexed B2B credit customer directory from Shopify and Snowflake endpoints.');
    }, 1200);
  };

  return (
    <div style={{ padding: '2rem' }}>
      
      {/* 1. Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Settings
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Configure account details, notification logs, API tokens, and sync integrations.
        </p>
      </div>

      <div style={layoutGridStyle}>
        
        {/* Left Sub-Navigation */}
        <div style={navCardStyle}>
          <button 
            onClick={() => setActiveSubTab('profile')} 
            style={{ ...subTabButtonStyle, backgroundColor: activeSubTab === 'profile' ? '#f1f5f9' : 'transparent', fontWeight: activeSubTab === 'profile' ? 700 : 500 }}
          >
            <User size={14} /> Profile Settings
          </button>
          <button 
            onClick={() => setActiveSubTab('org')} 
            style={{ ...subTabButtonStyle, backgroundColor: activeSubTab === 'org' ? '#f1f5f9' : 'transparent', fontWeight: activeSubTab === 'org' ? 700 : 500 }}
          >
            <Building2 size={14} /> Organization
          </button>
          <button 
            onClick={() => setActiveSubTab('notifications')} 
            style={{ ...subTabButtonStyle, backgroundColor: activeSubTab === 'notifications' ? '#f1f5f9' : 'transparent', fontWeight: activeSubTab === 'notifications' ? 700 : 500 }}
          >
            <Bell size={14} /> Notifications
          </button>
          <button 
            onClick={() => setActiveSubTab('security')} 
            style={{ ...subTabButtonStyle, backgroundColor: activeSubTab === 'security' ? '#f1f5f9' : 'transparent', fontWeight: activeSubTab === 'security' ? 700 : 500 }}
          >
            <Shield size={14} /> Security
          </button>
          <button 
            onClick={() => setActiveSubTab('keys')} 
            style={{ ...subTabButtonStyle, backgroundColor: activeSubTab === 'keys' ? '#f1f5f9' : 'transparent', fontWeight: activeSubTab === 'keys' ? 700 : 500 }}
          >
            <Key size={14} /> API Keys
          </button>
          <button 
            onClick={() => setActiveSubTab('integrations')} 
            style={{ ...subTabButtonStyle, backgroundColor: activeSubTab === 'integrations' ? '#f1f5f9' : 'transparent', fontWeight: activeSubTab === 'integrations' ? 700 : 500 }}
          >
            <Database size={14} /> Integrations
          </button>
          <button 
            onClick={() => setActiveSubTab('ai')} 
            style={{ ...subTabButtonStyle, backgroundColor: activeSubTab === 'ai' ? '#f1f5f9' : 'transparent', fontWeight: activeSubTab === 'ai' ? 700 : 500 }}
          >
            <Cpu size={14} /> AI Configuration
          </button>
          <button 
            onClick={() => setActiveSubTab('delete')} 
            style={{ ...subTabButtonStyle, backgroundColor: activeSubTab === 'delete' ? '#fef2f2' : 'transparent', color: '#ef4444', fontWeight: activeSubTab === 'delete' ? 700 : 500, marginTop: '2rem' }}
          >
            <Trash2 size={14} /> Delete Account
          </button>
        </div>

        {/* Right Configuration Views */}
        <div style={configCardStyle}>
          
          {/* PROFILE VIEW */}
          {activeSubTab === 'profile' && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Profile Configuration</h3>
              <div style={formGridStyle}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input 
                    type="text" 
                    value={user.name} 
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Work Email Address</label>
                  <input 
                    type="email" 
                    value={user.email} 
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <button onClick={handleSaveProfile} disabled={isSaving} style={saveButtonStyle}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}

          {/* ORG VIEW */}
          {activeSubTab === 'org' && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Organization Profile</h3>
              <div style={formGridStyle}>
                <div>
                  <label style={labelStyle}>Organization Name</label>
                  <input 
                    type="text" 
                    value={user.org} 
                    onChange={(e) => setUser({ ...user, org: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Retail Sector</label>
                  <select style={selectStyle}>
                    <option>Fashion & Apparel</option>
                    <option>Consumer Electronics</option>
                    <option>Beauty & Cosmetics</option>
                  </select>
                </div>
              </div>
              <button onClick={handleSaveOrg} disabled={isSaving} style={saveButtonStyle}>
                {isSaving ? 'Saving...' : 'Save Organization'}
              </button>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSubTab === 'notifications' && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Outreach Notifications</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={switchRowStyle}>
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>Email Campaign Alerts</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Get notified on delivery thresholds drops.</div>
                  </div>
                  <input type="checkbox" defaultChecked style={checkboxStyle} />
                </div>
                <div style={switchRowStyle}>
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>WhatsApp Blast Receipts</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Get receipts on direct attributed revenue payouts.</div>
                  </div>
                  <input type="checkbox" defaultChecked style={checkboxStyle} />
                </div>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeSubTab === 'security' && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Access Security</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={switchRowStyle}>
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>Two-Factor Authentication (2FA)</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Require SMS OTP on logins.</div>
                  </div>
                  <input type="checkbox" style={checkboxStyle} />
                </div>
                <button 
                  onClick={() => alert('Password reset link sent to your email!')}
                  style={secondaryButtonStyle}
                >
                  Send Reset Link
                </button>
              </div>
            </div>
          )}

          {/* API KEYS */}
          {activeSubTab === 'keys' && (
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={sectionTitleStyle}>Developer Access Keys</h3>
                <button onClick={handleGenerateKey} style={addKeyButtonStyle}>
                  <Plus size={14} /> Create Key
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                {keys.map((k) => (
                  <div key={k.id} style={keyItemStyle}>
                    <div>
                      <strong style={{ fontSize: '0.8rem' }}>{k.label}</strong>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--blue-primary)', marginTop: '0.2rem' }}>{k.val}</div>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Created {k.created}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INTEGRATIONS */}
          {activeSubTab === 'integrations' && (
            <div style={sectionStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={sectionTitleStyle}>Data Platform Integrations</h3>
                <button 
                  onClick={handleSync} 
                  disabled={isSyncing}
                  style={syncButtonStyle}
                >
                  {isSyncing ? (
                    <RefreshCw size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Sync Profiles
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }} className="settings-grid-split">
                <div style={integrationCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem' }}>Shopify Store</strong>
                    <span style={connectedLabelStyle}><Check size={10} /> Sync Active</span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>Automatically pulls customer logs, order items, and checkout dropoffs.</p>
                </div>

                <div style={integrationCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem' }}>Snowflake DB</strong>
                    <span style={connectedLabelStyle}><Check size={10} /> Sync Active</span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>Read and index target customer tables via dynamic SQL imports.</p>
                </div>
              </div>
            </div>
          )}

          {/* AI CONFIGURATION */}
          {activeSubTab === 'ai' && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>AI Configuration</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Configure your own Groq API Key to enable AI features like Campaign Studio and AI Copilot. 
                <br/>Get your key from: <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{color: 'var(--blue-primary)'}}>https://console.groq.com/keys</a>
              </p>
              <div style={formGridStyle}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Groq API Key</label>
                  <input 
                    type="password" 
                    placeholder="gsk_**********************"
                    value={aiKey} 
                    onChange={(e) => setAiKey(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button onClick={handleSaveAiKey} disabled={isSaving} style={saveButtonStyle}>
                  {isSaving ? 'Saving...' : 'Save API Key'}
                </button>
                <button onClick={handleDeleteAiKey} disabled={isSaving} style={{...secondaryButtonStyle, color: '#ef4444', borderColor: '#fee2e2'}}>
                  Delete API key
                </button>
              </div>
            </div>
          )}

          {/* DELETE ACCOUNT */}
          {activeSubTab === 'delete' && (
            <div style={sectionStyle}>
              <h3 style={{...sectionTitleStyle, color: '#ef4444', borderBottomColor: '#fee2e2'}}>Danger Zone</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <div style={formGridStyle}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Type "Delete Account/{user?.email}" to confirm</label>
                  <input 
                    type="text" 
                    value={deleteEmailConfirm} 
                    onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                    style={{...inputStyle, borderColor: '#fca5a5'}}
                  />
                </div>
              </div>
              <button 
                onClick={handleDeleteAccount} 
                disabled={deleteEmailConfirm.trim().toLowerCase() !== `Delete Account/${user?.email?.trim()}`.toLowerCase()} 
                style={{...saveButtonStyle, color: '#ffffff', backgroundColor: '#ef4444', boxShadow: 'none', opacity: deleteEmailConfirm.trim().toLowerCase() !== `Delete Account/${user?.email?.trim()}`.toLowerCase() ? 0.5 : 1}}
              >
                Permanently Delete Account
              </button>
            </div>
          )}

        </div>

      </div>

      <style>{`
        .settings-grid-split {
          grid-template-columns: 1fr !important;
        }
        @media (min-width: 768px) {
          .settings-grid-split {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Layout styles
const layoutGridStyle = {
  display: 'grid',
  gridTemplateColumns: '240px 1fr',
  gap: '2rem',
  alignItems: 'flex-start'
};

const navCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-md)',
  padding: '1rem',
  boxShadow: 'var(--shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const subTabButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.6rem 0.8rem',
  fontSize: '0.8rem',
  color: 'var(--text-primary)',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  fontFamily: 'inherit',
  width: '100%',
  textAlign: 'left'
};

const configCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '2rem',
  boxShadow: 'var(--shadow-sm)',
  minHeight: '320px'
};

const sectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const sectionTitleStyle = {
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-family-title)',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.5rem'
};

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1.25rem'
};

const labelStyle = {
  fontSize: '0.72rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: '0.4rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.8rem',
  fontSize: '0.85rem',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-sm)',
  outline: 'none',
  backgroundColor: 'var(--bg-secondary)',
  fontFamily: 'inherit',
  color: 'var(--text-primary)',
  boxSizing: 'border-box'
};

const selectStyle = {
  width: '100%',
  padding: '0.65rem 0.8rem',
  fontSize: '0.85rem',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-sm)',
  outline: 'none',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit'
};

const saveButtonStyle = {
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c',
  border: 'none',
  padding: '0.6rem 1.4rem',
  fontSize: '0.85rem',
  fontWeight: 700,
  borderRadius: 'var(--border-radius-sm)',
  cursor: 'pointer',
  boxShadow: '0 4px 12px var(--gold-glow)',
  transition: 'all 0.2s',
  alignSelf: 'flex-start'
};

const switchRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 0',
  borderBottom: '1px solid var(--border-color)'
};

const checkboxStyle = {
  width: '1.2rem',
  height: '1.2rem',
  cursor: 'pointer'
};

const secondaryButtonStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  padding: '0.5rem 1rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  borderRadius: 'var(--border-radius-sm)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  alignSelf: 'flex-start',
  fontFamily: 'inherit'
};

const addKeyButtonStyle = {
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c',
  border: 'none',
  padding: '0.4rem 0.8rem',
  fontSize: '0.75rem',
  fontWeight: 700,
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
  boxShadow: '0 2px 8px var(--gold-glow)',
  transition: 'background-color 0.2s'
};

const keyItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.8rem 1rem',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '8px'
};

const syncButtonStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  padding: '0.4rem 0.8rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  transition: 'all 0.2s',
  fontFamily: 'inherit'
};

const integrationCardStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '1rem'
};

const connectedLabelStyle = {
  fontSize: '0.62rem',
  fontWeight: 700,
  color: 'var(--green-primary)',
  backgroundColor: 'rgba(16, 185, 129, 0.15)',
  padding: '0.2rem 0.45rem',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.2rem',
  border: '1px solid rgba(16, 185, 129, 0.3)'
};
