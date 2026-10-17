// Room roster. Everything here is safe to share with both roles (no puzzle secrets).

export const PENALTY_MS = 15000;
export const FAIL_RESET_MS = 4200;

export const ROOMS = [
  { id: 'cipher', title: 'THE LOBBY', sub: 'SECURITY LAYER 01', stages: 3, timeMs: 360000 },
  { id: 'doors', title: 'THE CORRIDOR', sub: 'SECURITY LAYER 02', stages: 3, timeMs: 330000 },
  { id: 'bullets', title: 'THE ATRIUM', sub: 'SECURITY LAYER 03', stages: 3, timeMs: 330000 },
  { id: 'switchboard', title: 'THE SWITCHBOARD', sub: 'SECURITY LAYER 04', stages: 3, timeMs: 360000 },
  { id: 'maze', title: 'THE HARDLINE', sub: 'SECURITY LAYER 05', stages: 1, timeMs: 480000 },
];

export const ROLE_LABEL = {
  operator: { name: 'OPERATOR', where: 'JACKED IN', blurb: 'You can see the construct. You cannot read it.' },
  mentor: { name: 'MENTOR', where: 'ABOARD THE HALCYON', blurb: 'You can read the construct. You cannot see it.' },
};

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
