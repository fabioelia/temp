// Room roster and chapters. Everything here is safe to share with both roles (no puzzle secrets).
//
// A *room* is one puzzle (cipher door, maze, ...). A *chapter* is an ordered run of rooms; the
// host picks one in the lobby. Rooms are identified by id everywhere (never by position), so a
// run can be any list of them.

export const PENALTY_MS = 15000;
export const FAIL_RESET_MS = 4200;

// `audioRoot` picks the root note of the room's score (see ROOM_ROOTS in audio.js).
export const ROOM_DEFS = {
  // ---- Classic: the way down to the hardline
  cipher: { id: 'cipher', title: 'THE LOBBY', stages: 3, timeMs: 360000, audioRoot: 0 },
  doors: { id: 'doors', title: 'THE CORRIDOR', stages: 3, timeMs: 330000, audioRoot: 1 },
  bullets: { id: 'bullets', title: 'THE ATRIUM', stages: 3, timeMs: 330000, audioRoot: 2 },
  switchboard: { id: 'switchboard', title: 'THE SWITCHBOARD', stages: 3, timeMs: 360000, audioRoot: 3 },
  maze: { id: 'maze', title: 'THE HARDLINE', stages: 1, timeMs: 480000, audioRoot: 4 },
  // ---- Deep Loop: harder, more layered puzzles beneath the hardline
  echo: { id: 'echo', title: 'THE ECHO CHAMBER', stages: 3, timeMs: 420000, audioRoot: 5 },
  vault: { id: 'vault', title: 'THE VAULT', stages: 3, timeMs: 420000, audioRoot: 6 },
  grid: { id: 'grid', title: 'THE SUBSTATION', stages: 3, timeMs: 450000, audioRoot: 7 },
  triangulate: { id: 'triangulate', title: 'THE SIGNAL ROOM', stages: 3, timeMs: 480000, audioRoot: 8 },
  logic: { id: 'logic', title: 'THE LOGIC WALL', stages: 3, timeMs: 480000, audioRoot: 9 },
  mosaic: { id: 'mosaic', title: 'THE MOSAIC', stages: 3, timeMs: 600000, audioRoot: 10 },
};

export const CHAPTERS = {
  classic: {
    id: 'classic',
    name: 'CLASSIC',
    blurb: 'Five layers down to the hardline.',
    prefix: 'SECURITY LAYER',
    rooms: ['cipher', 'doors', 'bullets', 'switchboard', 'maze'],
  },
  deep: {
    id: 'deep',
    name: 'DEEP LOOP',
    blurb: 'Six harder rooms beneath the hardline. More rules, more talking.',
    prefix: 'DEEP LAYER',
    rooms: ['echo', 'vault', 'grid', 'triangulate', 'logic', 'mosaic'],
  },
  gauntlet: {
    id: 'gauntlet',
    name: 'GAUNTLET',
    blurb: 'All eleven rooms, back to back.',
    prefix: 'LAYER',
    rooms: ['cipher', 'doors', 'bullets', 'switchboard', 'maze', 'echo', 'vault', 'grid', 'triangulate', 'logic', 'mosaic'],
  },
};

export const DEFAULT_CHAPTER = 'classic';

/** The ordered rooms of a chapter, each with its position-dependent subtitle ("SECURITY LAYER 03"). */
export function runFor(chapterId) {
  const ch = CHAPTERS[chapterId] ?? CHAPTERS[DEFAULT_CHAPTER];
  return ch.rooms.map((id, i) => ({ ...ROOM_DEFS[id], sub: `${ch.prefix} ${String(i + 1).padStart(2, '0')}` }));
}

export const ROLE_LABEL = {
  operator: { name: 'OPERATOR', where: 'JACKED IN', blurb: 'You can see the construct. You cannot read it.' },
  mentor: { name: 'MENTOR', where: 'ABOARD THE HALCYON', blurb: 'You can read the construct. You cannot see it.' },
};

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
