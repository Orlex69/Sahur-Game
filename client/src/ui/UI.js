// Atomic Design System Components for Sahur.io

// -------------------------------------------------------------
// ATOMS: Core raw UI nodes (SRP: Pure creation/structure)
// -------------------------------------------------------------
export class Button {
  constructor(text, className = '', onClick = null) {
    this.el = document.createElement('button');
    this.el.className = `btn ${className}`;
    this.el.textContent = text;
    if (onClick) {
      this.el.addEventListener('click', onClick);
    }
  }
}

export class InputField {
  constructor(placeholder, value = '') {
    this.el = document.createElement('input');
    this.el.type = 'text';
    this.el.className = 'input-field';
    this.el.placeholder = placeholder;
    this.el.value = value;
  }

  getValue() {
    return this.el.value.trim();
  }
}

// -------------------------------------------------------------
// MOLECULES: Small combinations of Atoms
// -------------------------------------------------------------
export class LeaderboardRow {
  constructor(rank, name, mass, isSelf = false) {
    this.el = document.createElement('div');
    this.el.className = `leaderboard-row ${isSelf ? 'self' : ''}`;

    const rankSpan = document.createElement('span');
    rankSpan.className = 'leaderboard-rank';
    rankSpan.textContent = rank;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'leaderboard-name';
    nameSpan.textContent = name;

    const massSpan = document.createElement('span');
    massSpan.className = 'leaderboard-mass';
    massSpan.textContent = mass;

    this.el.appendChild(rankSpan);
    this.el.appendChild(nameSpan);
    this.el.appendChild(massSpan);
  }
}

// -------------------------------------------------------------
// ORGANISMS: Major high-level panels coordinating logic
// -------------------------------------------------------------

// Organism 1: Lobby Screen (Skins, Input, Play button)
export class LobbyMenu {
  constructor(parentEl, onPlayCallback) {
    this.parentEl = parentEl;
    this.onPlay = onPlayCallback;
    this.selectedSkin = 'gigachad';

    this.skins = [
      { id: 'gigachad', name: '🗿 GigaChad', desc: 'Sigma male' },
      { id: 'skibidi', name: '🚽 Skibidi', desc: 'Brainrot king' },
      { id: 'hawk-tuah', name: '💦 Hawk Tuah', desc: 'Spit on it' },
      { id: 'mewer', name: '🤫 Mewer', desc: 'Bye Bye' },
      { id: 'rizzler', name: '😏 Rizzler', desc: 'W Rizz' },
    ];

    this.render();
  }

  render() {
    this.el = document.createElement('div');
    this.el.className = 'lobby-screen';

    const container = document.createElement('div');
    container.className = 'lobby-container panel';

    const title = document.createElement('h1');
    title.className = 'lobby-title';
    title.innerHTML =
      'Sahur<span style="color: var(--accent-color)">.io</span>';

    const subtitle = document.createElement('div');
    subtitle.className = 'lobby-subtitle';
    subtitle.textContent = 'Brainrot Edition';

    // Nickname input (Atom)
    this.nickInput = new InputField(
      'Enter nickname (e.g. Baby Rizz)...',
      this.getRandomNickname()
    );

    // Skin selector label
    const skinLabel = document.createElement('div');
    skinLabel.style.margin = '20px 0 10px';
    skinLabel.style.fontSize = '0.85rem';
    skinLabel.style.color = 'var(--text-muted)';
    skinLabel.style.fontFamily = 'var(--font-mono)';
    skinLabel.textContent = 'CHOOSE YOUR BRAINROT AVATAR:';

    // Skin grids
    const grid = document.createElement('div');
    grid.className = 'skin-selector';

    this.skinElMap = new Map();
    this.skins.forEach((skin) => {
      const opt = document.createElement('div');
      opt.className = `skin-option ${skin.id === this.selectedSkin ? 'active' : ''}`;

      const avatar = document.createElement('div');
      avatar.className = 'skin-avatar';
      avatar.textContent = skin.name.split(' ')[0]; // Extract emoji

      const name = document.createElement('span');
      name.textContent = skin.name.split(' ').slice(1).join(' ');

      opt.appendChild(avatar);
      opt.appendChild(name);

      opt.addEventListener('click', () => this.selectSkin(skin.id));
      grid.appendChild(opt);
      this.skinElMap.set(skin.id, opt);
    });

    // Play Button (Atom)
    const playBtn = new Button('ENTER SAHUR ARENA', 'btn-primary', () => {
      const name = this.nickInput.getValue();
      this.onPlay(name, this.selectedSkin);
    });
    playBtn.el.style.width = '100%';
    playBtn.el.style.marginTop = '25px';

    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(this.nickInput.el);
    container.appendChild(skinLabel);
    container.appendChild(grid);
    container.appendChild(playBtn.el);
    this.el.appendChild(container);
    this.parentEl.appendChild(this.el);
  }

  selectSkin(skinId) {
    this.skinElMap.get(this.selectedSkin).classList.remove('active');
    this.selectedSkin = skinId;
    this.skinElMap.get(this.selectedSkin).classList.add('active');
  }

