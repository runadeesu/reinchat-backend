import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface QRCodeModalProps {
  currentUser: User;
  onClose: () => void;
  onAddSuccess: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ currentUser, onClose, onAddSuccess }) => {
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<User[]>([]);
  const [msg, setMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!searchId.trim()) return;
    const res = await api.searchUsers(searchId);
    setSearchResult(res.filter(u => u.id !== currentUser.id));
  };

  const handleAdd = async (targetId: string) => {
    const res = await api.addFriend(currentUser.id, targetId);
    if (res.success) {
      setMsg('フレンドを追加しました！');
      onAddSuccess();
    } else {
      setMsg(res.error || 'フレンド追加に失敗しました。');
    }
  };

  return (
    <div class="modal-overlay">
      <div class="glass-card" style={{ width: '450px', padding: '24px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

        <h3 style={{ textAlign: 'center', fontWeight: 800, marginBottom: '16px' }}>📱 QRコード / IDフレンド追加</h3>

        {/* User QR Code Display */}
        <div style={{ textAlign: 'center', background: 'white', padding: '16px', borderRadius: '12px', width: '200px', margin: '0 auto 16px auto' }}>
          {currentUser.qrCode ? (
            <img src={currentUser.qrCode} alt="QR Code" style={{ width: '100%', height: 'auto' }} />
          ) : (
            <div style={{ color: 'black', fontSize: '0.8rem' }}>QR Code</div>
          )}
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
          マイアカウントID: <strong>@{currentUser.accountId}</strong>
        </p>

        {/* Search & Add */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            class="input-field" 
            placeholder="ユーザーIDまたは名前で検索..." 
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
          />
          <button type="submit" class="btn-primary" style={{ whiteSpace: 'nowrap' }}>検索</button>
        </form>

        {msg && <p style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '12px', textAlign: 'center' }}>{msg}</p>}

        <div style={{ marginTop: '16px', maxHeight: '150px', overflowY: 'auto' }}>
          {searchResult.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{u.avatar}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.displayName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.accountId}</div>
                </div>
              </div>
              <button onClick={() => handleAdd(u.id)} class="btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                追加
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
