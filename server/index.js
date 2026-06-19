const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '../')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Global state
const players = {}; // socket.id -> { username, id, roomId, color, avatar }
const rooms = {};   // roomId -> { id, players: [socket.id], host: socket.id, status: 'waiting'|'playing'|'finished', password: '...', capacity: 2, gameMode: 1, levels: {}, durationLeft: 60, timerId: null }

// Helper to generate a 4-digit room code
function generateRoomId() {
  let id;
  do {
    id = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms[id]);
  return id;
}

function getRoomInfo(room) {
  return {
      roomId: room.id,
      host: room.host,
      password: room.password ? true : false,
      capacity: room.capacity,
      gameMode: room.gameMode,
      players: room.players.map(pid => players[pid] || { id: pid, username: 'Unknown' }),
      status: room.status
  };
}

// Helper to broadcast global online list with in-room status
function broadcastOnlineList() {
  const onlineList = Object.values(players).map(p => ({
    id: p.id,
    username: p.username,
    inRoom: p.roomId !== null
  }));
  io.emit('online_list_update', {
    count: onlineList.length,
    users: onlineList
  });
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. Register player name
  socket.on('register_name', (data) => {
    let username = '匿名玩家';
    let color = 'red';
    let avatar = null;
    if (typeof data === 'string') {
        username = data;
    } else if (data) {
        username = data.username || '匿名玩家';
        color = data.color || 'red';
        avatar = data.avatar || null;
    }
    players[socket.id] = {
      id: socket.id,
      username: username,
      color: color,
      avatar: avatar,
      roomId: null
    };
    console.log(`Player registered: ${players[socket.id].username}`);
    broadcastOnlineList();
  });

  socket.on('update_profile', (data) => {
    if(players[socket.id]) {
        if (data.color) players[socket.id].color = data.color;
        if (data.avatar) players[socket.id].avatar = data.avatar;
        const roomId = players[socket.id].roomId;
        if (roomId && rooms[roomId]) {
            io.to(roomId).emit('room_update', getRoomInfo(rooms[roomId]));
        }
    }
  });

  socket.on('get_rooms', () => {
    const activeRooms = Object.values(rooms)
        .filter(r => r.status === 'waiting' && r.players.length < r.capacity)
        .map(r => getRoomInfo(r))
        .sort((a, b) => b.players.length - a.players.length)
        .slice(0, 50);
    socket.emit('room_list', activeRooms);
  });

  // 2. Fetch current online list
  socket.on('get_online_list', () => {
    const onlineList = Object.values(players).map(p => ({
      id: p.id,
      username: p.username,
      inRoom: p.roomId !== null
    }));
    socket.emit('online_list_update', {
      count: onlineList.length,
      users: onlineList
    });
  });

  // 3. Create room for PVP
  socket.on('create_room', (data) => {
    const player = players[socket.id];
    if (!player) return socket.emit('error_message', '请先注册昵称');

    // Clean up if already in a room
    leaveCurrentRoom(socket);

    const roomId = generateRoomId();
    const password = data && data.password ? data.password.toString().trim() : null;
    const capacity = data && data.capacity ? parseInt(data.capacity) : 2;

    rooms[roomId] = {
      id: roomId,
      players: [socket.id],
      host: socket.id,
      status: 'waiting',
      password: password || null,
      capacity: capacity || 2,
      gameMode: data && data.gameMode ? parseInt(data.gameMode) : 1,
      levels: { [socket.id]: 1 },
      durationLeft: 60,
      timerId: null
    };

    player.roomId = roomId;
    socket.join(roomId);
    socket.emit('room_created', getRoomInfo(rooms[roomId]));

    broadcastOnlineList(); // Update room status for invite screen
    console.log(`Room ${roomId} created by ${player.username} with capacity ${capacity}`);
  });

  // 4. Change game mode (host only)
  socket.on('change_game_mode', (gameMode) => {
    const player = players[socket.id];
    if (!player || !player.roomId) return;
    const room = rooms[player.roomId];
    if (!room || room.host !== socket.id) return;
    
    room.gameMode = parseInt(gameMode);
    io.to(room.id).emit('game_mode_updated', { gameMode: room.gameMode });
    console.log(`Room ${room.id} mode updated to ${room.gameMode}`);
  });

  // 5. Join room for PVP
  socket.on('join_room', (data) => {
    const player = players[socket.id];
    if (!player) return socket.emit('error_message', '请先注册昵称');

    const roomId = data && data.roomId ? data.roomId.toString().trim() : '';
    const password = data && data.password ? data.password.toString().trim() : '';

    const room = rooms[roomId];
    if (!room) return socket.emit('error_message', '房间不存在');
    if (room.players.length >= room.capacity) return socket.emit('error_message', '房间已满');
    if (room.status !== 'waiting') return socket.emit('error_message', '游戏已经开始');

    // Verify password
    if (room.password && room.password !== password) {
      return socket.emit('password_required', { roomId });
    }

    // Clean up if already in a room
    leaveCurrentRoom(socket);

    room.players.push(socket.id);
    room.levels[socket.id] = 1;
    player.roomId = roomId;
    socket.join(roomId);

    console.log(`Player ${player.username} joined room ${roomId}`);
    broadcastOnlineList();

    io.to(roomId).emit('room_update', getRoomInfo(room));
    
    // Automatically start if room is full
    if (room.players.length >= room.capacity) {
        // give it a tiny delay
        setTimeout(() => {
            if (rooms[roomId] && rooms[roomId].status === 'waiting' && rooms[roomId].players.length >= rooms[roomId].capacity) {
                startGameInRoom(rooms[roomId]);
            }
        }, 500);
    }
  });

  socket.on('start_game', () => {
    const player = players[socket.id];
    if (!player || !player.roomId) return;
    const room = rooms[player.roomId];
    if (!room || room.host !== socket.id) return;
    
    if (room.players.length < 2) {
        return socket.emit('error_message', '至少需要2人才能开始游戏');
    }
    startGameInRoom(room);
  });

  // 6. Invite Friend
  socket.on('send_invite', (data) => {
    const player = players[socket.id];
    if (!player || !player.roomId) return;
    const room = rooms[player.roomId];
    if (!room) return;

    const targetSocket = io.sockets.sockets.get(data.targetSocketId);
    if (targetSocket) {
      const modeName = room.gameMode === 1 ? '一：捉迷藏模式' : (room.gameMode === 2 ? '二：疯狂地鼠模式' : (room.gameMode === 3 ? '三：我的世界联机对战' : '四：俄罗斯方块模式'));
      targetSocket.emit('receive_invite', {
        fromId: socket.id,
        fromName: player.username,
        roomId: room.id,
        gameMode: room.gameMode,
        gameModeName: modeName
      });
      console.log(`Invite sent from ${player.username} to ${data.targetSocketId}`);
    }
  });

  // 7. Decline invite
  socket.on('decline_invite', (data) => {
    const player = players[socket.id];
    const hostSocket = io.sockets.sockets.get(data.hostId);
    if (hostSocket && player) {
      hostSocket.emit('invite_declined', {
        guestName: player.username
      });
    }
  });

  // 8. Accept direct invite (skips password)
  socket.on('accept_invite', (data) => {
    const player = players[socket.id];
    if (!player) return socket.emit('error_message', '请先注册昵称');

    const roomId = data.roomId;
    const room = rooms[roomId];
    if (!room) return socket.emit('error_message', '房间已解散或不存在');
    if (room.players.length >= room.capacity) return socket.emit('error_message', '房间已满');
    if (room.status !== 'waiting') return socket.emit('error_message', '游戏已在进行中');

    leaveCurrentRoom(socket);

    room.players.push(socket.id);
    room.levels[socket.id] = 1;
    player.roomId = roomId;
    socket.join(roomId);

    console.log(`Player ${player.username} accepted invite to room ${roomId}`);
    broadcastOnlineList();

    io.to(roomId).emit('room_update', getRoomInfo(room));

    if (room.players.length >= room.capacity) {
        setTimeout(() => {
            if (rooms[roomId] && rooms[roomId].status === 'waiting' && rooms[roomId].players.length >= rooms[roomId].capacity) {
                startGameInRoom(rooms[roomId]);
            }
        }, 500);
    }
  });

  // 9. Sync level-up event
  socket.on('level_up', (data) => {
    const player = players[socket.id];
    if (!player || !player.roomId) return;
    const room = rooms[player.roomId];
    if (!room || room.status !== 'playing') return;

    room.levels[socket.id] = parseInt(data.level);
    
    // Broadcast level update to all room members
    io.to(room.id).emit('level_update', {
      levels: room.levels
    });
  });

    // 9.5 Sync player action/movement for Mode 3 (Minecraft multiplayer)
    socket.on('player_action', (data) => {
        const player = players[socket.id];
        if (player && player.roomId) {
            socket.to(player.roomId).emit('opponent_action', {
                playerId: socket.id,
                ...data
            });
        }
    });

  // 9.6 Handle Tetris Player Game Over (Mode 4 PVP)
  socket.on('player_game_over', () => {
    const player = players[socket.id];
    if (!player || !player.roomId) return;
    const room = rooms[player.roomId];
    if (!room || room.status !== 'playing') return;

    room.status = 'finished';
    if (room.timerId) {
      clearInterval(room.timerId);
      room.timerId = null;
    }

    // The other player(s) win. If 2 players, the opponent wins.
    const survivors = room.players.filter(pid => pid !== socket.id);
    let winnerId = null;
    let winnerName = '未知';
    if (survivors.length === 1) {
      winnerId = survivors[0];
      winnerName = players[winnerId] ? players[winnerId].username : '未知';
    } else if (survivors.length > 1) {
      let maxLevel = -1;
      let winners = [];
      survivors.forEach(pid => {
          const l = room.levels[pid] || 1;
          if (l > maxLevel) {
              maxLevel = l;
              winners = [pid];
          } else if (l === maxLevel) {
              winners.push(pid);
          }
      });
      if (winners.length === 1) {
        winnerId = winners[0];
        winnerName = players[winnerId] ? players[winnerId].username : '未知';
      } else {
        winnerName = winners.map(w => players[w] ? players[w].username : '未知').join(', ') + ' 平局';
      }
    } else {
      winnerId = socket.id;
      winnerName = player.username;
    }

    io.to(room.id).emit('match_finished', {
      levels: room.levels,
      winnerId,
      winnerName
    });
  });

  // 10. Handle Disconnection & Room Cleanup
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    leaveCurrentRoom(socket);
    delete players[socket.id];
    broadcastOnlineList();
  });
});

