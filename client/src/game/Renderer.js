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

  draw(gameState, selfSocketId, floatingTexts) {
    this.resize();
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Clear background with grid pattern
    ctx.fillStyle = '#080914';
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
    // Center of screen
    ctx.translate(w / 2, h / 2);
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
    ctx.translate(f.x, f.y);

    if (f.type === 'date') {
      // Date: Brown oval
      ctx.fillStyle = '#5c4033';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 6, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3d2b22';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (f.type === 'water') {
      // Water: Cyan bottle
      ctx.fillStyle = '#00d2ff';
      ctx.fillRect(-4, -6, 8, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -9, 4, 3);
      // glow outline
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-4, -6, 8, 12);
    } else if (f.type === 'milk') {
      // Milk: White box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-5, -7, 10, 14);
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-5, -2, 10, 3); // red label strip
    } else if (f.type === 'kebab') {
      // Kebab wrapper
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00ff55'; // lettuce green peak
      ctx.fillRect(-3, -8, 6, 4);
    } else {
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
    }
    ctx.restore();
  }

  drawAlarm(ctx, a) {
    ctx.save();
    ctx.translate(a.x, a.y);

    // Spiked green virus clock drawing
    const spikes = 16;
    const outerRadius = a.radius;
    const innerRadius = a.radius - 8;

    ctx.fillStyle = '#1e3c1e';
    ctx.strokeStyle = '#39ff14'; // Neon Green
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

    // Draw little clock hands inside
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -innerRadius * 0.5);
    ctx.moveTo(0, 0);
    ctx.lineTo(innerRadius * 0.35, 0);
    ctx.stroke();

    ctx.restore();
  }

  drawPlayerNode(ctx, player, node, isSelf) {
    ctx.save();
    ctx.translate(node.x, node.y);

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
