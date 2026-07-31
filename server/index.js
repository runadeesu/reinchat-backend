import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DB_FILE = path.join(__dirname, 'db.json');

// Initialize DB with production empty state
const defaultData = {
  users: [],
  friends: [],
  groups: [],
  messages: [],
  stamps: [
    { id: "st_1", name: "いいね", category: "ベーシック", emoji: "👍" },
    { id: "st_2", name: "スマイル", category: "ベーシック", emoji: "😊" },
    { id: "st_3", name: "ハート", category: "ベーシック", emoji: "❤️" },
    { id: "st_4", name: "感謝", category: "ベーシック", emoji: "🙏" },
    { id: "st_5", name: "おめでとう", category: "イベント", emoji: "🎉" },
    { id: "st_6", name: "スター", category: "イベント", emoji: "⭐" },
    { id: "st_7", name: "拍手", category: "イベント", emoji: "👏" },
    { id: "st_8", name: "炎", category: "イベント", emoji: "🔥" }
  ]
};

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return defaultData;
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  const { accountId, displayName, email, password } = req.body;
  const db = readDB();

  if (db.users.some(u => u.accountId === accountId || u.email === email)) {
    return res.status(400).json({ error: "指定されたアカウントIDまたはメールアドレスは既に登録されています。" });
  }

  const userId = `usr_${Date.now()}`;
  const qrCodeUrl = await QRCode.toDataURL(`reinchat://user/${accountId}`);

  const isFirstUser = db.users.length === 0;
  const newUser = {
    id: userId,
    accountId,
    displayName,
    email,
    password, // In real prod, hash with bcrypt
    avatar: "👤",
    bio: "よろしくお願いします！",
    status: "online",
    role: isFirstUser ? "admin" : "user",
    qrCode: qrCodeUrl,
    isBanned: false,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDB(db);
  res.json({ success: true, user: newUser });
});

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { accountId, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => (u.accountId === accountId || u.email === accountId) && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "アカウントIDまたはパスワードが正しくありません。" });
  }
  if (user.isBanned) {
    return res.status(403).json({ error: "このアカウントは管理者により利用停止（BAN）されています。" });
  }

  user.status = "online";
  writeDB(db);
  res.json({ success: true, user });
});

// Users: Search
app.get('/api/users/search', (req, res) => {
  const { q } = req.query;
  const db = readDB();
  if (!q) return res.json([]);
  const results = db.users.filter(u => 
    !u.isBanned && (u.accountId.includes(q) || u.displayName.includes(q))
  ).map(({ password, ...u }) => u);
  res.json(results);
});

// Profile Update
app.post('/api/users/profile', (req, res) => {
  const { userId, displayName, bio, avatar } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(44).json({ error: "ユーザーが見つかりません。" });

  if (displayName) user.displayName = displayName;
  if (bio) user.bio = bio;
  if (avatar) user.avatar = avatar;

  writeDB(db);
  res.json({ success: true, user });
});

// Friends: Get list
app.get('/api/friends/:userId', (req, res) => {
  const { userId } = req.params;
  const db = readDB();
  
  const friendRelations = db.friends.filter(f => 
    (f.userId === userId || f.friendId === userId) && f.status === 'accepted'
  );

  const friendIds = friendRelations.map(f => f.userId === userId ? f.friendId : f.userId);
  const friends = db.users.filter(u => friendIds.includes(u.id)).map(({ password, ...u }) => u);
  
  res.json(friends);
});

// Friends: Add
app.post('/api/friends/add', (req, res) => {
  const { userId, targetId } = req.body;
  const db = readDB();

  const exists = db.friends.some(f => 
    (f.userId === userId && f.friendId === targetId) || (f.userId === targetId && f.friendId === userId)
  );

  if (exists) {
    return res.status(400).json({ error: "すでにフレンド関係が存在します。" });
  }

  const relation = { id: `f_${Date.now()}`, userId, friendId: targetId, status: "accepted" };
  db.friends.push(relation);
  writeDB(db);

  res.json({ success: true, relation });
});

// Messages: Fetch History
app.get('/api/messages/:userId/:targetId', (req, res) => {
  const { userId, targetId } = req.params;
  const { isGroup } = req.query;
  const db = readDB();

  let msgs = [];
  if (isGroup === 'true') {
    msgs = db.messages.filter(m => m.isGroup && m.targetId === targetId);
  } else {
    msgs = db.messages.filter(m => 
      !m.isGroup && 
      ((m.senderId === userId && m.targetId === targetId) || (m.senderId === targetId && m.targetId === userId))
    );
  }

  res.json(msgs);
});