function startGameInRoom(room) {
  room.status = 'playing';
  room.durationLeft = 60; // 1 minute Speedrun

  room.players.forEach(pid => {
    room.levels[pid] = 1;
  });

  const roomPlayers = room.players.map(pid => {
      const p = players[pid];
      return {
          id: pid,
          name: p ? p.username : '未知玩家',
          color: p ? p.color : 'red',
          avatar: p ? p.avatar : null
      };
  });

  // Broadcast game_start event
  io.to(room.id).emit('game_start', {
    roomId: room.id,
    gameMode: room.gameMode,
    players: roomPlayers,
    duration: room.durationLeft,
    levels: room.levels
  });

  // Start 1s countdown timer
  if (room.timerId) clearInterval(room.timerId);

  room.timerId = setInterval(() => {
    if (room.gameMode !== 4) {
      room.durationLeft--;
      io.to(room.id).emit('timer_sync', { timeLeft: room.durationLeft });

      if (room.durationLeft <= 0) {
        clearInterval(room.timerId);
        room.timerId = null;
        room.status = 'finished';

        let maxLevel = -1;
        let winners = [];
        room.players.forEach(pid => {
            const l = room.levels[pid] || 1;
            if (l > maxLevel) {
                maxLevel = l;
                winners = [pid];
            } else if (l === maxLevel) {
                winners.push(pid);
            }
        });

        let winnerId = null;
        let winnerName = '平局';
        
        if (winners.length === 1) {
            winnerId = winners[0];
            winnerName = players[winnerId] ? players[winnerId].username : '未知';
        } else if (winners.length > 1 && winners.length < room.players.length) {
            winnerName = winners.map(w => players[w] ? players[w].username : '未知').join(', ') + ' 平局';
        }

        io.to(room.id).emit('match_finished', {
          levels: room.levels,
          winnerId,
          winnerName
        });
      }
    }
  }, 1000);
}

function leaveCurrentRoom(socket) {
  const player = players[socket.id];
  if (player && player.roomId) {
    const roomId = player.roomId;
    const room = rooms[roomId];
    if (room) {
      room.players = room.players.filter(pid => pid !== socket.id);
      
      if (room.players.length === 0) {
        if (room.timerId) clearInterval(room.timerId);
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted as it became empty.`);
      } else {
        if (room.timerId) {
          clearInterval(room.timerId);
          room.timerId = null;
        }
        io.to(roomId).emit('opponent_left', {
          username: player.username
        });
        io.to(roomId).emit('room_update', getRoomInfo(room));
        // If playing, end it. If waiting, just update room.
        if (room.status === 'playing') {
            room.status = 'finished';
        }
      }
    }
    player.roomId = null;
    socket.leave(roomId);
  }
}

const PORT = process.env.PORT || 3015;
http.listen(PORT, () => {
  console.log(`Brick game server running on port ${PORT}`);
});
