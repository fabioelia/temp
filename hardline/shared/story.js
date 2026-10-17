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

export function introBeats({ operator, mentor }, chapter = 'classic') {
  if (chapter === 'deep') return deepIntroBeats({ operator, mentor });
  return [
    { who: 'SYS', text: `HALCYON // UPLINK ESTABLISHED` },
    { who: 'SYS', text: `JACK-IN SEQUENCE INITIATED. DO NOT DISCONNECT.` },
    { who: 'SHIP', text: `Halcyon to the construct. The signal is thin, so I'll keep this short.` },
    { who: 'SHIP', text: `Somewhere below the lobby there's a hardline: a phone that rings in the real world. Reach it and you wake up. Miss it and the system folds you back into the loop.` },
    { who: 'SHIP', text: `${operator} goes in. ${mentor} stays aboard with the Protocol — every page we salvaged from the crew that tried before us. The Protocol can read the construct. It can't see it.` },
    { who: 'SHIP', text: `So talk. Describe what's in front of you. Don't assume.` },
  ];
}

export const ROOM_BEATS = {
  // ---------------------------------------------------------------- Classic
  cipher: [
    { who: 'SYS', text: `CONSTRUCT LOADED // SECURITY LAYER 01 // THE LOBBY` },
    { who: 'PROTO', text: `p.1 — "The lock speaks in glyphs. The Protocol knows the language. You know the room. Neither is enough."` },
    { who: 'SYS', text: `PATROL LOOP: CLOSING` },
  ],
  doors: [
    { who: 'SHIP', text: `You're through. Keep your voice low — the walls just noticed you.` },
    { who: 'PROTO', text: `p.14 — "Doors lie. The log doesn't. Check the glass before you trust the mark."` },
    { who: 'SYS', text: `SECURITY LAYER 02 // THE CORRIDOR` },
  ],
  bullets: [
    { who: 'SHIP', text: `Something's turned toward you. The system's correction process wears suits. We call them Agents. They don't chase — they correct.` },
    { who: 'PROTO', text: `p.27 — "Time bends here. Trust the badge, not your eyes. Everything that is frozen will thaw."` },
    { who: 'SYS', text: `SECURITY LAYER 03 // THE ATRIUM // TEMPORAL LOCK ENGAGED` },
  ],
  switchboard: [
    { who: 'SHIP', text: `They're tracing the line. Re-route the signal through the old switchboard and the trace goes cold.` },
    { who: 'PROTO', text: `p.41 — "Follow the wire, not the colour. The colour is only a name."` },
    { who: 'SYS', text: `SECURITY LAYER 04 // THE SWITCHBOARD // TRACE: ACTIVE` },
  ],
  maze: [
    { who: 'SHIP', text: `This is it. Below the server floor the construct stops pretending: no textures it doesn't need. Somewhere in there, a phone is ringing.` },
    { who: 'PROTO', text: `p.58 — "I mapped it twice. It was different the second time. I stopped trusting the walls. I trusted who was on the line." — A.K.` },
    { who: 'SYS', text: `SECURITY LAYER 05 // THE HARDLINE // NO PATROL. NO MERCY. ONLY CLOCK.` },
  ],
  // -------------------------------------------------------------- Deep Loop
  echo: [
    { who: 'SYS', text: `DEEP LAYER 01 // THE ECHO CHAMBER` },
    { who: 'SHIP', text: `Halcyon. The phone connected — and then it kept ringing, from further down. Whatever answers down there is repeating us back, a half-beat late.` },
    { who: 'PROTO', text: `Appendix A.1 — "The Chamber speaks in colours and glyphs. Answer in the Chamber's own grammar. And note: every mistake you make changes the grammar." — A.K.` },
  ],
  vault: [
    { who: 'SYS', text: `DEEP LAYER 02 // THE VAULT` },
    { who: 'SHIP', text: `A vault, in a place that was supposed to be empty. Someone locked something in here on purpose.` },
    { who: 'PROTO', text: `Appendix A.4 — "The vault never tells you the code. It tells you how many dials you got right. Between that and my notes, you can reason your way in." — A.K.` },
  ],
  grid: [
    { who: 'SYS', text: `DEEP LAYER 03 // THE SUBSTATION // OVERLOAD ON MULTIPLE NODES` },
    { who: 'SHIP', text: `The substation feeds the whole layer, and it's overloaded. Every lever is wired to more than it looks. Don't pull anything you haven't worked out.` },
    { who: 'PROTO', text: `Appendix B.2 — "One lever, several lamps. Start with the lamp only one lever can reach." — A.K.` },
  ],
  triangulate: [
    { who: 'SYS', text: `DEEP LAYER 04 // THE SIGNAL ROOM // BEACONS DETECTED` },
    { who: 'SHIP', text: `There's a way out hidden on the map, and the only thing that points to it is the beacons. Read us their bearings — all of them, exactly as they're written.` },
    { who: 'PROTO', text: `Appendix B.7 — "Three dials, three languages. A dial that flickers is lying to you." — A.K.` },
  ],
  logic: [
    { who: 'SYS', text: `DEEP LAYER 05 // THE LOGIC WALL // PARSING…` },
    { who: 'SHIP', text: `The construct's own reasoning, laid out on a wall. It decides what's allowed through. If we can feed it the right inputs, it'll let us pass.` },
    { who: 'PROTO', text: `Appendix C.1 — "Every gate has a glyph, and every glyph a meaning. The meanings change each time the Wall is rebuilt. Don't trust yesterday's notes." — A.K.` },
  ],
  mosaic: [
    { who: 'SYS', text: `DEEP LAYER 06 // THE MOSAIC // MEMORY DEFRAGMENTATION REQUIRED` },
    { who: 'SHIP', text: `This is the last piece. A picture the construct broke into tiles, and neither of you holds all of the clues. Read yours aloud. Build it together.` },
    { who: 'PROTO', text: `Appendix C.9 — "I held half the numbers. Someone I trusted held the other half. That is the only way this picture was ever meant to be drawn." — A.K.` },
  ],
};

