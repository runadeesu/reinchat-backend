import React, { useState, useEffect } from 'react';
import { User, Message, Stamp, CallState } from './types';
import { api } from './services/api';
import { AuthModal } from './components/AuthModal';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { CallModal } from './components/CallModal';
import { AdminModal } from './components/AdminModal';
import { QRCodeModal } from './components/QRCodeModal';
import './styles/app.css';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [activeTarget, setActiveTarget] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Modals
  const [showQR, setShowQR] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [callState, setCallState] = useState<CallState>({ active: false, isVideo: false });

  // Check saved session
  useEffect(() => {
    const savedUser = localStorage.getItem('reinchat_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        handleLoginSuccess(u);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('reinchat_user', JSON.stringify(user));
    loadFriends(user.id);
    loadStamps();

    // Initialize Socket.io connection
    api.initSocket(
      user.id,
      (newMsg: Message) => {
        setMessages(prev => [...prev, newMsg]);
      },
      (typingData: any) => {
        if (activeTarget && typingData.senderId === activeTarget.id) {
          setIsTyping(typingData.isTyping);
        }
      },
      (callData: any) => {
        const caller = friends.find(f => f.id === callData.from) || { displayName: "通話相手", avatar: "👤" } as User;
        setCallState({
          active: true,
          isVideo: callData.isVideo,
          peerUser: caller,
          isIncoming: true,
          signal: callData.signal
        });
      }
    );
  };

  const loadFriends = async (userId: string) => {
    const list = await api.getFriends(userId);
    setFriends(list);
    if (list.length > 0 && !activeTarget) {
      handleSelectTarget(list[0], userId);
    }
  };

  const loadStamps = async () => {
    const list = await api.getStamps();
    setStamps(list);
  };

  const handleSelectTarget = async (target: User, currentId = currentUser?.id) => {
    setActiveTarget(target);
    setIsTyping(false);
    if (currentId) {
      const msgs = await api.getMessages(currentId, target.id);
      setMessages(msgs);
    }
  };

  const handleSendMessage = (content: string, type: 'text' | 'stamp' | 'file' = 'text', extraData?: any) => {
    if (!currentUser || !activeTarget) return;
    api.sendMessage({
      senderId: currentUser.id,
      targetId: activeTarget.id,
      type,
      content,
      ...extraData
    });
  };

  const handleStartCall = (isVideo: boolean) => {
    if (!activeTarget) return;
    setCallState({
      active: true,
      isVideo,
      peerUser: activeTarget,
      isIncoming: false
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('reinchat_user');
    setCurrentUser(null);
    setActiveTarget(null);
    setMessages([]);
  };

  if (!currentUser) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div class="app-layout">
      {/* Sidebar */}
      <Sidebar 
        currentUser={currentUser}
        friends={friends}
        activeTarget={activeTarget}
        onSelectTarget={t => handleSelectTarget(t)}
        onOpenQR={() => setShowQR(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        onLogout={handleLogout}
        onAddFriend={() => loadFriends(currentUser.id)}
      />

      {/* Chat Area */}
      {activeTarget ? (
        <ChatView 
          currentUser={currentUser}
          targetUser={activeTarget}
          messages={messages}
          stamps={stamps}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
          onStartCall={handleStartCall}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          トーク相手を選択してください
        </div>
      )}

      {/* Modals */}
      {showQR && (
        <QRCodeModal 
          currentUser={currentUser}
          onClose={() => setShowQR(false)}
          onAddSuccess={() => loadFriends(currentUser.id)}
        />
      )}

      {showAdmin && (
        <AdminModal onClose={() => setShowAdmin(false)} />
      )}

      {callState.active && callState.peerUser && (
        <CallModal 
          peerUser={callState.peerUser}
          isVideo={callState.isVideo}
          onEndCall={() => setCallState({ active: false, isVideo: false })}
        />
      )}
    </div>
  );
};
export default App;
