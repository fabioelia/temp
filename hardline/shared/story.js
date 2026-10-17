// The connecting narrative. Interstitials double as load-time cover, so each beat
// is short, in-fiction, and skippable after the first playthrough.
//
// A line is { who, text }. `who` picks the colour/voice of the line in the UI.
//   SYS   — the construct's boot readout
//   SHIP  — radio from the Halcyon
//   PROTO — a page of the Protocol, the salvaged manual written by Ada Kerr
//   NOTE  — narration

export const SHIP_NAME = 'HALCYON';
export const AUTHOR = 'Ada Kerr';

export function introBeats({ operator, mentor }) {
  return [
    { who: 'SYS', text: `HALCYON // UPLINK ESTABLISHED` },
    { who: 'SYS', text: `JACK-IN SEQUENCE INITIATED. DO NOT DISCONNECT.` },
    { who: 'SHIP', text: `Halcyon to the construct. The signal is thin, so I'll keep this short.` },
    { who: 'SHIP', text: `Somewhere below the lobby there's a hardline: a phone that rings in the real world. Reach it and you wake up. Miss it and the system folds you back into the loop.` },
    { who: 'SHIP', text: `${operator} goes in. ${mentor} stays aboard with the Protocol — every page we salvaged from the crew that tried before us. The Protocol can read the construct. It can't see it.` },
    { who: 'SHIP', text: `So talk. Describe what's in front of you. Don't assume.` },
  ];
}

export const ROOM_BEATS = [
  // 0 — The Lobby
  [
    { who: 'SYS', text: `CONSTRUCT LOADED // SECURITY LAYER 01 // THE LOBBY` },
    { who: 'PROTO', text: `p.1 — "The lock speaks in glyphs. The Protocol knows the language. You know the room. Neither is enough."` },
    { who: 'SYS', text: `PATROL LOOP: CLOSING` },
  ],
  // 1 — The Corridor
  [
    { who: 'SHIP', text: `You're through. Keep your voice low — the walls just noticed you.` },
    { who: 'PROTO', text: `p.14 — "Doors lie. The log doesn't. Check the glass before you trust the mark."` },
    { who: 'SYS', text: `SECURITY LAYER 02 // THE CORRIDOR` },
  ],
  // 2 — The Atrium
  [
    { who: 'SHIP', text: `Something's turned toward you. The system's correction process wears suits. We call them Agents. They don't chase — they correct.` },
    { who: 'PROTO', text: `p.27 — "Time bends here. Trust the tracer, not your eyes. Everything that is frozen will thaw."` },
    { who: 'SYS', text: `SECURITY LAYER 03 // THE ATRIUM // TEMPORAL LOCK ENGAGED` },
  ],
  // 3 — The Switchboard
  [
    { who: 'SHIP', text: `They're tracing the line. Re-route the signal through the old switchboard and the trace goes cold.` },
    { who: 'PROTO', text: `p.41 — "Follow the wire, not the colour. The colour is only a name."` },
    { who: 'SYS', text: `SECURITY LAYER 04 // THE SWITCHBOARD // TRACE: ACTIVE` },
  ],
  // 4 — The Hardline
  [
    { who: 'SHIP', text: `This is it. Below the server floor the construct stops pretending: no textures it doesn't need. Somewhere in there, a phone is ringing.` },
    { who: 'PROTO', text: `p.58 — "I mapped it twice. It was different the second time. I stopped trusting the walls. I trusted who was on the line." — A.K.` },
    { who: 'SYS', text: `SECURITY LAYER 05 // THE HARDLINE // NO PATROL. NO MERCY. ONLY CLOCK.` },
  ],
];

export const RETRY_BEATS = [
  [
    { who: 'SYS', text: `RESIMULATING...` },
    { who: 'SHIP', text: `The construct reset. Same room. New numbers — the pages have shifted, so don't trust what you remember.` },
  ],
  [
    { who: 'SYS', text: `RESIMULATING...` },
    { who: 'SHIP', text: `That one slipped. It happens. Breathe, then talk it through again.` },
  ],
  [
    { who: 'SYS', text: `RESIMULATING...` },
    { who: 'SHIP', text: `Patrol loop reseeded. You've got the whole clock back.` },
  ],
];

export function outroBeats({ operator, mentor }) {
  return [
    { who: 'SYS', text: `HARDLINE CONNECTED` },
    { who: 'NOTE', text: `The phone stops ringing. The line opens. The green drains out of the world like water from a basin.` },
    { who: 'SYS', text: `WAKING UP...` },
    { who: 'SHIP', text: `Halcyon here. Signal's clean. Welcome back, ${operator}. Welcome back, ${mentor}.` },
    { who: 'PROTO', text: `p.59 — (blank) — "Add your page."` },
  ];
}

export function epilogueNote({ operator, mentor }) {
  return `"Describe. Don't assume. Trust who's on the line." — ${operator} & ${mentor}`;
}

export const WAIT_LINES = [
  'Waiting for your partner to finish loading…',
  'Partner is still jacking in…',
];
