export class InputHandler {
  constructor(canvas, onSplit, onEject) {
    this.canvas = canvas;
    this.onSplit = onSplit;
    this.onEject = onEject;

    this.angle = 0;
    this.speed = 0; // fraction from 0.0 to 1.0

    this.setupListeners();
  }

  setupListeners() {
    // Mouse movement determines vector from screen center
    window.addEventListener('mousemove', (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      this.angle = Math.atan2(dy, dx);

      // Speed scales up to a distance of 150px from center
      const dist = Math.hypot(dx, dy);
      this.speed = Math.min(1.0, dist / 150.0);
    });

    // Touch support for mobile layouts
    window.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length > 0) {
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          const dx = e.touches[0].clientX - centerX;
          const dy = e.touches[0].clientY - centerY;

          this.angle = Math.atan2(dy, dx);
          const dist = Math.hypot(dx, dy);
          this.speed = Math.min(1.0, dist / 150.0);
        }
      },
      { passive: true }
    );

    // Keyboard bindings for space (split) and W (eject mass)
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return; // prevent spamming on key hold

      if (e.code === 'Space') {
        e.preventDefault();
        this.onSplit();
      }
      if (e.code === 'KeyW') {
        e.preventDefault();
        this.onEject();
      }
    });
  }

  getInput() {
    return {
      angle: this.angle,
      speed: this.speed,
    };
  }
}
