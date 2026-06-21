import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { Game } from './game/Game.js';
import { setupSockets } from './network/SocketHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Create the game instance
const game = new Game();

// Setup WebSocket handling
setupSockets(io, game);

// Serve the client assets if built
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Fallback index.html for SPA router
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Sahur.io Server running on port ${PORT}`);
  console.log(` Open client/ to connect via Vite dev server`);
  console.log(`===============================================`);
});