// Stamps List
app.get('/api/stamps', (req, res) => {
  const db = readDB();
  res.json(db.stamps);
});

// Admin: Users List & Ban toggle
app.get('/api/admin/users', (req, res) => {
  const db = readDB();
  res.json(db.users.map(({ password, ...u }) => u));
});

app.post('/api/admin/ban', (req, res) => {
  const { userId, ban } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  if (user) {
    user.isBanned = ban;
    writeDB(db);
  }
  res.json({ success: true });
});

// ----------------------------------------------------
// SOCKET.IO REALTIME & WEBRTC SIGNALING
// ----------------------------------------------------
const connectedSockets = {}; // userId -> socketId

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('user_connected', (userId) => {
    connectedSockets[userId] = socket.id;
    socket.userId = userId;
    
    // Broadcast user online status
    const db = readDB();
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.status = "online";
      writeDB(db);
      io.emit('user_status_changed', { userId, status: "online" });
    }
  });

  // Message Send Event
  socket.on('send_message', (msgData) => {
    const db = readDB();
    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: msgData.senderId,
      targetId: msgData.targetId,
      isGroup: msgData.isGroup || false,
      type: msgData.type || "text",
      content: msgData.content || "",
      fileUrl: msgData.fileUrl || null,
      stampUrl: msgData.stampUrl || null,
      replyToId: msgData.replyToId || null,
      isRead: false,
      reactions: {},
      createdAt: new Date().toISOString()
    };

    db.messages.push(newMsg);
    writeDB(db);

    if (newMsg.isGroup) {
      io.emit('new_message', newMsg);
    } else {
      // Send to target and sender
      const targetSocketId = connectedSockets[newMsg.targetId];
      if (targetSocketId) {
        io.to(targetSocketId).emit('new_message', newMsg);
      }
      socket.emit('new_message', newMsg);

      // AI Bot Auto Responder
      if (newMsg.targetId === 'usr_support') {
        setTimeout(() => {
          const botReply = {
            id: `msg_${Date.now() + 1}`,
            senderId: 'usr_support',
            targetId: newMsg.senderId,
            isGroup: false,
            type: "text",
            content: `「${newMsg.content}」についてのお問い合わせを受信しました。AIサポートが確認いたします。`,
            isRead: true,
            reactions: {},
            createdAt: new Date().toISOString()
          };
          db.messages.push(botReply);
          writeDB(db);
          socket.emit('new_message', botReply);
        }, 1000);
      }
    }
  });

  // Reaction Event
  socket.on('add_reaction', ({ msgId, emoji, userId }) => {
    const db = readDB();
    const msg = db.messages.find(m => m.id === msgId);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
      if (!msg.reactions[emoji].includes(userId)) {
        msg.reactions[emoji].push(userId);
      }
      writeDB(db);
      io.emit('reaction_updated', { msgId, reactions: msg.reactions });
    }
  });

  // Typing Indicator
  socket.on('typing', ({ senderId, targetId, isTyping }) => {
    const targetSocketId = connectedSockets[targetId];
    if (targetSocketId) {
      io.to(targetSocketId).emit('typing_status', { senderId, isTyping });
    }
  });

  // WebRTC Calling Signaling
  socket.on('call_user', ({ userToCall, signalData, from, isVideo }) => {
    const targetSocketId = connectedSockets[userToCall];
    if (targetSocketId) {
      io.to(targetSocketId).emit('incoming_call', { signal: signalData, from, isVideo });
    }
  });

  socket.on('answer_call', ({ to, signal }) => {
    const targetSocketId = connectedSockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('call_accepted', signal);
    }
  });

  socket.on('end_call', ({ to }) => {
    const targetSocketId = connectedSockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('call_ended');
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      delete connectedSockets[socket.userId];
      const db = readDB();
      const user = db.users.find(u => u.id === socket.userId);
      if (user) {
        user.status = "offline";
        writeDB(db);
        io.emit('user_status_changed', { userId: socket.userId, status: "offline" });
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`REINChat Realtime Server running on port ${PORT}`);
});