function deepIntroBeats({ operator, mentor }) {
  return [
    { who: 'SYS', text: `HALCYON // SECOND UPLINK ESTABLISHED` },
    { who: 'SYS', text: `JACK-IN SEQUENCE INITIATED. DEPTH: BEYOND THE HARDLINE.` },
    { who: 'SHIP', text: `Halcyon here. I need you both to listen. When the phone connected, our instruments should have shown you outside. They don't. The signal went down a layer, not up.` },
    { who: 'SHIP', text: `A construct inside a construct. Ada's Protocol has an appendix we'd never dared open — six more doors, each harder than the last. Her note on the cover says: "If the phone rings twice, don't wake up. Go deeper."` },
    { who: 'SHIP', text: `${operator} goes in. ${mentor} reads. The rules are stranger down here, and a lot more of them. So talk — and write things down.` },
  ];
}

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

export function outroBeats({ operator, mentor }, chapter = 'classic') {
  if (chapter === 'classic') {
    return [
      { who: 'SYS', text: `HARDLINE CONNECTED` },
      { who: 'NOTE', text: `The phone stops ringing. The line opens. The green drains out of the world like water from a basin.` },
      { who: 'SYS', text: `WAKING UP...` },
      { who: 'SHIP', text: `Halcyon here. Signal's clean. Welcome back, ${operator}. Welcome back, ${mentor}.` },
      { who: 'PROTO', text: `p.59 — (blank) — "Add your page." There is a second, thinner volume clipped behind it: "APPENDIX — DEEP LOOP."` },
    ];
  }
  return [
    { who: 'SYS', text: `LAYER CLEARED // SOURCE REACHED` },
    { who: 'NOTE', text: `The last tile locks. The picture resolves into a door. You walk through it together, one of you in the construct, one of you aboard the ship, both of you listening.` },
    { who: 'SYS', text: `WAKING UP...` },
    { who: 'SHIP', text: `Halcyon. Signal's clean. ...I think. Welcome back, ${operator}. Welcome back, ${mentor}. Don't pick up the phone this time.` },
    { who: 'PROTO', text: `Appendix, last page — "If you can read this, you were never alone in here. Add your page." — A.K.` },
  ];
}

export function epilogueNote({ operator, mentor }) {
  return `"Describe. Don't assume. Trust who's on the line." — ${operator} & ${mentor}`;
}

export const WAIT_LINES = [
  'Waiting for your partner to finish loading…',
  'Partner is still jacking in…',
];
