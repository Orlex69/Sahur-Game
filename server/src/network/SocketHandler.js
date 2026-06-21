import { TICK_RATE } from '../game/Physics.js';

export function setupSockets(io, game) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Join Lobby
    socket.on('join', (data) => {
      const name = data.name || 'Anonymous';
      const skin = data.skin || 'gigachad';

      const player = game.addPlayer(socket.id, name, skin);

      socket.emit('welcome', {
        id: socket.id,
        color: player.color,
        skin: player.skin,
        name: player.name,
      });
      console.log(`Player joined: ${player.name} (${socket.id})`);
    });

    // Input direction and speed
    socket.on('input', (data) => {
      if (typeof data.angle === 'number' && typeof data.speed === 'number') {
        game.handleInput(socket.id, data.angle, data.speed);
      }
    });

    // Action split
    socket.on('split', () => {
      game.handleSplit(socket.id);
    });

    // Action eject mass
    socket.on('eject', () => {
      game.handleEject(socket.id);
    });

    // Disconnect
    socket.on('disconnect', () => {
      game.removePlayer(socket.id);
      console.log(`Player disconnected: ${socket.id}`);
    });
  });

  // Game Loop Tick Broadcast (30 ticks per second)
  let lastTime = Date.now();
  setInterval(() => {
    const now = Date.now();
    const dt = (now - lastTime) / 1000.0;
    lastTime = now;

    // Run game logic tick
    game.tick(dt);

    // Broadcast state and leaderboard to all connected clients
    const state = game.getState();
    state.leaderboard = game.getLeaderboard();

    io.emit('state', state);
  }, 1000 / TICK_RATE);
}
