import { io, Socket } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';
import { User, Message, Stamp } from '../types';

export function getInitialServerUrl(): string {
  const saved = localStorage.getItem('reinchat_server_url');
  if (saved) return saved;

  if (Capacitor.isNativePlatform()) {
    // Default to host PC's Wi-Fi IP address on Android
    return "http://192.168.3.7:3001";
  }

  if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:3001`;
  }

  return "http://localhost:3001";
}

class ApiService {
  public socket: Socket | null = null;
  public baseUrl: string = getInitialServerUrl();

  public getServerUrl(): string {
    return this.baseUrl;
  }

  public setServerUrl(url: string) {
    let formatted = url.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `http://${formatted}`;
    }
    formatted = formatted.replace(/\/+$/, '');
    this.baseUrl = formatted;
    localStorage.setItem('reinchat_server_url', formatted);
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public initSocket(userId: string, onNewMessage: (msg: Message) => void, onTyping: (data: any) => void, onCall: (callData: any) => void) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.baseUrl, { autoConnect: true });

    this.socket.on('connect', () => {
      this.socket?.emit('user_connected', userId);
    });

    this.socket.on('new_message', (msg: Message) => {
      onNewMessage(msg);
    });

    this.socket.on('typing_status', (data: any) => {
      onTyping(data);
    });

    this.socket.on('incoming_call', (data: any) => {
      onCall(data);
    });
  }

  public async register(accountData: any): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: `サーバー (${this.baseUrl}) に接続できません。PCでサーバーが起動しているか、設定のサーバーIPを確認してください。` };
    }
  }

  public async login(credentials: any): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: `サーバー (${this.baseUrl}) に接続できません。PCでサーバーが起動しているか、設定のサーバーIPを確認してください。` };
    }
  }

  public async searchUsers(q: string): Promise<User[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/users/search?q=${encodeURIComponent(q)}`);
      return await res.json();
    } catch {
      return [];
    }
  }

  public async getFriends(userId: string): Promise<User[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/friends/${userId}`);
      return await res.json();
    } catch {
      return [];
    }
  }

  public async addFriend(userId: string, targetId: string) {
    try {
      const res = await fetch(`${this.baseUrl}/api/friends/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetId })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: 'サーバー接続エラーが発生しました。' };
    }
  }

  public async getMessages(userId: string, targetId: string, isGroup = false): Promise<Message[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/messages/${userId}/${targetId}?isGroup=${isGroup}`);
      return await res.json();
    } catch {
      return [];
    }
  }

  public async getStamps(): Promise<Stamp[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/stamps`);
      return await res.json();
    } catch {
      return [];
    }
  }

  public sendMessage(msg: Partial<Message>) {
    if (this.socket) {
      this.socket.emit('send_message', msg);
    }
  }

  public sendTyping(senderId: string, targetId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { senderId, targetId, isTyping });
    }
  }

  public async getAdminUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/users`);
      return await res.json();
    } catch {
      return [];
    }
  }

  public async toggleBan(userId: string, ban: boolean) {
    try {
      const res = await fetch(`${this.baseUrl}/api/admin/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ban })
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  }
}

export const api = new ApiService();
