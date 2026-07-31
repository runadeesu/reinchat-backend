export interface User {
  id: string;
  accountId: string;
  displayName: string;
  email: string;
  avatar: string;
  bio: string;
  status: 'online' | 'offline';
  role: 'user' | 'admin' | 'bot';
  qrCode?: string;
  isBanned?: boolean;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  ownerId: string;
  members: string[];
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  targetId: string;
  isGroup?: boolean;
  type: 'text' | 'stamp' | 'file' | 'call';
  content: string;
  fileUrl?: string;
  stampUrl?: string;
  replyToId?: string;
  isRead: boolean;
  reactions?: { [emoji: string]: string[] };
  createdAt: string;
}

export interface Stamp {
  id: string;
  name: string;
  category: string;
  emoji: string;
}

export interface CallState {
  active: boolean;
  isVideo: boolean;
  peerUser?: User;
  isIncoming?: boolean;
  signal?: any;
}
