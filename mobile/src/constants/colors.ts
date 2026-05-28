/* ============================================================
   Obsidian Capital Mobile — Design Token Colors
   ============================================================ */

export const Colors = {
  obsidian:   '#0a0a0a',
  surface:    '#111111',
  surface2:   '#1a1a1a',
  surface3:   '#222222',
  border:     '#2a2a2a',
  gold:       '#c9a84c',
  goldLight:  '#e8c96e',
  offWhite:   '#f0ede8',
  gain:       '#3d9e6e',
  loss:       '#c0453a',
  text:       '#f0ede8',
  textMuted:  'rgba(240,237,232,0.5)',
} as const;

export type ColorKey = keyof typeof Colors;
