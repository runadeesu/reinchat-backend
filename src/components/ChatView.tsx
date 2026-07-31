import React, { useState, useEffect, useRef } from 'react';
import { User, Message, Stamp } from '../types';
import { api } from '../services/api';

interface ChatViewProps {
  currentUser: User;
  targetUser: User;
  messages: Message[];
  stamps: Stamp[];
  isTyping: boolean;
  onSendMessage: (content: string, type?: 'text' | 'stamp' | 'file', extraData?: any) => void;
  onStartCall: (isVideo: boolean) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  targetUser,
  messages,
  stamps,
  isTyping,
  onSendMessage,
  onStartCall
}) => {
  const [inputText, setInputText] = useState('');
  const [showStamps, setShowStamps] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText, 'text');
    setInputText('');
    api.sendTyping(currentUser.id, targetUser.id, false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    api.sendTyping(currentUser.id, targetUser.id, e.target.value.length > 0);
  };

  const handleSendStamp = (stamp: Stamp) => {
    onSendMessage(stamp.name, 'stamp', { stampUrl: stamp.emoji });
    setShowStamps(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSendMessage(file.name, 'file', { fileUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Header Bar */}
      <header class="glass" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRight: 'none', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            {targetUser.avatar}
          </div>
          <div>
            <h3 style={{ fontWeight: 800 }}>{targetUser.displayName}</h3>
            <span style={{ fontSize: '0.75rem', color: targetUser.status === 'online' ? '#10b981' : 'var(--text-muted)' }}>
              {targetUser.status === 'online' ? 'オンライン' : 'オフライン'}
            </span>
          </div>
        </div>

        {/* Calling Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => onStartCall(false)}
            style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📞 音声通話
          </button>
          <button 
            onClick={() => onStartCall(true)}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📹 ビデオ通話
          </button>
        </div>
      </header>

      {/* Messages Timeline */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {messages.map(msg => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} class={`chat-bubble ${isMe ? 'me' : 'them'}`}>
              {msg.type === 'stamp' ? (
                <div style={{ fontSize: '4rem', textCenter: 'center' }}>{msg.stampUrl || msg.content}</div>
              ) : msg.type === 'file' ? (
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📎 添付ファイル: {msg.content}</div>
                  {msg.fileUrl && (
                    <a href={msg.fileUrl} download={msg.content} style={{ color: '#60a5fa', textDecoration: 'underline', fontSize: '0.8rem' }}>
                      ダウンロード
                    </a>
                  )}
                </div>
              ) : (
                <div>{msg.content}</div>
              )}
              
              <div style={{ fontSize: '0.65rem', opacity: 0.7, textAlign: isMe ? 'right' : 'left', marginTop: '4px' }}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div class="chat-bubble them" style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            入力中...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Stamp Picker Overlay */}
      {showStamps && (
        <div class="glass-card" style={{ position: 'absolute', bottom: '80px', left: '24px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', zIndex: 100 }}>
          {stamps.map(s => (
            <div 
              key={s.id} 
              onClick={() => handleSendStamp(s)}
              style={{ fontSize: '2rem', cursor: 'pointer', textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}
            >
              {s.emoji}
            </div>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSendText} style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button 
          type="button" 
          onClick={() => setShowStamps(!showStamps)}
          style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
        >
          😊
        </button>

        <label style={{ cursor: 'pointer', fontSize: '1.3rem' }}>
          📎
          <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>

        <input 
          type="text" 
          class="input-field" 
          placeholder="メッセージを入力..." 
          value={inputText}
          onChange={handleInputChange}
        />

        <button type="submit" class="btn-primary">
          送信
        </button>
      </form>
    </main>
  );
};
