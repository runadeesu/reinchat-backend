import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthModalProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Server Config State
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(api.getServerUrl());
  const [configSavedMsg, setConfigSavedMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!accountId || !displayName || !email || !password) {
        setError('すべての項目を入力してください。');
        return;
      }
      const res = await api.register({ accountId, displayName, email, password });
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || '登録に失敗しました。');
      }
    } else {
      if (!accountId || !password) {
        setError('アカウントIDとパスワードを入力してください。');
        return;
      }
      const res = await api.login({ accountId, password });
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'ログインに失敗しました。');
      }
    }
  };

  const handleSaveServerUrl = (url: string) => {
    api.setServerUrl(url);
    setServerUrlInput(api.getServerUrl());
    setConfigSavedMsg('接続先サーバーアドレスを更新しました。');
    setTimeout(() => setConfigSavedMsg(''), 3000);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card" style={{ width: '400px', padding: '32px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px', fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          REINChat
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          次世代 リアルタイム・コミュニケーションプラットフォーム
        </p>

        {/* Current Server IP Indicator */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <button 
            type="button" 
            onClick={() => setShowServerConfig(!showServerConfig)}
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            ⚙️ 接続先: <span style={{ color: '#60a5fa', fontWeight: 600 }}>{api.getServerUrl()}</span>
          </button>
        </div>

        {/* Server Config Accordion */}
        {showServerConfig && (
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #334155', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              PC/サーバー IPアドレス設定
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input 
                type="text" 
                className="input-field" 
                value={serverUrlInput} 
                onChange={e => setServerUrlInput(e.target.value)}
                placeholder="http://192.168.3.7:3001"
                style={{ fontSize: '0.8rem', padding: '8px' }}
              />
              <button 
                type="button" 
                onClick={() => handleSaveServerUrl(serverUrlInput)}
                style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                保存
              </button>
            </div>
            
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>プリセット選択:</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                onClick={() => handleSaveServerUrl('http://192.168.3.7:3001')}
                style={{ background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}
              >
                💻 PC Wi-Fi (192.168.3.7)
              </button>
              <button 
                type="button" 
                onClick={() => handleSaveServerUrl('http://10.0.2.2:3001')}
                style={{ background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}
              >
                📱 エミュレータ (10.0.2.2)
              </button>
              <button 
                type="button" 
                onClick={() => handleSaveServerUrl('http://localhost:3001')}
                style={{ background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}
              >
                🌐 localhost
              </button>
            </div>

            {configSavedMsg && (
              <div style={{ color: '#34d399', fontSize: '0.75rem', marginTop: '8px', textAlign: 'center' }}>
                {configSavedMsg}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', wordBreak: 'break-word' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>アカウントID または メール</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="id_example" 
              value={accountId} 
              onChange={e => setAccountId(e.target.value)} 
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>表示名</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="山田 太郎" 
                  value={displayName} 
                  onChange={e => setDisplayName(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>メールアドレス</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="user@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>パスワード</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '12px' }}>
            {isRegister ? '新規アカウント作成' : 'ログイン'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isRegister ? 'すでにアカウントをお持ちですか？' : 'アカウントをお持ちでないですか？'}{' '}
          <span 
            onClick={() => { setIsRegister(!isRegister); setError(''); }} 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
          >
            {isRegister ? 'ログイン' : '新規登録'}
          </span>
        </div>
      </div>
    </div>
  );
};
