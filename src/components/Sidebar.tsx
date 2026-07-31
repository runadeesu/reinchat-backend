import React, { useState } from 'react';
import { User } from '../types';

interface SidebarProps {
  currentUser: User;
  friends: User[];
  activeTarget: User | null;
  onSelectTarget: (user: User) => void;
  onOpenQR: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onAddFriend: (user: User) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  friends,
  activeTarget,
  onSelectTarget,
  onOpenQR,
  onOpenAdmin,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFriends = friends.filter(f => 
    f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.accountId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside class="glass" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Current User Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', border: '2px solid var(--primary)' }}>
            {currentUser.avatar}
          </div>
          <div>
            <h4 style={{ fontWeight: 800 }}>{currentUser.displayName}</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: @{currentUser.accountId}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            title="QRコード表示"
            onClick={onOpenQR}
            style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
          >
            📱
          </button>
          {currentUser.role === 'admin' && (
            <button 
              title="管理者ダッシュボード"
              onClick={onOpenAdmin}
              style={{ background: 'transparent', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
            >
              🛡️
            </button>
          )}
          <button 
            title="ログアウト"
            onClick={onLogout}
            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
          >
            🚪
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('chats')}
          style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: activeTab === 'chats' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'chats' ? '2px solid var(--primary)' : 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          トーク ({friends.length})
        </button>
        <button 
          onClick={() => setActiveTab('friends')}
          style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: activeTab === 'friends' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'friends' ? '2px solid var(--primary)' : 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          フレンド一覧
        </button>
      </div>

      {/* Search Input */}
      <div style={{ padding: '12px 16px' }}>
        <input 
          type="text" 
          class="input-field" 
          placeholder="検索..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ fontSize: '0.85rem' }}
        />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredFriends.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            フレンドが見つかりません
          </div>
        ) : (
          filteredFriends.map(friend => {
            const isSelected = activeTarget?.id === friend.id;
            return (
              <div 
                key={friend.id}
                onClick={() => onSelectTarget(friend)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                    {friend.avatar}
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: friend.status === 'online' ? '#10b981' : '#6b7280',
                    border: '2px solid var(--bg-side)'
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {friend.displayName}
                    </h5>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                    {friend.bio}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
