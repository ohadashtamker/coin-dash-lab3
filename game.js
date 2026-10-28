/* global Phaser, COIN_DASH */
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.finished = false;
    this.paused = false;
    this.deadline = this.time.now + c.roundSeconds * 1000;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    // The first time the scene starts, show the background menu instead of a round.
    const chosen = this.registry.get('background');
    this.choosing = chosen === undefined;
    this.drawBackground(this.add.graphics(), c.backgrounds[chosen ?? 0], 0, 0, c.width, c.height);
    if (this.choosing) { this.showBackgroundMenu(); return; }
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24, c.colors.player);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    // A diamond is drawn over the coin's physics body; placeCoin() shows one or the other.
    this.diamond = this.add.rectangle(100, 100, 16, 16, c.colors.diamond).setAngle(45).setVisible(false);
    this.normalsUntilDiamond = Phaser.Math.Between(c.diamondGapMin, c.diamondGapMax);
    this.placeCoin();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.rectangle(90 + i * 270, 100, 26, 26, c.colors.drone);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
    }
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.score += this.isDiamond ? c.diamondValue : 1;
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.finish('A drone caught you!'));
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
  }

  // Draws a background into the rectangle (x, y, w, h); scale shrinks the pattern for menu previews.
  drawBackground(g, bg, x, y, w, h, scale = 1) {
    const step = COIN_DASH.backgroundPatternSize * scale;
    g.fillStyle(bg.color, 1).fillRect(x, y, w, h);
    g.lineStyle(1, bg.detail, 0.45);
    if (bg.pattern === 'grid') {
      for (let i = x; i <= x + w; i += step) g.lineBetween(i, y, i, y + h);
      for (let j = y; j <= y + h; j += step) g.lineBetween(x, j, x + w, j);
    } else if (bg.pattern === 'dots') {
      g.fillStyle(bg.detail, 0.7);
      for (let i = x + step / 2; i < x + w; i += step) {
        for (let j = y + step / 2; j < y + h; j += step) g.fillCircle(i, j, 3 * scale);
      }
    } else if (bg.pattern === 'waves') {
      g.lineStyle(2 * scale, bg.detail, 0.6);
      for (let j = y + step / 2; j < y + h; j += step) {
        const points = [];
        for (let i = x; i <= x + w; i += 4 * scale) {
          points.push(new Phaser.Math.Vector2(i, j + Math.sin((i - x) / (step / 3)) * step / 6));
        }
        g.strokePoints(points);
      }
    } else if (bg.pattern === 'stars') {
      // A fixed seed keeps the star field the same in the preview and in every round.
      const rnd = new Phaser.Math.RandomDataGenerator(['coin-dash']);
      const count = Math.round(w * h / (step * step) * 0.6);
      for (let k = 0; k < count; k++) {
        g.fillStyle(bg.detail, rnd.realInRange(0.3, 1));
        g.fillCircle(x + rnd.frac() * w, y + rnd.frac() * h, rnd.realInRange(0.6, 1.8) * scale);
      }
    }
  }

  showBackgroundMenu() {
    const c = COIN_DASH;
    const n = c.backgrounds.length;
    const w = 160, h = 100, gap = 24;
    const left = (c.width - (n * w + (n - 1) * gap)) / 2;
    const top = c.height / 2 - 70;
    this.add.rectangle(c.width / 2, c.height / 2, c.width - 40, 300, 0x0a1120, 0.95);
    this.add.text(c.width / 2, top - 45, 'Choose a background',
      { font: '24px monospace', color: '#ffffff' }).setOrigin(0.5);
    c.backgrounds.forEach((bg, i) => {
      const x = left + i * (w + gap);
      const g = this.add.graphics();
      this.drawBackground(g, bg, x, top, w, h, 0.5);
      g.lineStyle(2, 0xffffff, 0.8).strokeRect(x, top, w, h);
      this.add.text(x + w / 2, top + h + 22, `${i + 1}  ${bg.name}`,
        { font: '18px monospace', color: '#ffffff' }).setOrigin(0.5);
      this.add.zone(x, top, w, h).setOrigin(0).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.chooseBackground(i));
    });
    this.add.text(c.width / 2, top + h + 70, `Press 1-${n} or click a picture`,
      { font: '16px monospace', color: '#9fb0c8' }).setOrigin(0.5);
    this.input.keyboard.on('keydown', (event) => {
      const i = Number(event.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < n) this.chooseBackground(i);
    });
  }

  chooseBackground(i) {
    // The registry outlives scene restarts, so R keeps this background for later rounds.
    this.registry.set('background', i);
    this.scene.restart();
  }

  placeCoin() {
    const c = COIN_DASH;
    // Avoid spawning the next coin directly underneath the player.
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60);
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
    // A diamond comes after exactly N normal coins; then a new gap N starts.
    this.isDiamond = this.normalsUntilDiamond === 0;
    if (this.isDiamond) this.normalsUntilDiamond = Phaser.Math.Between(c.diamondGapMin, c.diamondGapMax);
    else this.normalsUntilDiamond--;
    this.coin.setVisible(!this.isDiamond);
    this.diamond.setPosition(x, y).setVisible(this.isDiamond);
  }

  togglePause() {
    if (this.finished) return;
    const c = COIN_DASH;
    this.paused = !this.paused;
    if (this.paused) {
      this.pausedAt = this.time.now;
      this.physics.pause();
      this.pauseBox = this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x0a1120, 0.95);
      this.pauseText = this.add.text(c.width / 2, c.height / 2, 'Paused\nPress P to resume',
        { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
      ).setOrigin(0.5);
    } else {
      // Push the deadline back so the round timer stays frozen while paused.
      this.deadline += this.time.now - this.pausedAt;
      this.physics.resume();
      this.pauseBox.destroy();
      this.pauseText.destroy();
    }
  }

  update() {
    if (this.finished || this.paused || this.choosing) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    this.hud.setText(`Points: ${this.score}                      Time: ${seconds}s`);
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} points scored\nPress R to try again`,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
  }
}
window.coinDashGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COIN_DASH.width,
  height: COIN_DASH.height,
  backgroundColor: COIN_DASH.colors.background,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  scene: CoinDash
});
