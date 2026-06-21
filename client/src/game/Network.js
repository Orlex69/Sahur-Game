import { io } from 'socket.io-client';

export class NetworkClient {
  constructor(onWelcome, onStateUpdate) {
    this.onWelcome = onWelcome;
    this.onStateUpdate = onStateUpdate;
    this.socket = null;
  }

  connect() {
    // Determine the server connection endpoint:
    // If we're on localhost, we use window.location.origin (Vite proxies to localhost:3000)
    // If we're on production (e.g. GitHub Pages), we connect to the configured production server URL
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    const serverUrl = isLocal
      ? window.location.origin
      : import.meta.env.VITE_SERVER_URL || window.location.origin;

    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      console.log('Connected to Sahur.io Server');
    });

    this.socket.on('welcome', (data) => {
      this.onWelcome(data);
    });

    this.socket.on('state', (state) => {
      this.onStateUpdate(state);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  sendJoin(name, skin) {
    if (this.socket) {
      this.socket.emit('join', { name, skin });
    }
  }

  sendInput(angle, speed) {
    if (this.socket) {
      this.socket.emit('input', { angle, speed });
    }
  }

  sendSplit() {
    if (this.socket) {
      this.socket.emit('split');
    }
  }

  sendEject() {
    if (this.socket) {
      this.socket.emit('eject');
    }
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}
