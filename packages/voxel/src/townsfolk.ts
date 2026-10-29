// The people of every map, in game and on the land round it, are animal characters of the character library
// (content/characters.json, role `npc`: a cat, rabbit, fox or bear in an outfit, built on the player's rig). The
// generators and the outer land name a look by letter (`a`…`r`); each letter stands for one of these characters.
// They share the player's rig, so they play the same clips (idle, walk, pick-up, holding…) and hold props in the
// same right hand.

const NPC = 'generated/characters';

/** Every animal townsfolk model, cat, rabbit, fox and bear in turn, so neighbouring letters differ in kind. */
export const TOWNSFOLK_MODELS: readonly string[] = [
  `${NPC}/npc-cat-cam-overalls.glb`,
  `${NPC}/npc-rabbit-trang-overalls-green.glb`,
  `${NPC}/npc-fox-cam-jacket-red.glb`,
  `${NPC}/npc-bear-nau-overalls-green.glb`,
  `${NPC}/npc-cat-trang-dress.glb`,
  `${NPC}/npc-rabbit-nau-dress-blue.glb`,
  `${NPC}/npc-fox-do-jacket-green.glb`,
  `${NPC}/npc-bear-den-vest-shorts-green.glb`,
  `${NPC}/npc-cat-xam-dress-mint.glb`,
  `${NPC}/npc-rabbit-xam-vest-shorts-green.glb`,
  `${NPC}/npc-fox-tuyet-vest-shorts-navy.glb`,
  `${NPC}/npc-bear-mat-ong-jacket.glb`,
  `${NPC}/npc-cat-trang-jacket-red.glb`,
  `${NPC}/npc-rabbit-trang-vest-shorts.glb`,
  `${NPC}/npc-fox-cam-dress.glb`,
  `${NPC}/npc-bear-nau-vest-shorts.glb`,
  `${NPC}/npc-cat-cam-vest-shorts-navy.glb`,
  `${NPC}/npc-rabbit-nau-jacket.glb`,
  `${NPC}/npc-fox-do-dress-mint.glb`,
  `${NPC}/npc-bear-mat-ong-dress-blue.glb`,
  `${NPC}/npc-cat-xam-jacket-green.glb`,
  `${NPC}/npc-rabbit-xam-overalls-red.glb`,
  `${NPC}/npc-fox-tuyet-overalls.glb`,
  `${NPC}/npc-bear-den-overalls-red.glb`,
];

/** The look letters the generators use, `a`…`r`, each its own character. */
export const TOWNSFOLK_LETTERS = 'abcdefghijklmnopqr';

/** The townsfolk model a look letter stands for; throws on a letter outside `a`…`r`. */
export function townsfolk(letter: string): string {
  const i = letter.length === 1 ? TOWNSFOLK_LETTERS.indexOf(letter) : -1;
  const model = i >= 0 ? TOWNSFOLK_MODELS[i] : undefined;
  if (!model) throw new Error(`no townsfolk look "${letter}" (a…r)`);
  return model;
}
