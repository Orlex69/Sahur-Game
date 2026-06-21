import { NetworkClient } from './Network.js';
import { InputHandler } from './Input.js';
import { GameRenderer } from './Renderer.js';
import { soundManager } from '../audio/SoundManager.js';
import { LobbyMenu, HUD, Leaderboard, GameOverModal } from '../ui/UI.js';

export class ClientGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.uiRoot = document.getElementById('ui-root');

    this.network = new NetworkClient(
      (welcomeData) => this.handleWelcome(welcomeData),
      (serverState) => this.handleStateUpdate(serverState)
    );

    this.renderer = new GameRenderer(this.canvas);
    this.inputHandler = new InputHandler(
      this.canvas,
      () => this.handleSplitAction(),
      () => this.handleEjectAction()
    );

    this.gameState = null;
    this.selfId = null;
    this.selfName = '';

    // Smooth Interpolation State
    // Map of nodeId -> { currentX, currentY, targetX, targetY }
    this.nodesInterpolation = new Map();

    // Floating text meme array
    this.floatingTexts = [];
    this.brainrotMemes = [
      'GYATT',
      'FANUM TAX',
      'W RIZZ',
      'SIGMA MALE',
      'HAWK TUAH',
      'NO CAP',
      'SHEESH',
      'SKIBIDI',
      'MEWING',
    ];

    // UI elements (Atomic Organisms)
    this.lobby = new LobbyMenu(this.uiRoot, (name, skin) =>
      this.joinGame(name, skin)
    );
    this.hud = new HUD(this.uiRoot);
    this.leaderboard = new Leaderboard(this.uiRoot);
    this.gameOverModal = new GameOverModal(this.uiRoot, () =>
      this.restartGame()
    );

    this.initAudioButton();

    // Start frame loop
    this.isRunning = true;
    requestAnimationFrame((t) => this.loop(t));
  }

  initAudioButton() {
    const audioPanel = document.createElement('div');
    audioPanel.className = 'audio-panel';

    const muteBtn = document.createElement('button');
    muteBtn.className = 'audio-btn';
    muteBtn.innerHTML = '🔊';

    muteBtn.addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
      muteBtn.classList.toggle('muted', isMuted);
    });

    audioPanel.appendChild(muteBtn);
    this.uiRoot.appendChild(audioPanel);
  }

  start() {
    this.network.connect();
  }

  joinGame(name, skin) {
    this.selfName = name;
    this.network.sendJoin(name, skin);
    // Audio initial hand-shake trigger
    soundManager.init();
  }

  restartGame() {
    this.lobby.show();
  }

  handleWelcome(data) {
    this.selfId = data.id;
    this.lobby.hide();
  }

  handleStateUpdate(serverState) {
    this.gameState = serverState;
    this.hud.update(
      this.getMyMass(),
      serverState.timer,
      serverState.isIntermission
    );
    this.leaderboard.update(serverState.leaderboard, this.selfId);

    // If intermission starts, show game over modal
    if (serverState.isIntermission && !this.gameOverModal.el) {
      const myPlayer = serverState.players.find((p) => p.id === this.selfId);
      const personalStats = {
        score: myPlayer
          ? myPlayer.nodes.reduce((sum, n) => sum + n.mass, 0)
          : 0,
        isDead: myPlayer ? false : true,
      };
      this.gameOverModal.show(personalStats, serverState.leaderboard);
      soundManager.playAdhan(); // Fajr prayer Adhan sound alarm
    }

    if (!serverState.isIntermission && this.gameOverModal.el) {
      this.gameOverModal.hide();
    }

    // Process network events for sound cues and meme text injections
    if (serverState.audioEvents && serverState.audioEvents.length > 0) {
      serverState.audioEvents.forEach((event) => {
        const isSelf = event.playerId === this.selfId;

        switch (event.type) {
          case 'eat':
            if (isSelf) soundManager.playEat();
            break;
          case 'eject':
            if (isSelf) soundManager.playEject();
            break;
          case 'split':
            if (isSelf) soundManager.playSplit();
            break;
          case 'explode':
            soundManager.playExplode();
            break;
          case 'eat_player':
            soundManager.playEatPlayer();
            // Spawn floating text at eating spot
            const p = serverState.players.find(
              (pl) => pl.id === event.playerId
            );
            if (p && p.nodes.length > 0) {
              this.spawnFloatingMeme(p.nodes[0].x, p.nodes[0].y);
            }
            break;
        }
      });
    }

    // Synchronize nodes targets for interpolation and clean up old nodes
    const activeServerNodeIds = new Set();

    serverState.players.forEach((player) => {
      player.nodes.forEach((node) => {
        activeServerNodeIds.add(node.id);

        if (!this.nodesInterpolation.has(node.id)) {
          // New node: initialize instantly at target position
          this.nodesInterpolation.set(node.id, {
            currentX: node.x,
            currentY: node.y,
            targetX: node.x,
            targetY: node.y,
          });
        } else {
          // Existing node: update destination
          const interp = this.nodesInterpolation.get(node.id);
          interp.targetX = node.x;
          interp.targetY = node.y;
        }
      });
    });

    // Delete nodes that do not exist on the server anymore
    this.nodesInterpolation.forEach((val, id) => {
      if (!activeServerNodeIds.has(id)) {
        this.nodesInterpolation.delete(id);
      }
    });
  }

  handleSplitAction() {
    this.network.sendSplit();
  }

  handleEjectAction() {
    this.network.sendEject();
  }

  spawnFloatingMeme(x, y) {
    const memeText =
      this.brainrotMemes[Math.floor(Math.random() * this.brainrotMemes.length)];
    const colors = ['#00ffcc', '#ff0077', '#ffd700', '#ffaa00', '#ffffff'];

    this.floatingTexts.push({
      text: memeText,
      x: x,
      y: y,
      size: 24 + Math.floor(Math.random() * 16),
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 1.0,
      vy: -1.8 - Math.random() * 2, // Speed floating upwards
    });
  }

  getMyMass() {
    if (!this.gameState || !this.selfId) return 30;
    const player = this.gameState.players.find((p) => p.id === this.selfId);
    if (!player) return 0;
    return player.nodes.reduce((sum, node) => sum + node.mass, 0);
  }

  loop() {
    if (!this.isRunning) return;

    // Send input periodically on frame
    if (this.selfId && !this.gameState?.isIntermission) {
      const inputs = this.inputHandler.getInput();
      this.network.sendInput(inputs.angle, inputs.speed);
    }

    if (this.gameState) {
      // 1. Apply Lerp interpolation on player nodes
      this.gameState.players.forEach((player) => {
        player.nodes.forEach((node) => {
          const interp = this.nodesInterpolation.get(node.id);
          if (interp) {
            // LERP current coordinate towards server destination
            interp.currentX += (interp.targetX - interp.currentX) * 0.25;
            interp.currentY += (interp.targetY - interp.currentY) * 0.25;

            // Assign interpolated coordinates for drawing
            node.x = interp.currentX;
            node.y = interp.currentY;
          }
        });
      });

      // 2. Update floating texts
      this.floatingTexts.forEach((t) => {
        t.y += t.vy;
        t.opacity -= 0.02; // Fade out
      });
      this.floatingTexts = this.floatingTexts.filter((t) => t.opacity > 0);

      // 3. Render frame
      this.renderer.draw(this.gameState, this.selfId, this.floatingTexts);
    }

    requestAnimationFrame(() => this.loop());
  }
}
