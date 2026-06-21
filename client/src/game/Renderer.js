export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Viewport camera focus coordinates
    this.camX = 1500;
    this.camY = 1500;
    this.camZoom = 1.0;
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  draw(gameState, selfSocketId, floatingTexts, shakeIntensity = 0) {
    this.resize();
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Clear background with grid pattern & Sunrise Sunrise Phase
    if (gameState.isIntermission) {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#130f40');
      grad.addColorStop(0.5, '#786fa6');
      grad.addColorStop(1, '#e15f41');
      ctx.fillStyle = grad;
    } else {
      const timeRatio = gameState.timer / 90; // assuming 90s round duration
      if (timeRatio > 0.45) {
        ctx.fillStyle = '#080914';
      } else {
        const trans = (0.45 - timeRatio) / 0.45;
        const r = Math.round(8 + (35 - 8) * trans);
        const g = Math.round(9 + (18 - 9) * trans);
        const b = Math.round(20 + (50 - 20) * trans);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      }
    }
    ctx.fillRect(0, 0, w, h);

    // Find the player's own nodes to compute camera center
    const selfPlayer = gameState.players.find((p) => p.id === selfSocketId);
    let targetX = 1500;
    let targetY = 1500;
    let combinedMass = 30;

    if (selfPlayer && selfPlayer.nodes.length > 0) {
      let sumX = 0;
      let sumY = 0;
      combinedMass = 0;
      selfPlayer.nodes.forEach((n) => {
        sumX += n.x * n.mass;
        sumY += n.y * n.mass;
        combinedMass += n.mass;
      });
      targetX = sumX / combinedMass;
      targetY = sumY / combinedMass;
    } else {
      // Spectating or not joined yet - follow map center
      targetX = 1500;
      targetY = 1500;
    }

    // Camera interpolation (smooth follow)
    this.camX += (targetX - this.camX) * 0.1;
    this.camY += (targetY - this.camY) * 0.1;

    // Zoom dynamic based on player mass (larger players zoom out)
    const targetZoom = Math.max(
      0.35,
      Math.min(1.2, 1.0 / (1.0 + Math.log10(combinedMass / 30) * 0.4))
    );
    this.camZoom += (targetZoom - this.camZoom) * 0.05;

    ctx.save();
    // Center of screen + Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * shakeIntensity;
      shakeY = (Math.random() - 0.5) * shakeIntensity;
    }
    ctx.translate(w / 2 + shakeX, h / 2 + shakeY);
    ctx.scale(this.camZoom, this.camZoom);
    ctx.translate(-this.camX, -this.camY);

    // 2. Draw map grid
    this.drawGrid(ctx);

    // 3. Draw map boundary
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 12;
    ctx.strokeRect(0, 0, 3000, 3000);

    // 4. Draw Sunrise Shadow Ring (safe shadow vs sun rays)
    const mapCenter = 1500;
    ctx.save();
    ctx.beginPath();
    ctx.arc(mapCenter, mapCenter, gameState.ringRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Clip outer sunlit region
    // Draw sunlight danger warning overlay outside the ring
    ctx.restore();

    // We draw red translucent warning ring around the shadow border
    ctx.strokeStyle = 'rgba(255, 0, 80, 0.2)';
    ctx.lineWidth = 80;
    ctx.beginPath();
    ctx.arc(mapCenter, mapCenter, gameState.ringRadius + 40, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Draw Food Pellets
    gameState.food.forEach((f) => {
      this.drawFood(ctx, f);
    });

    // 6. Draw Ejected Masses
    ctx.fillStyle = '#8a99ad';
    gameState.ejected.forEach((e) => {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 7. Draw Alarm Clocks (Viruses)
    gameState.alarms.forEach((a) => {
      this.drawAlarm(ctx, a);
    });

    // 7.5 Draw Snake Enemies
    (gameState.snakes || []).forEach((s) => {
      this.drawSnake(ctx, s);
    });

    // 8. Draw Player Nodes
    // Sort players so smaller players are drawn first (bigger on top)
    const sortedPlayers = [...gameState.players].sort((a, b) => {
      const massA = a.nodes.reduce((sum, n) => sum + n.mass, 0);
      const massB = b.nodes.reduce((sum, n) => sum + n.mass, 0);
      return massA - massB;
    });

    sortedPlayers.forEach((player) => {
      player.nodes.forEach((node) => {
        const isSelf = player.id === selfSocketId;
        this.drawPlayerNode(ctx, player, node, isSelf);
      });
    });

    // 9. Renders floating text popups
    this.drawFloatingTexts(ctx, floatingTexts);

    ctx.restore();
  }

  drawGrid(ctx) {
    const gridSize = 100;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    // Vertical lines
    for (let x = 0; x <= 3000; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 3000);
    }
    // Horizontal lines
    for (let y = 0; y <= 3000; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(3000, y);
    }
    ctx.stroke();
  }

  drawFood(ctx, f) {
    ctx.save();
    // Floating bounce micro-animation
    const floatY = Math.sin(Date.now() * 0.004 + f.id) * 2.5;
    ctx.translate(f.x, f.y + floatY);

    if (f.type === 'kentongan') {
      // Kentongan: Brown bamboo tube with a vertical slot
      ctx.fillStyle = '#a16207'; // bamboo brown
      ctx.fillRect(-4, -9, 8, 18);
      ctx.fillStyle = '#000000'; // slot
      ctx.fillRect(-1.5, -5, 3, 10);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-4, -9, 8, 18);
    } else if (f.type === 'panci') {
      // Panci: Metallic grey pan with handle
      ctx.fillStyle = '#94a3b8'; // grey metal
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // pan handle
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-7, 2);
      ctx.lineTo(-14, 2);
      ctx.stroke();
    } else if (f.type === 'toa') {
      // Toa: Megaphone horn speaker
      ctx.fillStyle = '#e2e8f0'; // horn body
      ctx.beginPath();
      ctx.moveTo(-6, -3);
      ctx.lineTo(4, -8);
      ctx.lineTo(4, 8);
      ctx.lineTo(-6, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // handle/body base
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-9, -2, 3, 8);
    } else if (f.type === 'bedug') {
      // Bedug: Large horizontal drum on frame
      ctx.fillStyle = '#7c2d12'; // wood red-brown
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // bedug drum skin face (yellowish)
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(10, 0, 2.5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (f.type === 'shake') {
      // Grimace Shake: Purple cup
      ctx.fillStyle = '#800080';
      ctx.beginPath();
      ctx.moveTo(-5, -7);
      ctx.lineTo(5, -7);
      ctx.lineTo(3, 7);
      ctx.lineTo(-3, 7);
      ctx.closePath();
      ctx.fill();
      // Straw
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(2, -12);
      ctx.stroke();
    } else if (f.type === 'kopi') {
      // Kopi (Coffee Cup)
      ctx.fillStyle = '#1e293b'; // dark cup
      ctx.fillRect(-6, -6, 12, 12);
      // Cup lid
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7, -8, 14, 3);
      // Cup sleeve
      ctx.fillStyle = '#8b4513'; // brown sleeve
      ctx.fillRect(-6.5, -2, 13, 6);
    } else if (f.type === 'indomie') {
      // Indomie (Noodle Bowl)
      ctx.fillStyle = '#facc15'; // yellow bowl/packet
      ctx.beginPath();
      ctx.arc(0, 2, 8, 0, Math.PI, false); // bottom half circle
      ctx.closePath();
      ctx.fill();
      // Noodle squiggles on top
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, 2);
      ctx.quadraticCurveTo(-3, -3, 0, 2);
      ctx.quadraticCurveTo(3, -3, 6, 2);
      ctx.stroke();
      // Red branding line
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-4, 5, 8, 2);
    } else {
      // Fallback
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawAlarm(ctx, a) {
    ctx.save();
    ctx.translate(a.x, a.y);

    // Slow spin rotation animation of the spiked halo
    const angleOffset = (Date.now() * 0.0006 + a.id) % (Math.PI * 2);

    const spikes = 16;
    const outerRadius = a.radius;
    const innerRadius = a.radius - 8;

    ctx.save();
    ctx.rotate(angleOffset);
    ctx.fillStyle = '#0f172a'; // Slate background
    ctx.strokeStyle = '#ef4444'; // Alarm Red spikes
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i / spikes) * Math.PI;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw Sleeping Face emoji in the center
    const fontSize = a.radius * 1.1;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('😴', 0, 0);

    // Draw floating Zzz above them
    const zOffset = Math.sin(Date.now() * 0.005 + a.id) * 3 - a.radius * 0.6;
    ctx.font = `bold ${a.radius * 0.4}px var(--font-mono)`;
    ctx.fillStyle = 'rgba(147, 197, 253, 0.9)'; // light blue Zzz
    ctx.fillText('Zzz', a.radius * 0.5, zOffset);

    ctx.restore();
  }

  drawSnake(ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y);

    // Draw head
    ctx.fillStyle = s.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, s.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw body segments trailing from head
    const segmentCount = 5;
    for (let i = 1; i <= segmentCount; i++) {
      const alpha = 1 - i * 0.14;
      ctx.fillStyle = `rgba(34, 255, 109, ${alpha})`;
      ctx.beginPath();
      ctx.arc(-i * (s.radius * 0.6), 0, s.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-s.radius * 0.25, -s.radius * 0.22, s.radius * 0.16, 0, Math.PI * 2);
    ctx.arc(s.radius * 0.15, -s.radius * 0.22, s.radius * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // Tongue flicker
    ctx.strokeStyle = '#ff003e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s.radius * 0.4, 0);
    ctx.lineTo(s.radius * 0.8, 0);
    ctx.stroke();

    ctx.restore();
  }

  drawPlayerNode(ctx, player, node, isSelf) {
    ctx.save();
    ctx.translate(node.x, node.y);

    // Draw active powerup visual indications
    if (player.shieldTimer > 0) {
      // Pink shield bubble
      ctx.strokeStyle = 'rgba(255, 0, 119, 0.7)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, node.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 0, 119, 0.12)';
      ctx.fill();
    } else if (player.speedMultiplier > 1.0) {
      // Speed trail aura
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.7)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, node.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (player.speedMultiplier < 1.0) {
      // Heavy slowness aura
      ctx.strokeStyle = 'rgba(139, 69, 19, 0.7)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, node.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 1. Draw glowing aura border
    ctx.shadowBlur = isSelf ? 20 : 8;
    ctx.shadowColor = player.color;

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw border stroke (reset shadows first)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = isSelf ? '#ffffff' : 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = isSelf ? 4.5 : 2.5;
    ctx.stroke();

    // 3. Draw Emoji Skin Avatar in Center
    let emoji = '🗿';
    if (player.skin === 'skibidi') emoji = '🚽';
    else if (player.skin === 'hawk-tuah') emoji = '💦';
    else if (player.skin === 'mewer') emoji = '🤫';
    else if (player.skin === 'rizzler') emoji = '😏';

    // Skin size scales with node radius
    const fontSize = node.radius * 1.05;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 0, 0);

    // 4. Draw Player Name & Mass
    ctx.font = `bold ${Math.max(10, node.radius * 0.28)}px var(--font-sans)`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw text with outline for legibility
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;

    const nameY = node.radius + 15;
    const massY = node.radius + Math.max(10, node.radius * 0.28) + 18;

    // Draw Name
    ctx.strokeText(player.name, 0, nameY);
    ctx.fillText(player.name, 0, nameY);

    // Draw Mass
    ctx.font = `${Math.max(8, node.radius * 0.22)}px var(--font-mono)`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeText(Math.round(node.mass).toString(), 0, massY);
    ctx.fillText(Math.round(node.mass).toString(), 0, massY);

    ctx.restore();
  }

  drawFloatingTexts(ctx, floatingTexts) {
    ctx.save();
    floatingTexts.forEach((t) => {
      ctx.font = `black ${t.size}px var(--font-mono)`;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;

      // Floating text opacity decay
      ctx.globalAlpha = t.opacity;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.restore();
  }
}
