import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AdminModalProps {
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await api.getAdminUsers();
    setUsers(data);
  };

  const handleToggleBan = async (user: User) => {
    await api.toggleBan(user.id, !user.isBanned);
    loadUsers();
  };

  return (
    <div class="modal-overlay">
      <div class="glass-card" style={{ width: '700px', maxHeight: '80vh', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontWeight: 800, color: '#f59e0b' }}>🛡️ 管理者ダッシュボード</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>ユーザー</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>アカウントID</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>役割</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>ステータス</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{u.avatar}</span>
                    <span style={{ fontWeight: 600 }}>{u.displayName}</span>
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>@{u.accountId}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ fontSize: '0.75rem', background: u.role === 'admin' ? '#f59e0b' : 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: u.role === 'admin' ? 'black' : 'white' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {u.isBanned ? (
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>BAN中</span>
                    ) : (
                      <span style={{ color: '#10b981' }}>正常</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    {u.role !== 'admin' && (
                      <button 
                        onClick={() => handleToggleBan(u)}
                        style={{ background: u.isBanned ? '#10b981' : '#ef4444', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        {u.isBanned ? 'BAN解除' : 'BAN'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
