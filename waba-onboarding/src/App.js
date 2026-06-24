import { useState, useEffect } from "react";
import AuthPage from "./AuthPage";
import { authAPI, accountsAPI, whatsappAPI } from "./api";

const API_BASE = "https://graph.facebook.com/v19.0";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green: #128C7E;
    --dark-green: #075E54;
    --light-green: #DCF8C6;
    --bg: #f0f2f5;
    --surface: #ffffff;
    --surface2: #f7f8fa;
    --border: #e2e8f0;
    --text: #1a202c;
    --muted: #718096;
    --accent: #128C7E;
    --error: #e53e3e;
    --warn: #d69e2e;
  }

  body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); }

  .app {
    min-height: 100vh;
    background: var(--bg);
    background-image: radial-gradient(ellipse at 20% 10%, rgba(18,140,126,0.06) 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 80%, rgba(37,211,102,0.04) 0%, transparent 50%);
  }

  .header {
    padding: 20px 32px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .logo {
    width: 40px; height: 40px;
    // background: var(--green);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
  }

  .header-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -0.3px; }
  .header-sub { font-size: 12px; color: var(--muted); margin-top: 1px; }

  .header-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }

  .header-badge {
    background: rgba(18,140,126,0.1);
    border: 1px solid rgba(18,140,126,0.2);
    color: var(--green);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }

  .creds-indicator {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px;
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 500;
  }
  .creds-saved { background: rgba(18,140,126,0.1); border: 1px solid rgba(18,140,126,0.2); color: var(--green); }
  .creds-missing { background: rgba(229,62,62,0.08); border: 1px solid rgba(229,62,62,0.2); color: var(--error); }

  .tabs {
    display: flex;
    gap: 0;
    padding: 0 32px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .tab {
    padding: 16px 24px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    background: none;
    border: none;
    color: var(--muted);
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    display: flex; align-items: center; gap: 8px;
  }

  .tab:hover { color: var(--text); }
  .tab.active { color: var(--green); border-bottom-color: var(--green); }
  .tab-icon { font-size: 16px; }

  .main { padding: 32px; max-width: 1400px; margin: 0 auto; }
  .main-wide { padding: 32px; max-width: 96vw; margin: 0 auto; }

  .grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }

  .card-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }

  .card-header h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; }
  .card-header p { font-size: 12px; color: var(--muted); margin-top: 2px; }

  .card-icon {
    width: 36px; height: 36px;
    background: var(--surface2);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }

  .card-body { padding: 24px; }

  .field { margin-bottom: 16px; }
  .label { font-size: 12px; font-weight: 500; color: var(--muted); margin-bottom: 6px; letter-spacing: 0.5px; text-transform: uppercase; display: block; }

  input, select, textarea {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    padding: 10px 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  input:focus, select:focus, textarea:focus { border-color: var(--green); }
  select option { background: white; }
  textarea { resize: vertical; min-height: 100px; line-height: 1.6; }

  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .btn {
    padding: 11px 20px;
    border-radius: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    display: flex; align-items: center; gap: 8px; justify-content: center;
  }

  .btn-primary { background: var(--green); color: #fff; width: 100%; }
  .btn-primary:hover { background: #0e7a70; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .btn-outline {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 12px;
    padding: 7px 14px;
  }
  .btn-outline:hover { border-color: var(--green); color: var(--green); }

  .btn-save { background: var(--green); color: #fff; padding: 10px 28px; width: auto; }
  .btn-save:hover { background: #0e7a70; }
  .btn-clear { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 10px 20px; width: auto; }
  .btn-clear:hover { border-color: var(--error); color: var(--error); }

  .preview-box {
    background: #f0f2f5;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    min-height: 120px;
  }

  .preview-label { font-size: 11px; color: var(--muted); margin-bottom: 10px; letter-spacing: 0.5px; text-transform: uppercase; }

  .wa-bubble {
    background: var(--light-green);
    color: #111;
    border-radius: 12px 12px 12px 2px;
    padding: 12px 14px;
    font-size: 14px;
    line-height: 1.6;
    max-width: 90%;
    display: inline-block;
  }

  .wa-time { font-size: 10px; color: #777; text-align: right; margin-top: 4px; }

  .status-bar {
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 13px;
    display: flex; align-items: center; gap: 8px;
    margin-top: 12px;
  }

  .status-success { background: rgba(18,140,126,0.08); border: 1px solid rgba(18,140,126,0.2); color: var(--green); }
  .status-error { background: rgba(229,62,62,0.08); border: 1px solid rgba(229,62,62,0.2); color: var(--error); }
  .status-loading { background: rgba(214,158,46,0.08); border: 1px solid rgba(214,158,46,0.2); color: var(--warn); }

  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  .component-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    color: var(--muted);
    margin: 3px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .component-tag:hover { border-color: var(--green); color: var(--green); }

  .spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    display: inline-block;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .response-box {
    background: #1a202c;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #68d391;
    max-height: 200px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
    margin-top: 12px;
  }

  .help-text { font-size: 12px; color: var(--muted); margin-top: 5px; line-height: 1.5; }

  .section-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 800; margin-bottom: 6px; letter-spacing: -0.3px; }
  .section-sub { font-size: 14px; color: var(--muted); margin-bottom: 24px; }

  .no-creds-banner {
    background: rgba(214,158,46,0.08);
    border: 1px solid rgba(214,158,46,0.25);
    border-radius: 12px;
    padding: 14px 18px;
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px;
    font-size: 13px;
    color: #92670a;
  }

  .saved-row {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 10px;
  }
  .saved-key { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .saved-val { font-size: 13px; color: var(--text); font-family: 'JetBrains Mono', monospace; margin-top: 3px; }

  .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

  .gear-btn {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    transition: all 0.2s;
    position: relative;
  }
  .gear-btn:hover { background: var(--border); border-color: var(--green); }
  .gear-btn.has-warning::after {
    content: '';
    position: absolute;
    top: -3px; right: -3px;
    width: 9px; height: 9px;
    background: var(--error);
    border-radius: 50%;
    border: 2px solid white;
  }

  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(4px);
    z-index: 999;
    display: flex; align-items: flex-start; justify-content: flex-end;
    padding: 70px 24px 0;
  }

  .modal-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    width: 480px;
    max-width: calc(100vw - 48px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    overflow: hidden;
    animation: slideDown 0.2s ease;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .modal-header {
    padding: 18px 20px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }

  .modal-header h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; }

  .modal-close {
    width: 28px; height: 28px;
    border-radius: 8px;
    background: var(--surface2);
    border: 1px solid var(--border);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; color: var(--muted);
    transition: all 0.15s;
  }
  .modal-close:hover { background: var(--border); color: var(--text); }

  .modal-body { padding: 20px; }

  .template-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }

  .template-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    transition: box-shadow 0.2s, transform 0.15s, border-color 0.2s;
    display: flex;
    flex-direction: column;
  }
  .template-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.09); transform: translateY(-2px); border-color: #b2d8d4; }

  .template-card-header {
    padding: 16px 18px 12px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
    background: linear-gradient(135deg, #f9fffe 0%, #f0f9f8 100%);
  }

  .template-name { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); word-break: break-all; }
  .template-lang { font-size: 11px; color: var(--muted); margin-top: 4px; display: flex; align-items: center; gap: 4px; }

  .template-badge {
    font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; letter-spacing: 0.3px;
  }
  .badge-APPROVED { background: rgba(18,140,126,0.1); color: var(--green); border: 1px solid rgba(18,140,126,0.25); }
  .badge-PENDING { background: rgba(214,158,46,0.1); color: var(--warn); border: 1px solid rgba(214,158,46,0.25); }
  .badge-REJECTED { background: rgba(229,62,62,0.1); color: var(--error); border: 1px solid rgba(229,62,62,0.25); }
  .badge-DISABLED { background: rgba(113,128,150,0.1); color: var(--muted); border: 1px solid rgba(113,128,150,0.2); }

  .template-body-text { padding: 14px 18px; font-size: 13px; color: var(--muted); line-height: 1.65; flex: 1; min-height: 70px; }

  .template-footer-bar {
    padding: 11px 18px;
    border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    background: var(--surface2);
  }

  .template-category {
    font-size: 11px; color: var(--muted); text-transform: uppercase;
    letter-spacing: 0.6px; font-weight: 600;
    background: var(--border); padding: 3px 8px; border-radius: 4px;
  }

  .btn-use {
    background: var(--green); color: #fff;
    padding: 7px 16px; border-radius: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700;
    border: none; cursor: pointer; transition: background 0.2s, transform 0.1s;
  }
  .btn-use:hover { background: #0e7a70; transform: translateY(-1px); }
  .btn-use:disabled { opacity: 0.35; cursor: not-allowed; transform: none; background: var(--muted); }

  .load-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 12px; flex-wrap: wrap; }
  .filter-row { display: flex; gap: 8px; flex-wrap: wrap; }

  .filter-btn {
    padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
    border: 1px solid var(--border); background: var(--surface); color: var(--muted); cursor: pointer; transition: all 0.15s;
  }
  .filter-btn.active { background: var(--green); color: #fff; border-color: var(--green); }
  .filter-btn:hover:not(.active) { border-color: var(--green); color: var(--green); }

  .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
  .empty-state .icon { font-size: 40px; margin-bottom: 12px; }
  .empty-state p { font-size: 14px; }

  .spinner-dark {
    width: 14px; height: 14px;
    border: 2px solid rgba(18,140,126,0.2);
    border-top-color: var(--green);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    display: inline-block;
  }

  @media (max-width: 1100px) {
    .template-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 768px) {
    .grid { grid-template-columns: 1fr; }
    .settings-grid { grid-template-columns: 1fr; }
    .template-grid { grid-template-columns: 1fr; }
    .main { padding: 16px; }
    .main-wide { padding: 16px; }
    .tabs { padding: 0 16px; }
    .header { padding: 16px; }
  }
`;

function getCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function AccountManager({ accounts, currentAccountId, onSwitch, onDelete, onRename, onClose }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const startEdit = (account) => {
    setEditingId(account.id);
    setEditName(account.name);
  };

  const saveEdit = (accountId) => {
    if (editName.trim()) {
      onRename(accountId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px' }}>📱 Manage Accounts</h3>

      {accounts.length === 0 ? (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#666',
          background: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
          <p>No accounts yet</p>
          <p style={{ fontSize: '14px' }}>Go to the Signup tab to add your first WhatsApp Business account</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {accounts.map(account => (
            <div
              key={account.id}
              style={{
                padding: '16px',
                border: account.id === currentAccountId ? '2px solid #25D366' : '1px solid #ddd',
                borderRadius: '8px',
                background: account.id === currentAccountId ? '#f0fdf4' : 'white',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  {editingId === account.id ? (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                          flex: 1
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(account.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#25D366',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '6px 12px',
                          background: '#666',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px' }}>{account.name}</strong>
                      {account.id === currentAccountId && (
                        <span style={{
                          background: '#25D366',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    📞 Phone ID: {account.phoneId}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    🏢 WABA ID: {account.wabaId}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    🔑 Token: {account.token ? `${account.token.substring(0, 15)}...` : '❌ Not set'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                  {account.id !== currentAccountId && (
                    <button
                      onClick={() => onSwitch(account.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#25D366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      Switch
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(account)}
                    style={{
                      padding: '8px 12px',
                      background: '#f0f0f0',
                      color: '#333',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    title="Rename account"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDelete(account.id)}
                    style={{
                      padding: '8px 12px',
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    title="Delete account"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            background: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}


function NoCreditsBanner({ onGoToSettings }) {
  return (
    <div className="no-creds-banner">
      <span style={{ fontSize: 18 }}>⚠️</span>
      <div>
        Click the <span
          style={{ color: "var(--green)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
          onClick={onGoToSettings}
        >⚙️ gear icon</span> in the top right to add your Access Token, WABA ID and Phone Number ID.
      </div>
    </div>
  );
}

function SettingsPage({ creds, onSave, onClose }) {
  const [form, setForm] = useState({ ...creds });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => { setSaved(false); if (onClose) onClose(); }, 1200);
  };

  const handleClear = () => {
    const empty = { token: "", wabaId: "", phoneId: "" };
    setForm(empty);
    onSave(empty);
  };

  const isFilled = form.token && form.wabaId && form.phoneId;

  return (
    <div>
      <div className="field">
        <label className="label">Access Token</label>
        <input
          type="password"
          placeholder="EAAxxxxx..."
          value={form.token}
          onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
        />
        <div className="help-text">Meta Developer Console → Your App → Access Token</div>
      </div>

      <div className="field">
        <label className="label">WABA ID {form.wabaId && !form.token && <span style={{ color: 'var(--green)', fontSize: 11, marginLeft: 6 }}>✓ From Signup</span>}</label>
        <input
          placeholder="e.g. 123456789012345"
          value={form.wabaId}
          onChange={(e) => setForm((f) => ({ ...f, wabaId: e.target.value }))}
        />
        <div className="help-text">Business Settings → WhatsApp Accounts</div>
      </div>

      <div className="field">
        <label className="label">Phone Number ID {form.phoneId && !form.token && <span style={{ color: 'var(--green)', fontSize: 11, marginLeft: 6 }}>✓ From Signup</span>}</label>
        <input
          placeholder="e.g. 827023610503270"
          value={form.phoneId}
          onChange={(e) => setForm((f) => ({ ...f, phoneId: e.target.value }))}
        />
        <div className="help-text">Developer Console → WhatsApp → API Setup</div>
      </div>

      {isFilled && (
        <div className="status-bar status-success" style={{ marginBottom: 14 }}>
          ✅ All credentials filled
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-save" style={{ flex: 1 }} onClick={handleSave}>
          {saved ? "✅ Saved!" : "💾 Save & Close"}
        </button>
        <button className="btn btn-clear" onClick={handleClear}>Clear</button>
      </div>
    </div>
  );
}

function TemplatePage({ creds, onGoToSettings }) {
  const [form, setForm] = useState({
    name: "", language: "en_US", category: "MARKETING",
    headerType: "TEXT", headerText: "", body: "", footer: "",
    buttonType: "NONE", buttonText: "", buttonUrl: "",
    isCarousel: false, carouselCards: [{ image: "", body: "", imageFile: null }]
  });
  const [varSamples, setVarSamples] = useState({});
  const [status, setStatus] = useState(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextVarNumber, setNextVarNumber] = useState(1);

  const credsMissing = !creds.token || !creds.wabaId;

  // Detect all {{n}} variables in body
  const detectedVars = [...new Set(
    [...(form.body.matchAll(/\{\{(\w+)\}\}/g))].map((m) => m[1])
  )];

  // Build preview with sample values substituted
  const buildPreview = (text) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      varSamples[k] ? `${varSamples[k]}` : `{{${k}}}`
    );

  const previewBody = buildPreview(form.body);
  const previewHeader = form.headerType === "TEXT" && form.headerText ? buildPreview(form.headerText) : "";

  const preview = [
    previewHeader && `*${previewHeader}*`,
    previewBody,
    form.footer && `_${form.footer}_`,
  ].filter(Boolean).join("\n\n");

  // Incremental variable insertion
  const insertIncrementalVar = () => {
    setForm((f) => ({ ...f, body: f.body + `{{${nextVarNumber}}}` }));
    setNextVarNumber(prev => prev + 1);
  };

  const insertVar = (v) => setForm((f) => ({ ...f, body: f.body + `{{${v}}}` }));

  // Upload image to Facebook and get handle
  const uploadImageToFacebook = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('messaging_product', 'whatsapp');

    try {
      const response = await fetch(
        `${API_BASE}/${creds.wabaId}/media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${creds.token}`
          },
          body: formData
        }
      );
      const data = await response.json();
      if (data.id) {
        return data.id; // Return media ID
      } else {
        throw new Error(data.error?.message || 'Failed to upload image');
      }
    } catch (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    if (credsMissing) { onGoToSettings(); return; }
    if (!form.name || (!form.body && form.headerType !== "CAROUSEL")) {
      setStatus("error");
      setResponse("Template name and body are required.");
      return;
    }

    // Validate carousel
    if (form.headerType === "CAROUSEL") {
      if (form.carouselCards.length < 2) {
        setStatus("error");
        setResponse("Carousel requires at least 2 cards.");
        return;
      }
      const hasEmptyCards = form.carouselCards.some(card => !card.image || !card.body);
      if (hasEmptyCards) {
        setStatus("error");
        setResponse("All carousel cards must have an image and body text.");
        return;
      }
    }

    setLoading(true);
    setStatus("loading");
    setResponse("Creating template...");

    try {
      const components = [];

      // Handle carousel
      if (form.headerType === "CAROUSEL") {
        setResponse("Uploading images...");

        // Upload all images first
        const uploadedCards = await Promise.all(
          form.carouselCards.map(async (card) => {
            let imageHandle = card.image;

            // If it's a local file (base64), upload it to Facebook
            if (card.imageFile) {
              try {
                const mediaId = await uploadImageToFacebook(card.imageFile);
                imageHandle = mediaId;
                setResponse(`Uploaded ${card.imageFile.name}...`);
              } catch (error) {
                throw new Error(`Failed to upload ${card.imageFile.name}: ${error.message}`);
              }
            }

            return {
              image: imageHandle,
              body: card.body
            };
          })
        );

        setResponse("Creating carousel template...");

        const carouselComponent = {
          type: "CAROUSEL",
          cards: uploadedCards.map(card => ({
            components: [
              {
                type: "HEADER",
                format: "IMAGE",
                example: {
                  header_handle: [card.image]
                }
              },
              {
                type: "BODY",
                text: card.body
              }
            ]
          }))
        };
        components.push(carouselComponent);
      } else {
        // Regular template
        if (form.headerType !== "NONE" && form.headerText)
          components.push({ type: "HEADER", format: form.headerType, text: form.headerType === "TEXT" ? form.headerText : undefined });

        // Build body with example values for Meta
        const bodyComp = { type: "BODY", text: form.body };
        if (detectedVars.length > 0) {
          bodyComp.example = {
            body_text: [detectedVars.map((v) => varSamples[v] || `sample_${v}`)]
          };
        }
        components.push(bodyComp);
      }

      if (form.footer) components.push({ type: "FOOTER", text: form.footer });
      if (form.buttonType === "URL" && form.buttonText)
        components.push({ type: "BUTTONS", buttons: [{ type: "URL", text: form.buttonText, url: form.buttonUrl }] });
      else if (form.buttonType === "QUICK_REPLY" && form.buttonText)
        components.push({ type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: form.buttonText }] });

      const payload = {
        name: form.name.toLowerCase().replace(/\s+/g, "_"),
        language: form.language,
        category: form.category,
        components
      };

      const res = await fetch(`${API_BASE}/${creds.wabaId}/message_templates`, {
        method: "POST",
        headers: { Authorization: `Bearer ${creds.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      setStatus(data.id || data.success ? "success" : "error");
    } catch (e) {
      setStatus("error");
      setResponse(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="section-title">Create Template</div>
      <div className="section-sub">Create WhatsApp message templates for Meta approval</div>
      {credsMissing && <NoCreditsBanner onGoToSettings={onGoToSettings} />}

      <div className="grid">
        <div className="card">
          <div className="card-header">
            <div className="card-icon">📝</div>
            <div><h3>Create Template</h3><p>Define structure and content</p></div>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="field">
                <label className="label">Template Name</label>
                <input placeholder="e.g. order_confirmation" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                <div className="help-text">Lowercase, underscores only</div>
              </div>
              <div className="field">
                <label className="label">Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label className="label">Language</label>
                <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}>
                  <option value="en_US">English (US)</option>
                  <option value="en_GB">English (UK)</option>
                  <option value="hi">Hindi</option>
                  <option value="ar">Arabic</option>
                  <option value="es">Spanish</option>
                  <option value="pt_BR">Portuguese (BR)</option>
                  <option value="fr">French</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Header Type</label>
                <select value={form.headerType} onChange={(e) => setForm((f) => ({ ...f, headerType: e.target.value }))}>
                  <option value="NONE">No Header</option>
                  <option value="TEXT">Text</option>
                  <option value="IMAGE">Image</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="VIDEO">Video</option>
                  <option value="CAROUSEL">🎠 Carousel (Multiple Images)</option>
                </select>
              </div>
            </div>

            {form.headerType === "CAROUSEL" && (
              <div style={{
                background: 'rgba(18,140,126,0.04)',
                border: '1px solid rgba(18,140,126,0.18)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16
              }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--green)',
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>🎠 Carousel Cards (Max 10)</span>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      if (form.carouselCards.length < 10) {
                        setForm(f => ({
                          ...f,
                          carouselCards: [...f.carouselCards, { image: "", body: "", imageFile: null }]
                        }));
                      }
                    }}
                    disabled={form.carouselCards.length >= 10}
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    + Add Card
                  </button>
                </div>
                {form.carouselCards.map((card, idx) => (
                  <div key={idx} style={{
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 10
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                        Card {idx + 1}
                      </span>
                      {form.carouselCards.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setForm(f => ({
                              ...f,
                              carouselCards: f.carouselCards.filter((_, i) => i !== idx)
                            }));
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--error)',
                            cursor: 'pointer',
                            fontSize: 18
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Image Preview */}
                    {card.image && (
                      <div style={{
                        width: '100%',
                        height: 120,
                        background: 'var(--surface2)',
                        borderRadius: 8,
                        marginBottom: 8,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={card.image}
                          alt={`Card ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div style="color: var(--error); font-size: 11px;">Invalid image</div>';
                          }}
                        />
                      </div>
                    )}

                    <div className="field" style={{ marginBottom: 8 }}>
                      <label className="label" style={{ fontSize: 11 }}>Image</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="file"
                          accept="image/*"
                          id={`imageUpload-${idx}`}
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              // Check file size (max 5MB)
                              if (file.size > 5 * 1024 * 1024) {
                                alert('Image size must be less than 5MB');
                                return;
                              }

                              // Convert to base64
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const newCards = [...form.carouselCards];
                                newCards[idx].image = reader.result;
                                newCards[idx].imageFile = file;
                                setForm(f => ({ ...f, carouselCards: newCards }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => document.getElementById(`imageUpload-${idx}`).click()}
                          style={{ flex: 1, padding: '8px 12px', fontSize: 12 }}
                        >
                          📁 Upload Image
                        </button>
                        <input
                          placeholder="Or paste image URL"
                          value={card.image && !card.image.startsWith('data:') ? card.image : ''}
                          onChange={(e) => {
                            const newCards = [...form.carouselCards];
                            newCards[idx].image = e.target.value;
                            newCards[idx].imageFile = null;
                            setForm(f => ({ ...f, carouselCards: newCards }));
                          }}
                          style={{ flex: 2, fontSize: 13 }}
                        />
                      </div>
                      <div className="help-text" style={{ marginTop: 4 }}>
                        {card.imageFile ? `📎 ${card.imageFile.name} (${(card.imageFile.size / 1024).toFixed(1)} KB)` : 'Upload from computer or paste URL'}
                      </div>
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label className="label" style={{ fontSize: 11 }}>Card Body Text</label>
                      <textarea
                        placeholder="Description for this card..."
                        value={card.body}
                        onChange={(e) => {
                          const newCards = [...form.carouselCards];
                          newCards[idx].body = e.target.value;
                          setForm(f => ({ ...f, carouselCards: newCards }));
                        }}
                        style={{ fontSize: 13, minHeight: 60 }}
                      />
                    </div>
                  </div>
                ))}
                <div className="help-text">
                  Carousel templates allow you to showcase multiple products or options with images. Upload images from your computer or use URLs.
                </div>
              </div>
            )}

            {form.headerType === "TEXT" && (
              <div className="field">
                <label className="label">Header Text</label>
                <input placeholder="e.g. Order Confirmed ✅" value={form.headerText}
                  onChange={(e) => setForm((f) => ({ ...f, headerText: e.target.value }))} />
              </div>
            )}

            {form.headerType !== "CAROUSEL" && (
              <>
                <div className="field">
                  <label className="label">Body Message *</label>
                  <textarea placeholder="Hello {{1}}, your order #{{2}} has been confirmed."
                    value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>Insert variable:</span>
                    <button
                      type="button"
                      className="component-tag"
                      onClick={insertIncrementalVar}
                      style={{
                        background: 'var(--green)',
                        color: '#fff',
                        border: '1px solid var(--green)',
                        fontWeight: 600
                      }}
                    >
                      + {`{{${nextVarNumber}}}`}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Dynamic variable sample inputs */}
            {detectedVars.length > 0 && (
              <div style={{
                background: "rgba(18,140,126,0.04)",
                border: "1px solid rgba(18,140,126,0.18)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: "var(--green)",
                  marginBottom: 12, display: "flex", alignItems: "center", gap: 6,
                  textTransform: "uppercase", letterSpacing: "0.5px"
                }}>
                  <span></span> Variable Values
                  <span style={{ fontWeight: 400, color: "var(--muted)", textTransform: "none", letterSpacing: 0 }}>
                    — used for preview & sent to Meta as examples
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {detectedVars.map((v) => (
                    <div key={v}>
                      <div style={{
                        fontSize: 11, color: "var(--muted)", marginBottom: 4,
                        display: "flex", alignItems: "center", gap: 6
                      }}>
                        <span style={{
                          background: "var(--green)", color: "#fff",
                          borderRadius: 4, padding: "1px 6px", fontSize: 11, fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace"
                        }}>{`{{${v}}}`}</span>
                        Sample value
                      </div>
                      <input
                        placeholder={`e.g. ${v === "1" ? "John" : v === "2" ? "ORD-123" : v === "amount" ? "₹500" : v === "date" ? "Jan 15" : `value_${v}`}`}
                        value={varSamples[v] || ""}
                        onChange={(e) => setVarSamples((s) => ({ ...s, [v]: e.target.value }))}
                        style={{ fontSize: 13 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="field">
              <label className="label">Footer (optional)</label>
              <input placeholder="Reply STOP to unsubscribe" value={form.footer}
                onChange={(e) => setForm((f) => ({ ...f, footer: e.target.value }))} />
            </div>

            <div className="divider" />

            <div className="row">
              <div className="field">
                <label className="label">Button Type</label>
                <select value={form.buttonType} onChange={(e) => setForm((f) => ({ ...f, buttonType: e.target.value }))}>
                  <option value="NONE">No Button</option>
                  <option value="QUICK_REPLY">Quick Reply</option>
                  <option value="URL">Visit URL</option>
                </select>
              </div>
              {form.buttonType !== "NONE" && (
                <div className="field">
                  <label className="label">Button Text</label>
                  <input placeholder="Track Order" value={form.buttonText}
                    onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))} />
                </div>
              )}
            </div>

            {form.buttonType === "URL" && (
              <div className="field">
                <label className="label">Button URL</label>
                <input placeholder="https://yoursite.com/track/{{1}}" value={form.buttonUrl}
                  onChange={(e) => setForm((f) => ({ ...f, buttonUrl: e.target.value }))} />
              </div>
            )}

            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? <><span className="spinner" /> Creating...</> : "Save"}
            </button>

            {status && (
              <div className={`status-bar status-${status}`}>
                {status === "success" ? "✅ Template created!" : status === "error" ? "❌ Failed — see response" : "⏳ Processing..."}
              </div>
            )}
            {response && <div className="response-box">{response}</div>}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-icon">👁️</div>
              <div><h3>Live Preview</h3><p>How it appears on WhatsApp</p></div>
            </div>
            <div className="card-body">
              <div className="preview-box">
                <div className="preview-label">WhatsApp Message</div>
                {form.headerType === "CAROUSEL" ? (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                      🎠 Carousel Preview ({form.carouselCards.length} cards)
                    </div>
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
                      {form.carouselCards.map((card, idx) => (
                        <div key={idx} className="wa-bubble" style={{ minWidth: 200, maxWidth: 200, padding: 0 }}>
                          <div style={{
                            width: '100%',
                            height: 150,
                            background: card.image ? 'transparent' : 'var(--surface2)',
                            borderRadius: '12px 12px 0 0',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {card.image ? (
                              <img
                                src={card.image}
                                alt={`Card ${idx + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<div style="color: var(--error); font-size: 11px; padding: 10px; text-align: center;">❌ Invalid image</div>';
                                }}
                              />
                            ) : (
                              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                                🖼️<br />No image
                              </div>
                            )}
                          </div>
                          <div style={{ padding: '12px 14px' }}>
                            <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', marginBottom: 8 }}>
                              {card.body || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Card {idx + 1} body...</span>}
                            </div>
                            <div className="wa-time">{getCurrentTime()} ✓✓</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : preview ? (
                  <div className="wa-bubble">
                    <div style={{ whiteSpace: "pre-wrap" }}>{preview}</div>
                    {form.buttonText && form.buttonType !== "NONE" && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.1)", textAlign: "center", color: "#0084ff", fontSize: 13, fontWeight: 500 }}>
                        {form.buttonType === "URL" ? "🔗" : "↩️"} {form.buttonText}
                      </div>
                    )}
                    <div className="wa-time">{getCurrentTime()} ✓✓</div>
                  </div>
                ) : (
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>Start typing to see preview...</div>
                )}
              </div>

              {/* Variable chips summary */}
              {detectedVars.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="label" style={{ marginBottom: 8 }}>Variables Detected</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {detectedVars.map((v) => (
                      <div key={v} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: varSamples[v] ? "rgba(18,140,126,0.08)" : "rgba(214,158,46,0.08)",
                        border: `1px solid ${varSamples[v] ? "rgba(18,140,126,0.2)" : "rgba(214,158,46,0.25)"}`,
                        borderRadius: 6, padding: "3px 8px", fontSize: 12,
                      }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--green)", fontWeight: 700 }}>{`{{${v}}}`}</span>
                        <span style={{ color: "var(--muted)" }}>→</span>
                        <span style={{ color: varSamples[v] ? "var(--text)" : "var(--warn)", fontStyle: varSamples[v] ? "normal" : "italic" }}>
                          {varSamples[v] || "not set"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div className="label">Template Name (API)</div>
                <code style={{ fontSize: 13, color: "var(--green)" }}>
                  {form.name ? form.name.toLowerCase().replace(/\s+/g, "_") : "—"}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateListPage({ creds, onGoToSettings, onUseTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [usedName, setUsedName] = useState("");

  const credsMissing = !creds.token || !creds.wabaId;

  // Auto-fetch templates on component mount
  useEffect(() => {
    if (!credsMissing) {
      loadTemplates();
    }
  }, [creds.token, creds.wabaId]); // Re-fetch when credentials change

  const loadTemplates = async () => {
    if (credsMissing) { onGoToSettings(); return; }
    setLoading(true); setError(""); setTemplates([]);
    try {
      const res = await fetch(
        `${API_BASE}/${creds.wabaId}/message_templates?fields=name,status,category,language,components&limit=100`,
        { headers: { Authorization: `Bearer ${creds.token}` } }
      );
      const data = await res.json();
      if (data.error) { setError(data.error.message); return; }
      setTemplates(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const getBodyText = (components) => {
    const body = (components || []).find((c) => c.type === "BODY");
    return body?.text || "—";
  };

  const getHeaderText = (components) => {
    const h = (components || []).find((c) => c.type === "HEADER");
    if (!h) return null;
    return h.format === "TEXT" ? h.text : `[${h.format}]`;
  };

  const FILTERS = ["ALL", "APPROVED", "PENDING", "REJECTED"];

  const filtered = templates.filter((t) => {
    const matchFilter = filter === "ALL" || t.status === filter;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "ALL" ? templates.length : templates.filter((t) => t.status === f).length;
    return acc;
  }, {});

  const handleUse = (t) => {
    setUsedName(t.name);
    onUseTemplate(t);
    setTimeout(() => setUsedName(""), 2000);
  };

  return (
    <div>
      <div className="section-title">Manage Templates</div>
      <div className="section-sub">View and manage all templates in your WhatsApp Business Account</div>

      {credsMissing && <NoCreditsBanner onGoToSettings={onGoToSettings} />}

      <div className="load-bar">
        <div className="filter-row">
          {FILTERS.map((f) => (
            <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f} {counts[f] > 0 && <span style={{ opacity: 0.7 }}>({counts[f]})</span>}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200, padding: "7px 12px", fontSize: 13 }}
          />
          <button
            className="btn btn-primary"
            style={{ width: "auto", padding: "8px 20px", whiteSpace: "nowrap" }}
            onClick={loadTemplates}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Loading...</> : "🔄 Load Templates"}
          </button>
        </div>
      </div>

      {error && (
        <div className="status-bar status-error" style={{ marginBottom: 16 }}>❌ {error}</div>
      )}

      {!loading && templates.length === 0 && !error && (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>Click <strong>Load Templates</strong> to fetch from your Meta account</p>
        </div>
      )}

      {filtered.length === 0 && templates.length > 0 && (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <p>No templates match your filter</p>
        </div>
      )}

      <div className="template-grid">
        {filtered.map((t, i) => {
          const header = getHeaderText(t.components);
          const body = getBodyText(t.components);
          const footer = (t.components || []).find((c) => c.type === "FOOTER")?.text;
          const buttons = (t.components || []).find((c) => c.type === "BUTTONS")?.buttons || [];
          const status = t.status || "UNKNOWN";

          return (
            <div key={i} className="template-card">
              <div className="template-card-header">
                <div>
                  <div className="template-name">{t.name}</div>
                  <div className="template-lang">🌐 {t.language}</div>
                </div>
                <span className={`template-badge badge-${status}`}>{status}</span>
              </div>

              <div className="template-body-text">
                {header && <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4, fontSize: 12 }}>{header}</div>}
                <div style={{ color: "var(--muted)" }}>{body.length > 120 ? body.slice(0, 120) + "…" : body}</div>
                {footer && <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>{footer}</div>}
                {buttons.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {buttons.map((b, bi) => (
                      <span key={bi} style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 4,
                        background: "rgba(18,140,126,0.08)", color: "var(--green)", border: "1px solid rgba(18,140,126,0.15)"
                      }}>
                        {b.type === "URL" ? "🔗" : "↩️"} {b.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="template-footer-bar">
                <span className="template-category">{t.category}</span>
                <button
                  className="btn-use"
                  disabled={status !== "APPROVED"}
                  title={status !== "APPROVED" ? "Only approved templates can be used" : "Use in Send Message"}
                  onClick={() => handleUse(t)}
                >
                  {usedName === t.name ? "✓ Added!" : "Use →"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SendPage({ creds, onGoToSettings, selectedTemplate, onClearTemplate }) {
  const [form, setForm] = useState({
    to: "", type: "template", templateName: "", language: "en_US", vars: "", textBody: "",
  });
  const [status, setStatus] = useState(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const credsMissing = !creds.token || !creds.phoneId;

  useEffect(() => {
    if (selectedTemplate) {
      setForm((f) => ({
        ...f,
        type: "template",
        templateName: selectedTemplate.name,
        language: selectedTemplate.language || "en_US",
        vars: "",
      }));
    }
  }, [selectedTemplate]);

  const handleSend = async () => {
    if (credsMissing) { onGoToSettings(); return; }
    if (!form.to) { setStatus("error"); setResponse("Recipient phone number is required."); return; }
    setLoading(true); setStatus("loading"); setResponse("Sending message...");

    let payload = { messaging_product: "whatsapp", to: form.to.replace(/\D/g, "") };

    if (form.type === "template") {
      const components = [];
      if (form.vars.trim())
        components.push({ type: "body", parameters: form.vars.split(",").map((v) => ({ type: "text", text: v.trim() })) });
      payload.type = "template";
      payload.template = { name: form.templateName, language: { code: form.language }, ...(components.length ? { components } : {}) };
    } else {
      payload.type = "text";
      payload.text = { body: form.textBody, preview_url: false };
    }

    try {
      const res = await fetch(`${API_BASE}/${creds.phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${creds.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      setStatus(data.messages?.[0]?.id ? "success" : "error");
    } catch (e) {
      setStatus("error"); setResponse(`Error: ${e.message}`);
    } finally { setLoading(false); }
  };

  // Build preview text by substituting variables into template body
  const buildPreview = () => {
    if (!selectedTemplate) return null;
    const vars = form.vars ? form.vars.split(",").map((v) => v.trim()) : [];
    const components = selectedTemplate.components || [];
    const header = components.find((c) => c.type === "HEADER");
    const body = components.find((c) => c.type === "BODY");
    const footer = components.find((c) => c.type === "FOOTER");
    const buttons = components.find((c) => c.type === "BUTTONS");

    const substituteVars = (text) => {
      if (!text) return "";
      return text.replace(/\{\{(\d+)\}\}/g, (_, n) => {
        const val = vars[parseInt(n) - 1];
        return val ? `${val}` : `{{${n}}}`;
      });
    };

    return {
      header: header ? (header.format === "TEXT" ? substituteVars(header.text) : `[${header.format}]`) : null,
      headerFormat: header?.format,
      body: body ? substituteVars(body.text) : null,
      footer: footer ? footer.text : null,
      buttons: buttons?.buttons || [],
    };
  };

  const preview = buildPreview();
  const freeTextPreview = form.type === "text" && form.textBody ? form.textBody : null;

  return (
    <div>
      <div className="section-title">Send Message</div>
      <div className="section-sub">Send a WhatsApp message to any number via the API</div>
      {credsMissing && <NoCreditsBanner onGoToSettings={onGoToSettings} />}

      {selectedTemplate && (
        <div style={{
          background: "rgba(18,140,126,0.06)", border: "1px solid rgba(18,140,126,0.2)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 20,
          display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13
        }}>
          <div>
            <span style={{ color: "var(--green)", fontWeight: 600 }}>📋 Template loaded: </span>
            <code style={{ color: "var(--text)" }}>{selectedTemplate.name}</code>
            <span style={{ color: "var(--muted)", marginLeft: 10 }}>({selectedTemplate.language})</span>
          </div>
          <button onClick={onClearTemplate} style={{
            background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 20, lineHeight: 1
          }}>×</button>
        </div>
      )}

      {/* 3-column layout: form | preview | response */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px 1fr", gap: 20, maxWidth: "100%" }}>

        {/* Col 1: Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon">💬</div>
            <div><h3>Message Details</h3><p>Compose and send your message</p></div>
          </div>
          <div className="card-body">
            <div className="field">
              <label className="label">Recipient Phone Number *</label>
              <input placeholder="+91 98765 43210 (with country code)" value={form.to}
                onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} />
              <div className="help-text">Include country code, e.g. +919876543210</div>
            </div>

            <div className="field">
              <label className="label">Message Type</label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                {["template", "text"].map((t) => (
                  <button key={t} className="btn btn-outline" style={{
                    flex: 1,
                    borderColor: form.type === t ? "var(--green)" : "var(--border)",
                    color: form.type === t ? "var(--green)" : "var(--muted)",
                    background: form.type === t ? "rgba(18,140,126,0.06)" : "transparent",
                  }} onClick={() => setForm((f) => ({ ...f, type: t }))}>
                    {t === "template" ? "📋 Template" : "💬 Free Text"}
                  </button>
                ))}
              </div>
            </div>

            {form.type === "template" ? (
              <>
                <div className="row">
                  <div className="field">
                    <label className="label">Template Name *</label>
                    <input placeholder="order_confirmation" value={form.templateName}
                      onChange={(e) => setForm((f) => ({ ...f, templateName: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="label">Language</label>
                    <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}>
                      <option value="en_US">English (US)</option>
                      <option value="en_GB">English (UK)</option>
                      <option value="hi">Hindi</option>
                      <option value="ar">Arabic</option>
                      <option value="es">Spanish</option>
                      <option value="pt_BR">Portuguese (BR)</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Variables (comma-separated)</label>
                  <input placeholder="e.g. John, #ORD123, Jan 15" value={form.vars}
                    onChange={(e) => setForm((f) => ({ ...f, vars: e.target.value }))} />
                  <div className="help-text">Values replace {`{{1}}, {{2}}`} etc. in template body</div>
                </div>
              </>
            ) : (
              <div className="field">
                <label className="label">Message Text *</label>
                <textarea placeholder="Type your message here..." value={form.textBody}
                  onChange={(e) => setForm((f) => ({ ...f, textBody: e.target.value }))} />
                <div className="help-text">⚠️ Free text only works within 24hr customer service window</div>
              </div>
            )}

            <button className="btn btn-primary" onClick={handleSend} disabled={loading}>
              {loading ? <><span className="spinner" /> Sending...</> : "Send Message"}
            </button>

            {status && (
              <div className={`status-bar status-${status}`}>
                {status === "success" ? "✅ Message sent successfully!" : status === "error" ? "❌ Failed — check response" : "⏳ Sending..."}
              </div>
            )}
          </div>
        </div>

        {/* Col 2: WhatsApp Preview */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header" style={{ padding: "14px 16px" }}>
            <div className="card-icon" style={{ width: 30, height: 30, fontSize: 14 }}>👁️</div>
            <div><h3 style={{ fontSize: 14 }}>Preview</h3><p>WhatsApp view</p></div>
          </div>
          <div className="card-body" style={{ flex: 1, padding: 14 }}>
            {/* Phone frame */}
            <div style={{
              background: "#e5ddd5",
              borderRadius: 16,
              padding: "12px 10px",
              minHeight: 280,
              backgroundImage: "radial-gradient(circle, #d4c9bf 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: 8,
            }}>
              {/* WhatsApp header bar */}
              <div style={{
                position: "relative", marginTop: -12, marginLeft: -10, marginRight: -10,
                background: "#075E54", padding: "8px 12px", borderRadius: "16px 16px 0 0",
                display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
                <div>
                  <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>Business</div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>online</div>
                </div>
              </div>

              {preview ? (
                <div style={{
                  background: "#fff",
                  borderRadius: "0px 12px 12px 12px",
                  padding: "10px 12px",
                  maxWidth: "92%",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.13)",
                  position: "relative",
                }}>
                  {/* Triangle */}
                  <div style={{
                    position: "absolute", top: 0, left: -8,
                    width: 0, height: 0,
                    borderTop: "8px solid #fff",
                    borderLeft: "8px solid transparent",
                  }} />

                  {/* Header */}
                  {preview.header && (
                    <div style={{
                      marginBottom: 8,
                      padding: preview.headerFormat !== "TEXT" ? "20px 10px" : "0",
                      background: preview.headerFormat !== "TEXT" ? "#f0f0f0" : "transparent",
                      borderRadius: preview.headerFormat !== "TEXT" ? 8 : 0,
                      textAlign: preview.headerFormat !== "TEXT" ? "center" : "left",
                    }}>
                      {preview.headerFormat === "IMAGE" && <div style={{ fontSize: 24 }}>🖼️</div>}
                      {preview.headerFormat === "VIDEO" && <div style={{ fontSize: 24 }}>🎬</div>}
                      {preview.headerFormat === "DOCUMENT" && <div style={{ fontSize: 24 }}>📄</div>}
                      {preview.headerFormat === "TEXT" && (
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#111", lineHeight: 1.4 }}>{preview.header}</div>
                      )}
                    </div>
                  )}

                  {/* Body */}
                  {preview.body && (
                    <div style={{ fontSize: 13, color: "#111", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {preview.body}
                    </div>
                  )}

                  {/* Footer */}
                  {preview.footer && (
                    <div style={{ fontSize: 11, color: "#888", marginTop: 6, fontStyle: "italic" }}>{preview.footer}</div>
                  )}

                  {/* Time */}
                  <div style={{ fontSize: 10, color: "#aaa", textAlign: "right", marginTop: 4 }}>
                    {getCurrentTime()} ✓✓
                  </div>

                  {/* Buttons */}
                  {preview.buttons.length > 0 && (
                    <div style={{ borderTop: "1px solid #eee", marginTop: 8, paddingTop: 6 }}>
                      {preview.buttons.map((btn, i) => (
                        <div key={i} style={{
                          textAlign: "center", color: "#00a5f4", fontSize: 13,
                          fontWeight: 500, padding: "4px 0",
                          borderBottom: i < preview.buttons.length - 1 ? "1px solid #eee" : "none"
                        }}>
                          {btn.type === "URL" ? "🔗" : btn.type === "PHONE_NUMBER" ? "📞" : "↩️"} {btn.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : freeTextPreview ? (
                <div style={{
                  background: "#DCF8C6",
                  borderRadius: "12px 12px 0px 12px",
                  padding: "10px 12px",
                  maxWidth: "92%",
                  alignSelf: "flex-end",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.13)",
                }}>
                  <div style={{ fontSize: 13, color: "#111", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{freeTextPreview}</div>
                  <div style={{ fontSize: 10, color: "#777", textAlign: "right", marginTop: 4 }}>{getCurrentTime()} ✓✓</div>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#aaa", fontSize: 12, paddingBottom: 20 }}>
                  {form.type === "template" ? "Select a template to preview" : "Type a message to preview"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Col 3: API Response */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header">
            <div className="card-icon">📡</div>
            <div><h3>API Response</h3><p>Raw response from Meta</p></div>
            {response && (
              <button onClick={() => setResponse("")}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}>×</button>
            )}
          </div>
          <div className="card-body" style={{ flex: 1 }}>
            {response ? (
              <div style={{
                background: "#0d1117", borderRadius: 12, padding: 16,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                color: "#7ee787", lineHeight: 1.7, height: "100%", minHeight: 200,
                overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
              }}>
                {response}
              </div>
            ) : (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                height: "100%", minHeight: 200, color: "var(--muted)", gap: 10
              }}>
                <div style={{ fontSize: 36 }}>📡</div>
                <div style={{ fontSize: 13 }}>Response will appear here after sending</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function EmbeddedSignupPage({ onCredentialsReceived, onOpenSettings }) {
  const [signupData, setSignupData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  const [phoneDetails, setPhoneDetails] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const APP_ID = '833458239205319';
  const CONFIG_ID = '2087756442076627';

  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const fetchPhoneNumberDetails = async (phoneNumberId, accessToken) => {
    if (!phoneNumberId || !accessToken) {
      addDebugLog('❌ Missing phone number ID or access token');
      return;
    }

    setFetchingDetails(true);
    addDebugLog(`🔍 Fetching details for phone number: ${phoneNumberId}`);

    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}?fields=verified_name,code_verification_status,display_phone_number,quality_rating,messaging_limit_tier,account_mode,is_official_business_account,name_status,new_name_status,certificate,two_factor_enabled`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      addDebugLog(`✅ Phone details received: ${JSON.stringify(data)}`);

      if (data.error) {
        setError(`Failed to fetch details: ${data.error.message}`);
      } else {
        setPhoneDetails(data);
      }
    } catch (err) {
      addDebugLog(`❌ Error fetching details: ${err.message}`);
      setError(`Failed to fetch phone details: ${err.message}`);
    } finally {
      setFetchingDetails(false);
    }
  };

  useEffect(() => {
    // Load Facebook SDK
    if (!window.FB) {
      // Define fbAsyncInit before loading the SDK
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: APP_ID,
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v24.0'
        });
        setSdkLoaded(true);
        addDebugLog('✅ Facebook SDK loaded successfully');
      };

      // Load the SDK script
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);
    } else {
      setSdkLoaded(true);
    }

    // Listen for messages from Facebook
    const handleMessage = (event) => {
      // Log all messages for debugging
      addDebugLog(`📨 Message received from: ${event.origin}`);

      // Verify origin for security
      if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') {
        return;
      }

      try {
        const data = JSON.parse(event.data);
        addDebugLog(`✅ Parsed message: ${JSON.stringify(data)}`);

        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          addDebugLog(`✅ WhatsApp Embedded Signup event: ${data.event}`);

          if (data.event === 'FINISH') {
            const { phone_number_id, waba_id } = data.data;
            addDebugLog(`✅ Phone Number ID: ${phone_number_id}`);
            addDebugLog(`✅ WABA ID: ${waba_id}`);

            setSignupData(prev => {
              const updated = {
                ...prev,
                phoneNumberId: phone_number_id,
                wabaId: waba_id,
                success: true
              };

              // Save account to database with phoneId & wabaId (even without token)
              if (onCredentialsReceived) {
                onCredentialsReceived({
                  phoneId: phone_number_id,
                  wabaId: waba_id,
                  token: updated.accessToken || ""
                }).catch(err => console.error('Error saving credentials:', err));
              }

              return updated;
            });

            setLoading(false);
          } else if (data.event === 'CANCEL') {
            const { current_step } = data.data;
            addDebugLog(`⚠️ Cancelled at step: ${current_step}`);
            setError(`Signup cancelled at step: ${current_step}`);
            setLoading(false);
          } else if (data.event === 'ERROR') {
            const { error_message } = data.data;
            addDebugLog(`❌ Error: ${error_message}`);
            setError(error_message || 'An error occurred during signup');
            setLoading(false);
          }
        }
      } catch (e) {
        // Not JSON, might be other messages
        addDebugLog(`ℹ️ Non-JSON message: ${event.data}`);
      }
    };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);

const launchWhatsAppSignup = () => {
  if (!window.FB) {
    setError('Facebook SDK not loaded yet. Please wait a moment and try again.');
    return;
  }

  setLoading(true);
  setError(null);
  addDebugLog('🚀 Launching WhatsApp signup...');

  // Launch Facebook login with WhatsApp signup
  window.FB.login(
    function (response) {
      addDebugLog(`📥 FB.login response: ${JSON.stringify(response)}`);

      if (response.authResponse) {
        const code = response.authResponse.code;
        addDebugLog(`✅ Authorization code received: ${code ? code.substring(0, 20) + '...' : 'none'}`);

        // Try to exchange code for access token automatically
        // if (code) {
        //   (async () => {
        //     try {
        //       addDebugLog('🔄 Exchanging code for access token...');
        //       const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
        //       const tokenResponse = await fetch(`${backendUrl}/api/exchange-token`, {
        //         method: 'POST',
        //         headers: {
        //           'Content-Type': 'application/json'
        //         },
        //         body: JSON.stringify({ code })
        //       });

        //       const tokenData = await tokenResponse.json();

        //       if (tokenData.success && tokenData.access_token) {
        //         addDebugLog(`✅ Access token received: ${tokenData.access_token.substring(0, 20)}...`);

        //         setSignupData(prev => ({
        //           ...prev,
        //           authCode: code,
        //           accessToken: tokenData.access_token,
        //           authResponse: response.authResponse
        //         }));

        //         // Also update parent credentials with the token
        //         if (onCredentialsReceived) {
        //           onCredentialsReceived({
        //             phoneId: signupData?.phoneNumberId,
        //             wabaId: signupData?.wabaId,
        //             token: tokenData.access_token
        //           }).catch(err => console.error('Error saving credentials:', err));
        //         }
        //       } else {
        //         addDebugLog(`⚠️ Token exchange failed: ${tokenData.error || 'Unknown error'}`);
        //         // Still save the code so user can exchange manually
        //         setSignupData(prev => ({
        //           ...prev,
        //           authCode: code,
        //           authResponse: response.authResponse,
        //           tokenExchangeError: tokenData.error
        //         }));
        //       }
        //     } catch (error) {
        //       addDebugLog(`❌ Backend error: ${error.message}`);
        //       // Backend not available, save code for manual exchange
        //       setSignupData(prev => ({
        //         ...prev,
        //         authCode: code,
        //         authResponse: response.authResponse,
        //         tokenExchangeError: 'Backend server not available. You can exchange the code manually.'
        //       }));
        //     }
        //   })();
        // }

        if (code) {
          (async () => {
            try {
              addDebugLog('🔄 Exchanging code for access token...');

              // ✅ Use api.js helper — handles auth token automatically
              // Note: phoneId/wabaId may not be available yet due to race condition
              // They are handled in the FINISH event handler below
              const tokenData = await whatsappAPI.exchangeToken(
                code,
                null,  // phoneId comes from FINISH event
                null   // wabaId comes from FINISH event
              );

              if (tokenData.success && tokenData.access_token) {
                addDebugLog(`✅ Access token received: ${tokenData.access_token.substring(0, 20)}...`);

                setSignupData(prev => ({
                  ...prev,
                  authCode: code,
                  accessToken: tokenData.access_token,
                  authResponse: response.authResponse
                }));

              } else {
                addDebugLog(`⚠️ Token exchange failed: ${tokenData.error}`);
                setSignupData(prev => ({
                  ...prev,
                  authCode: code,
                  authResponse: response.authResponse,
                  tokenExchangeError: tokenData.error || 'Token exchange failed'
                }));
              }
            } catch (error) {
              addDebugLog(`❌ Backend error: ${error.message}`);
              setSignupData(prev => ({
                ...prev,
                authCode: code,
                authResponse: response.authResponse,
                tokenExchangeError: error.message
              }));
            }
          })();
        }
      } else {
        addDebugLog('❌ Login was cancelled or not authorized');
        setError('Login was cancelled or not authorized');
        setLoading(false);
      }
    },
    {
      config_id: CONFIG_ID,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        // version: 'v3'
        setup: {},
        featureType: 'whatsapp_business_app_onboarding',
        sessionInfoVersion: '3'
      }
    }
  );
};

return (
  <div>
    <div className="section-title">WhatsApp Signup</div>
    <div className="section-sub">Connect your WhatsApp Business Account using Facebook's Embedded Signup</div>

    <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="card-header">
        <div className="card-icon">🔗</div>
        <div>
          <h3>Connect WhatsApp Business</h3>
          <p>Authorize your WhatsApp Business Account</p>
        </div>
      </div>
      <div className="card-body">
        <div style={{
          background: 'rgba(18,140,126,0.04)',
          border: '1px solid rgba(18,140,126,0.18)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20
        }}>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text)' }}>
            <p style={{ marginBottom: 12 }}>
              <strong>📱 What is Embedded Signup?</strong>
            </p>
            <p style={{ marginBottom: 8 }}>
              Embedded Signup allows you to connect your WhatsApp Business Account directly through Facebook,
              without manually copying tokens and IDs.
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>How it works:</strong>
            </p>
            <ul style={{ marginLeft: 20, marginBottom: 12 }}>
              <li>Click the button below to launch Facebook login</li>
              <li>Complete the WhatsApp Business signup flow</li>
              <li>Your Phone Number ID and WABA ID will appear automatically</li>
              <li>Use these credentials in the Settings (⚙️) to make API calls</li>
            </ul>
          </div>
        </div>

        {!sdkLoaded && (
          <div className="status-bar status-loading">
            <span className="spinner-dark" />
            Loading Facebook SDK...
          </div>
        )}

        {!signupData ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <button
              className="btn btn-primary"
              onClick={launchWhatsAppSignup}
              disabled={loading || !sdkLoaded}
              style={{ maxWidth: 320, margin: '0 auto', fontSize: 16, padding: '14px 24px' }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Opening Signup...
                </>
              ) : (
                <>
                  <span style={{ fontSize: 20, marginRight: 8 }}></span>
                  Login with Facebook
                </>
              )}
            </button>
            <div className="help-text" style={{ marginTop: 16, textAlign: 'center' }}>
              {sdkLoaded ? 'Click to start the WhatsApp signup flow' : 'Please wait for SDK to load...'}
            </div>
          </div>
        ) : (
          <div>
            <div className="status-bar status-success">
              ✅ Successfully connected to WhatsApp Business!
            </div>
            <div style={{ marginTop: 20 }}>
              {signupData.phoneNumberId && (
                <div className="saved-row">
                  <div>
                    <div className="saved-key">Phone Number ID</div>
                    <div className="saved-val">{signupData.phoneNumberId}</div>
                  </div>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      navigator.clipboard.writeText(signupData.phoneNumberId);
                    }}
                    style={{ padding: '6px 12px' }}
                  >
                    📋 Copy
                  </button>
                </div>
              )}
              {signupData.wabaId && (
                <div className="saved-row">
                  <div>
                    <div className="saved-key">WABA ID</div>
                    <div className="saved-val">{signupData.wabaId}</div>
                  </div>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      navigator.clipboard.writeText(signupData.wabaId);
                    }}
                    style={{ padding: '6px 12px' }}
                  >
                    📋 Copy
                  </button>
                </div>
              )}
              {signupData.authCode && (
                <div>
                  {signupData.accessToken ? (
                    <div>
                      <div className="saved-row">
                        <div style={{ flex: 1 }}>
                          <div className="saved-key">✅ Access Token (Auto-Generated)</div>
                          <div className="saved-val" style={{ fontSize: 11, wordBreak: 'break-all' }}>
                            {signupData.accessToken}
                          </div>
                        </div>
                        <button
                          className="btn-outline"
                          onClick={() => {
                            navigator.clipboard.writeText(signupData.accessToken);
                          }}
                          style={{ padding: '6px 12px' }}
                        >
                          📋 Copy
                        </button>
                      </div>
                      <div style={{
                        background: 'rgba(18,140,126,0.08)',
                        border: '1px solid rgba(18,140,126,0.2)',
                        borderRadius: 10,
                        padding: 12,
                        marginTop: 12,
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: 'var(--green)'
                      }}>
                        ✅ Your authorization code was automatically exchanged for an access token!
                        The token has been saved to your credentials.
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="saved-row">
                        <div style={{ flex: 1 }}>
                          <div className="saved-key">Authorization Code</div>
                          <div className="saved-val" style={{ fontSize: 11, wordBreak: 'break-all' }}>
                            {signupData.authCode}
                          </div>
                        </div>
                        <button
                          className="btn-outline"
                          onClick={() => {
                            navigator.clipboard.writeText(signupData.authCode);
                          }}
                          style={{ padding: '6px 12px' }}
                        >
                          📋 Copy
                        </button>
                      </div>
                      {signupData.tokenExchangeError && (
                        <div style={{
                          background: 'rgba(214,158,46,0.08)',
                          border: '1px solid rgba(214,158,46,0.25)',
                          borderRadius: 10,
                          padding: 12,
                          marginTop: 12,
                          fontSize: 12,
                          lineHeight: 1.6
                        }}>
                          <strong>⚠️ Automatic Token Exchange Failed</strong>
                          <p style={{ marginTop: 6 }}>
                            {signupData.tokenExchangeError}
                          </p>
                        </div>
                      )}
                      <div style={{
                        background: 'rgba(214,158,46,0.08)',
                        border: '1px solid rgba(214,158,46,0.25)',
                        borderRadius: 10,
                        padding: 12,
                        marginTop: 12,
                        fontSize: 12,
                        lineHeight: 1.6
                      }}>
                        <strong>⚠️ Exchange Code for Access Token</strong>
                        <p style={{ marginTop: 6, marginBottom: 8 }}>
                          This authorization code must be exchanged for an access token on your backend server.
                        </p>
                        <details style={{ marginTop: 8 }}>
                          <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text)' }}>
                            📖 How to Exchange Code (Click to expand)
                          </summary>
                          <div style={{ marginTop: 10, paddingLeft: 10 }}>
                            <p style={{ marginBottom: 8 }}><strong>Backend API Call:</strong></p>
                            <pre style={{
                              background: '#1a202c',
                              color: '#68d391',
                              padding: 10,
                              borderRadius: 6,
                              fontSize: 11,
                              overflow: 'auto',
                              fontFamily: "'JetBrains Mono', monospace"
                            }}>
                              {`POST https://graph.facebook.com/v19.0/oauth/access_token

Parameters:
- client_id: ${APP_ID}
- client_secret: YOUR_APP_SECRET
- code: ${signupData.authCode.substring(0, 30)}...
- redirect_uri: YOUR_REDIRECT_URI`}
                            </pre>
                            <p style={{ marginTop: 10, marginBottom: 6 }}><strong>Response:</strong></p>
                            <pre style={{
                              background: '#1a202c',
                              color: '#68d391',
                              padding: 10,
                              borderRadius: 6,
                              fontSize: 11,
                              fontFamily: "'JetBrains Mono', monospace"
                            }}>
                              {`{
  "access_token": "EAAxxxxx...",
  "token_type": "bearer"
}`}
                            </pre>
                            <p style={{ marginTop: 10, color: 'var(--error)' }}>
                              ⚠️ Never expose your App Secret in frontend code!
                            </p>
                          </div>
                        </details>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{
              background: 'rgba(18,140,126,0.04)',
              border: '1px solid rgba(18,140,126,0.18)',
              borderRadius: 12,
              padding: 16,
              marginTop: 20,
              fontSize: 13,
              lineHeight: 1.6
            }}>
              <strong>🔑 How to Get Access Token:</strong>
              <div style={{ marginTop: 10 }}>
                <p style={{ marginBottom: 8 }}><strong>Option 1: Exchange Authorization Code (Recommended)</strong></p>
                <ul style={{ marginLeft: 20, marginBottom: 12 }}>
                  <li>Use the authorization code above</li>
                  <li>Exchange it on your backend server (see details above)</li>
                  <li>This gives you a System User access token</li>
                </ul>

                <p style={{ marginBottom: 8 }}><strong>Option 2: Get Token from Meta Developer Console</strong></p>
                <ul style={{ marginLeft: 20, marginBottom: 12 }}>
                  <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)' }}>Meta for Developers</a></li>
                  <li>Select your app → WhatsApp → API Setup</li>
                  <li>Generate a temporary access token (24 hours)</li>
                  <li>Or create a System User for permanent token</li>
                </ul>

                <p style={{ marginBottom: 8 }}><strong>Option 3: Create System User Token</strong></p>
                <ul style={{ marginLeft: 20 }}>
                  <li>Go to <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)' }}>Meta Business Suite</a></li>
                  <li>Business Settings → Users → System Users</li>
                  <li>Create System User → Generate Token</li>
                  <li>Select your app and required permissions</li>
                  <li>This token never expires!</li>
                </ul>
              </div>
            </div>

            {!phoneDetails && (
              <div style={{
                background: 'rgba(214,158,46,0.08)',
                border: '1px solid rgba(214,158,46,0.25)',
                borderRadius: 12,
                padding: 16,
                marginTop: 20
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>
                  📊 Want to see detailed phone number info?
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>
                  Enter your Access Token to fetch Number Status, Quality Score, Message Limit, and 2FA status.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="password"
                    placeholder="Enter Access Token (EAAxxxxx...)"
                    id="accessTokenInput"
                    style={{ flex: 1, fontSize: 13 }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const token = document.getElementById('accessTokenInput').value;
                      if (token && signupData.phoneNumberId) {
                        fetchPhoneNumberDetails(signupData.phoneNumberId, token);
                      } else {
                        setError('Please enter an access token');
                      }
                    }}
                    disabled={fetchingDetails}
                    style={{ width: 'auto', padding: '10px 20px' }}
                  >
                    {fetchingDetails ? (
                      <>
                        <span className="spinner" />
                        Fetching...
                      </>
                    ) : (
                      '🔍 Fetch Details'
                    )}
                  </button>
                </div>
              </div>
            )}

            <div style={{
              background: 'rgba(18,140,126,0.04)',
              border: '1px solid rgba(18,140,126,0.18)',
              borderRadius: 12,
              padding: 16,
              marginTop: 20,
              fontSize: 13,
              lineHeight: 1.6
            }}>
              <strong>✅ Credentials Saved!</strong>
              <p style={{ marginTop: 8, marginBottom: 12 }}>
                Your Phone Number ID and WABA ID have been automatically saved to the app.
              </p>
              <strong>Next Step:</strong>
              <ol style={{ marginLeft: 20, marginTop: 8, marginBottom: 12 }}>
                <li>Add your Access Token to complete the setup</li>
                <li>Then you can create templates and send messages!</li>
              </ol>
              {onOpenSettings && (
                <button
                  className="btn btn-primary"
                  onClick={onOpenSettings}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  ⚙️ Open Settings to Add Access Token
                </button>
              )}
            </div>

            {phoneDetails && (
              <div style={{ marginTop: 20 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 12,
                  color: 'var(--text)'
                }}>
                  📊 Phone Number Details
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12
                }}>
                  <div style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 16
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Number Status
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18 }}>📱</span>
                      {phoneDetails.code_verification_status === 'VERIFIED' ? 'CONNECTED' : phoneDetails.code_verification_status || 'UNKNOWN'}
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 16
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Quality Score
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18 }}>
                        {phoneDetails.quality_rating === 'GREEN' ? '👍' :
                          phoneDetails.quality_rating === 'YELLOW' ? '⚠️' :
                            phoneDetails.quality_rating === 'RED' ? '❌' : '❓'}
                      </span>
                      <span style={{
                        color: phoneDetails.quality_rating === 'GREEN' ? 'var(--green)' :
                          phoneDetails.quality_rating === 'YELLOW' ? 'var(--warn)' :
                            phoneDetails.quality_rating === 'RED' ? 'var(--error)' : 'var(--muted)'
                      }}>
                        {phoneDetails.quality_rating || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 16
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Message Limit
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18 }}>💬</span>
                      {phoneDetails.messaging_limit_tier === 'TIER_1K' ? '1K users/day' :
                        phoneDetails.messaging_limit_tier === 'TIER_10K' ? '10K users/day' :
                          phoneDetails.messaging_limit_tier === 'TIER_100K' ? '100K users/day' :
                            phoneDetails.messaging_limit_tier === 'TIER_UNLIMITED' ? 'Unlimited' :
                              phoneDetails.messaging_limit_tier || 'Unknown'}
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 16
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      2FA Enabled
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18 }}>🔐</span>
                      {phoneDetails.two_factor_enabled ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>

                {phoneDetails.display_phone_number && (
                  <div className="saved-row" style={{ marginTop: 12 }}>
                    <div>
                      <div className="saved-key">Display Phone Number</div>
                      <div className="saved-val">{phoneDetails.display_phone_number}</div>
                    </div>
                  </div>
                )}

                {phoneDetails.verified_name && (
                  <div className="saved-row">
                    <div>
                      <div className="saved-key">Verified Name</div>
                      <div className="saved-val">{phoneDetails.verified_name}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              className="btn btn-outline"
              onClick={() => {
                setSignupData(null);
                setError(null);
                setLoading(false);
                setPhoneDetails(null);
              }}
              style={{ marginTop: 16, width: '100%' }}
            >
              Connect Another Account
            </button>
          </div>
        )}

        {error && (
          <div className="status-bar status-error" style={{ marginTop: 16 }}>
            ❌ {error}
          </div>
        )}

        {/* Debug Log - Commented out for production
          {debugInfo.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ 
                fontSize: 12, 
                fontWeight: 600, 
                color: 'var(--muted)', 
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>🔍 Debug Log</span>
                <button 
                  className="btn-outline" 
                  onClick={() => setDebugInfo([])}
                  style={{ padding: '4px 10px', fontSize: 11 }}
                >
                  Clear
                </button>
              </div>
              <div style={{ 
                background: '#1a202c', 
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 12,
                maxHeight: 200,
                overflowY: 'auto',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: '#68d391',
                lineHeight: 1.6
              }}>
                {debugInfo.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}
          */}
      </div>
    </div>
  </div>
);
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("embedded-signup");

  // Multi-account state - now synced with backend
  const [accounts, setAccounts] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState(() => {
    return localStorage.getItem('current_account_id') || null;
  });

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authAPI.isAuthenticated()) {
        try {
          const result = await authAPI.getCurrentUser();
          setUser(result.user);
          setIsAuthenticated(true);
          // Load accounts after authentication
          await loadAccounts();
        } catch (error) {
          console.error('Auth check failed:', error);
          authAPI.logout();
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Load accounts from backend
  const loadAccounts = async () => {
    try {
      const result = await accountsAPI.getAll();
      setAccounts(result.accounts);

      // Set first account as current if none selected
      if (!currentAccountId && result.accounts.length > 0) {
        setCurrentAccountId(result.accounts[0].id);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  // Get current account credentials
  const currentAccount = accounts.find(acc => acc.id === currentAccountId);
  const creds = currentAccount ? {
    token: currentAccount.token,
    wabaId: currentAccount.wabaId,
    phoneId: currentAccount.phoneId
  } : {
    token: "",
    wabaId: "",
    phoneId: ""
  };

  const credsSaved = creds.token && creds.wabaId && creds.phoneId;

  // Save current account ID to localStorage
  useEffect(() => {
    if (currentAccountId) {
      localStorage.setItem('current_account_id', currentAccountId);
    }
  }, [currentAccountId]);

  const handleUseTemplate = (t) => {
    setSelectedTemplate(t);
    setTab("send");
  };

  const handleSaveCreds = async (newCreds) => {
    if (currentAccount) {
      try {
        // Update account in backend
        await accountsAPI.update(currentAccountId, newCreds);
        // Reload accounts from backend
        await loadAccounts();
      } catch (error) {
        console.error('Failed to update credentials:', error);
        alert('Failed to save credentials. Please try again.');
      }
    }
  };

  const handleCredentialsFromSignup = async (signupCreds) => {

    console.log('📥 Received signup creds:', JSON.stringify(signupCreds));
    // Create new account in backend
    const accountName = `Account ${signupCreds.phoneId.slice(-4)}`;

    try {
      const result = await accountsAPI.create(
        accountName,
        signupCreds.phoneId,
        signupCreds.wabaId,
        signupCreds.token || ""
      );

      // Reload accounts and set new account as current
      await loadAccounts();
      setCurrentAccountId(result.account.id);

      // Show notification
      if (signupCreds.token) {
        alert(`✅ Complete! New account added and activated!\n\nAccount: ${accountName}\nPhone Number ID: ${signupCreds.phoneId}\nWABA ID: ${signupCreds.wabaId}\nAccess Token: ${signupCreds.token.substring(0, 20)}...\n\nYou're ready to use the API!`);
      } else {
        alert(`✅ New account added!\n\nAccount: ${accountName}\nPhone Number ID: ${signupCreds.phoneId}\nWABA ID: ${signupCreds.wabaId}\n\nDon't forget to add your Access Token in Settings (⚙️) to start using the API.`);
      }
    } catch (error) {
      console.error('Failed to create account:', error);
      alert('Failed to save account. Please try again.');
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    loadAccounts();
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
    setAccounts([]);
    setCurrentAccountId(null);
  };

  // Show loading screen
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>💬</div>
          <p style={{ color: '#666' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app">
      <style>{styles}</style>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ API Settings</h3>
              <button className="modal-close" onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className="modal-body">
              <SettingsPage creds={creds} onSave={handleSaveCreds} onClose={() => setShowSettings(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="header">
        <div className="logo">
          <img src="/logo192.png" alt="Logo" style={{ width: 48, height: 48 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="header-title">WhatsApp Business</div>
          <div className="header-sub">Template Manager & Message Sender</div>
          {currentAccount && (
            <div style={{
              fontSize: '12px',
              color: '#25D366',
              marginTop: '4px',
              fontWeight: 'bold'
            }}>
              📱 {currentAccount.name}
            </div>
          )}
        </div>
        <div className="header-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user && (
            <div style={{
              fontSize: '14px',
              color: '#666',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>👤</span>
              <span>{user.name || user.email}</span>
            </div>
          )}
          <button
            className={`gear-btn ${!credsSaved ? "has-warning" : ""}`}
            onClick={() => setShowSettings(true)}
            title="Settings"
            style={{
              background: 'transparent',
              color: '#666',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              transition: 'all 0.3s'
            }}
          >
            ⚙️
          </button>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
            }}
          >
            <span style={{ fontSize: '16px' }}></span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "embedded-signup" ? "active" : ""}`} onClick={() => setTab("embedded-signup")}>
          <span className="tab-icon">🔗</span> Signup
        </button>
        <button className={`tab ${tab === "templates-list" ? "active" : ""}`} onClick={() => setTab("templates-list")}>
          <span className="tab-icon">📂</span> Manage Templates
        </button>
        <button className={`tab ${tab === "template" ? "active" : ""}`} onClick={() => setTab("template")}>
          <span className="tab-icon">📝</span> Create Template
        </button>
        <button className={`tab ${tab === "send" ? "active" : ""}`} onClick={() => setTab("send")}>
          <span className="tab-icon">📤</span> Send Message
        </button>
      </div>

      <div className={tab === "send" ? "main-wide" : "main"}>
        {tab === "embedded-signup" && (
          <EmbeddedSignupPage
            onCredentialsReceived={handleCredentialsFromSignup}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
        {tab === "templates-list" && (
          <TemplateListPage
            creds={creds}
            onGoToSettings={() => setShowSettings(true)}
            onUseTemplate={handleUseTemplate}
          />
        )}
        {tab === "template" && <TemplatePage creds={creds} onGoToSettings={() => setShowSettings(true)} />}
        {tab === "send" && (
          <SendPage
            creds={creds}
            onGoToSettings={() => setShowSettings(true)}
            selectedTemplate={selectedTemplate}
            onClearTemplate={() => setSelectedTemplate(null)}
          />
        )}
      </div>
    </div>
  );
}
