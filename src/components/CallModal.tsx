import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';

interface CallModalProps {
  peerUser: User;
  isVideo: boolean;
  onEndCall: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({ peerUser, isVideo, onEndCall }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: isVideo, audio: true })
      .then(s => {
        stream = s;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = s;
        }
      })
      .catch(e => console.log("Media stream access simulation", e));

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideo]);

  return (
    <div class="modal-overlay">
      <div class="glass-card" style={{ width: '600px', height: '480px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
        {/* Remote Video Stream / Avatar */}
        <div style={{ flex: 1, background: '#0f172a', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {isVideo && !isCamOff ? (
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '5rem', marginBottom: '16px' }}>{peerUser.avatar}</div>
              <h3 style={{ fontWeight: 800 }}>{peerUser.displayName}</h3>
              <p style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '4px' }}>通話中...</p>
            </div>
          )}

          {/* Local PIP Video */}
          {isVideo && (
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '120px', height: '90px', background: '#1e293b', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--primary)' }}>
              <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1.3rem', cursor: 'pointer' }}
          >
            {isMuted ? '🔇' : '🎙️'}
          </button>

          {isVideo && (
            <button 
              onClick={() => setIsCamOff(!isCamOff)}
              style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: isCamOff ? '#ef4444' : 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1.3rem', cursor: 'pointer' }}
            >
              {isCamOff ? '📷' : '📹'}
            </button>
          )}

          <button 
            onClick={onEndCall}
            style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: '#ef4444', color: 'white', fontSize: '1.3rem', cursor: 'pointer', boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }}
          >
            📞
          </button>
        </div>
      </div>
    </div>
  );
};