  getRandomNickname() {
    const list = [
      'Baby Rizzler',
      'Kai Cenat',
      'Skibidi Fanum',
      'Mewing Sigma',
      'Grimace Mew',
      'Hawk Tuah fan',
      'Livvy Mew',
      'Amogus',
      'Skibidi Date',
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  hide() {
    this.el.style.display = 'none';
  }

  show() {
    this.el.style.display = 'flex';
  }
}

// Organism 2: HUD overlay (Mass counter, multipliers, timer countdown)
export class HUD {
  constructor(parentEl) {
    this.parentEl = parentEl;
    this.render();
  }

  render() {
    // 1. Timer element
    this.timerEl = document.createElement('div');
    this.timerEl.className = 'timer-panel panel';

    const tTitle = document.createElement('div');
    tTitle.className = 'timer-title';
    tTitle.textContent = 'Tung Tung Timer';

    this.tValue = document.createElement('div');
    this.tValue.className = 'timer-value';
    this.tValue.textContent = '00:00';

    this.timerEl.appendChild(tTitle);
    this.timerEl.appendChild(this.tValue);

    // 2. Stats container (mass, etc.)
    this.statsEl = document.createElement('div');
    this.statsEl.className = 'hud-container';

    const panel = document.createElement('div');
    panel.className = 'hud-panel panel';

    const item = document.createElement('div');
    item.className = 'hud-item';

    const label = document.createElement('span');
    label.className = 'hud-label';
    label.textContent = 'SAHUR NOISE';

    this.mValue = document.createElement('span');
    this.mValue.className = 'hud-value';
    this.mValue.textContent = '30';

    item.appendChild(label);
    item.appendChild(this.mValue);
    panel.appendChild(item);
    this.statsEl.appendChild(panel);

    // Append to UI root
    this.parentEl.appendChild(this.timerEl);
    this.parentEl.appendChild(this.statsEl);
  }

  update(mass, secondsLeft, isIntermission) {
    this.mValue.textContent = Math.floor(mass);

    if (isIntermission) {
      this.tValue.textContent = 'Sunrise!';
      this.tValue.classList.add('timer-danger');
      return;
    }

    const minutes = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    this.tValue.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (secondsLeft <= 15) {
      this.tValue.classList.add('timer-danger');
    } else {
      this.tValue.classList.remove('timer-danger');
    }
  }
}

// Organism 3: Leaderboard Panel
export class Leaderboard {
  constructor(parentEl) {
    this.parentEl = parentEl;
    this.render();
  }

  render() {
    this.el = document.createElement('div');
    this.el.className = 'leaderboard-panel panel';

    const title = document.createElement('div');
    title.className = 'leaderboard-title';
    title.textContent = 'Top Sigmas';

    this.listEl = document.createElement('div');
    this.listEl.className = 'leaderboard-list';

    this.el.appendChild(title);
    this.el.appendChild(this.listEl);
    this.parentEl.appendChild(this.el);
  }

  update(players, selfSocketId) {
    this.listEl.innerHTML = '';
    players.forEach((player, idx) => {
      const isSelf = player.id === selfSocketId;
      const name = player.isDead ? `[RIP] ${player.name}` : player.name;

      const row = new LeaderboardRow(`${idx + 1}.`, name, player.mass, isSelf);
      this.listEl.appendChild(row.el);
    });
  }
}

// Organism 4: Game Over Podium Modal
export class GameOverModal {
  constructor(parentEl, onRestartCallback) {
    this.parentEl = parentEl;
    this.onRestart = onRestartCallback;
    this.el = null;
  }

  show(personalStats, podium) {
    this.hide(); // Clear any existing

    this.el = document.createElement('div');
    this.el.className = 'modal-overlay';

    const container = document.createElement('div');
    container.className = 'modal-container panel';

    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.textContent = 'PATROL HOUR ENDED!';

    const subtitle = document.createElement('div');
    subtitle.className = 'modal-subtitle';

    if (podium.length > 0) {
      subtitle.innerHTML = `🏆 <b>${podium[0].name}</b> is the Ultimate Noise Leader with <b>${podium[0].score}</b> decibels!`;
    } else {
      subtitle.textContent = 'The patrol has ended. Sleeping neighbors won!';
    }

    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';

    // Personal score box
    const scoreBox = document.createElement('div');
    scoreBox.className = 'stat-box';
    const sLabel = document.createElement('div');
    sLabel.className = 'stat-label';
    sLabel.textContent = 'Max Mass';
    const sVal = document.createElement('div');
    sVal.className = 'stat-value';
    sVal.textContent = Math.floor(personalStats.score || 0);
    scoreBox.appendChild(sLabel);
    scoreBox.appendChild(sVal);

    // Personal status box
    const statusBox = document.createElement('div');
    statusBox.className = 'stat-box';
    const stLabel = document.createElement('div');
    stLabel.className = 'stat-label';
    stLabel.textContent = 'Patrol status';
    const stVal = document.createElement('div');
    stVal.className = 'stat-value';
    stVal.textContent = personalStats.isDead ? 'Busted 😴' : 'Noise King 🥁';
    stVal.style.color = personalStats.isDead
      ? 'var(--accent-color)'
      : 'var(--primary-color)';
    statusBox.appendChild(stLabel);
    statusBox.appendChild(stVal);

    statsGrid.appendChild(scoreBox);
    statsGrid.appendChild(statusBox);

    // Replay Button (Atom)
    const restartBtn = new Button('RUSH NEXT SAHUR', 'btn-primary', () => {
      this.hide();
      this.onRestart();
    });
    restartBtn.el.style.width = '100%';

    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(statsGrid);
    container.appendChild(restartBtn.el);
    this.el.appendChild(container);
    this.parentEl.appendChild(this.el);
  }

  hide() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}
