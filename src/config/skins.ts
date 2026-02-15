import type { SkinDefinition } from '../types';
import {
    createVariations,
    drawSphere,
    drawPigeon,
    drawShark,
    drawButterfly,
    drawChicken,
    drawFish,
    drawChimera,
    drawWhale,
    drawPhoenix,
    drawDragonfly,
    drawBee,
    drawClassicFlappy,
    drawJellyfish,
    drawDuck,
    drawBeetle,
    drawClownfish,
    drawSwordSurfer,
    drawReaper,
    drawLancer,
    drawSamurai,
    drawAetherDragon
} from '../renderers/SkinDrawers';

const DISTINCT_COLORS = ['#ff00ff', '#00ffaa', '#00aaff', '#ffaa00', '#ff3333']; // Pink, Emerald, Sapphire, Amber, Ruby

export const SKINS: SkinDefinition[] = [
    ...createVariations('sphere', 'Neon Sphere', 'Standard magnetic containment unit with eyes and energy core.', ['Balanced'], DISTINCT_COLORS, drawSphere, 500),
    ...createVariations('pigeon', 'Cyber Pigeon', 'Urban recon drone. High agility.', ['Agile'], DISTINCT_COLORS, drawPigeon, 600),
    ...createVariations('shark', 'Cyber Shark', 'Apex predator of the data streams.', ['Fast'], DISTINCT_COLORS, drawShark, 700),
    ...createVariations('butterfly', 'Cyber Butterfly', 'Bio-luminescent winged unit for silent data infiltration.', ['Flow'], DISTINCT_COLORS, drawButterfly, 800),
    ...createVariations('chicken', 'Sky Pecker', 'Orbital poultry craft with pulse wings.', ['Hover'], DISTINCT_COLORS, drawChicken, 900),
    ...createVariations('fish', 'Deep-Net Fish', 'Data stream inhabitant with oscillating tail.', ['Swim'], DISTINCT_COLORS, drawFish, 1000),
    ...createVariations('chimera', 'Cyber Chimera', 'Forbidden experimental hybrid predator.', ['Exotic'], DISTINCT_COLORS, drawChimera, 1100),
    ...createVariations('whale', 'Plasma Whale', 'Titan of the binary deep with energy fins.', ['Titan'], DISTINCT_COLORS, drawWhale, 1200),
    ...createVariations('phoenix', 'Cyber Phoenix', 'Mythical eternal bird reborn in neon fire.', ['Immortal'], DISTINCT_COLORS, drawPhoenix, 1300),
    ...createVariations('dragonfly', 'Neon Dragonfly', 'High-speed interceptor with quadruple wings.', ['Agile'], DISTINCT_COLORS, drawDragonfly, 1400),
    ...createVariations('bee', 'Cyber Bee', 'Aggressive swarm unit with pulse stinger.', ['Small'], DISTINCT_COLORS, drawBee, 1500),
    ...createVariations('flappy', 'Retro Flappy', 'Old-school classic reborn in the grid.', ['Classic'], DISTINCT_COLORS, drawClassicFlappy, 1600),
    ...createVariations('jellyfish', 'Plasma Jelly', 'Bioluminescent deep-sea explorer.', ['Fluid'], DISTINCT_COLORS, drawJellyfish, 1700),
    ...createVariations('duck', 'Cyber Duck', 'Tactical waterfowl with buoyant plating.', ['Quack'], DISTINCT_COLORS, drawDuck, 1800),
    ...createVariations('beetle', 'Iron Beetle', 'Heavy armored insect with hydraulic shell.', ['Heavy'], DISTINCT_COLORS, drawBeetle, 1900),
    ...createVariations('clownfish', 'Neon Clown', 'Playful reef inhabitant with energy bands.', ['Reef'], DISTINCT_COLORS, drawClownfish, 2000),
    ...createVariations('swordsurfer', 'Cyber Blade Walker', 'Legendary warrior surfing the data tides on a gravity-blade.', ['Legendary'], DISTINCT_COLORS, drawSwordSurfer, 2100),
    ...createVariations('reaper', 'Phantom Reaper', 'Demonic scythe-master with a tattered soul-cloak.', ['Grim'], DISTINCT_COLORS, drawReaper, 2200),
    ...createVariations('lancer', 'Plasma Lancer', 'Futuristic spear-rider with energy scarf.', ['Elite'], DISTINCT_COLORS, drawLancer, 2300),
    ...createVariations('samurai', 'Void Samurai', 'Traditional minimalist shadow-walker.', ['Swift'], DISTINCT_COLORS, drawSamurai, 2400),
    {
        id: 'aether-dragon-limited',
        name: 'AETHER DRAGON',
        price: 2500,
        description: 'LIMITED EDITION. A mythical creature from the void. Ethereal wings and pulse tail.',
        features: ['Legendary', 'Limited'],
        drawFunction: (ctx, bird, isDashing, frames) => drawAetherDragon(ctx, bird, isDashing, frames, '#00ffcc')
    }
];
