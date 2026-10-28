// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
  diamondGapMin: 2,
  diamondGapMax: 5,
  diamondValue: 2,
  // Backgrounds offered before the first round; each is drawn in code (pattern: grid, dots, waves or stars).
  backgroundPatternSize: 40,
  backgrounds: [
    { name: 'Night', color: 0x101c31, detail: 0x24334b, pattern: 'grid' },
    { name: 'Forest', color: 0x12301f, detail: 0x2f6b45, pattern: 'dots' },
    { name: 'Ocean', color: 0x0b3048, detail: 0x1f6f93, pattern: 'waves' },
    { name: 'Space', color: 0x05040f, detail: 0xcfd8ff, pattern: 'stars' }
  ],
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a, diamond: 0x7fd8ff }
};
