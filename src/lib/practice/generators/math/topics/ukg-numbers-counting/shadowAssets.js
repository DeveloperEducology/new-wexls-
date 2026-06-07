/**
 * Configuration registry for the Sticker Shadow Match skill.
 * Users can add, modify, or swap background scenes, sticker mascots,
 * and coordinate coordinates for the target shadows.
 *
 * Coordinates are percentage-based:
 * - x, y represent the CENTER of the sticker/shadow in the scene (0 to 100).
 * - widthPercent, heightPercent represent dimensions relative to scene size.
 */
export const shadowAssets = {
  // Topic: ukg-numbers-counting, Skill: Sticker shadow matching (ukg-numbers-shadow-match)
  ukgNumbersShadowMatch: {
    sceneImageUrl: '/images/prek_landscape.webp',
    stickers: [
      {
        id: 0,
        type: 'penguin',
        name: 'Chubby Penguin',
        imageUrl: '/images/penguin.svg',
        widthPercent: 14,
        heightPercent: 14,
      },
      {
        id: 1,
        type: 'rabbit',
        name: 'Cute Rabbit',
        imageUrl: '/images/rabbit.svg',
        widthPercent: 15,
        heightPercent: 15,
      },
      {
        id: 2,
        type: 'alex',
        name: 'Alex Mascot',
        imageUrl: '/images/alex_avatar.png',
        widthPercent: 16,
        heightPercent: 16,
      },
    ],
    // Coordinates (x, y) represent the center points where the shadows will render
    // and where stickers will magnetically snap.
    targets: [
      {
        id: 't_penguin',
        type: 'penguin',
        name: 'Penguin Shadow',
        x: 29, // center coordinate (22 + 14/2)
        y: 63, // center coordinate (56 + 14/2)
        widthPercent: 14,
        heightPercent: 14,
        label: 'Penguin Area',
      },
      {
        id: 't_alex',
        type: 'alex',
        name: 'Alex Shadow',
        x: 53, // center coordinate (45 + 16/2)
        y: 40, // center coordinate (32 + 16/2)
        widthPercent: 16,
        heightPercent: 16,
        label: 'Center Sky',
      },
      {
        id: 't_rabbit',
        type: 'rabbit',
        name: 'Rabbit Shadow',
        x: 75.5, // center coordinate (68 + 15/2)
        y: 62.5, // center coordinate (55 + 15/2)
        widthPercent: 15,
        heightPercent: 15,
        label: 'Rabbit Area',
      },
    ],
  },
};
