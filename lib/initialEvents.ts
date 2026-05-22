import type { Event } from './types';

export const initialEvents: Event[] = [
  { id: '1', name: 'Summer Music Festival', type: 'music',       target: new Date('2026-06-15T20:00:00'), image: null, fs: 18, ff: "'Syne',sans-serif",    emoji: '🎵', venue: 'Central Park, New York',        fullBg: false },
  { id: '2', name: 'World Cup Final',        type: 'sports',      target: new Date('2026-07-19T15:00:00'), image: null, fs: 16, ff: "'Fira Code',monospace", emoji: '⚽', venue: 'MetLife Stadium, NJ',            fullBg: false },
  { id: '3', name: 'Tech Summit 2026',       type: 'conference',  target: new Date('2026-09-01T09:00:00'), image: null, fs: 16, ff: "'Fira Code',monospace", emoji: '💻', venue: 'Moscone Center, San Francisco',  fullBg: false },
  { id: '4', name: 'New Year 2027',          type: 'celebration', target: new Date('2027-01-01T00:00:00'), image: null, fs: 22, ff: "'Syne',sans-serif",    emoji: '🎆', venue: 'Times Square, New York',          fullBg: false },
  { id: '5', name: 'Solar Eclipse',          type: 'nature',      target: new Date('2026-08-12T18:30:00'), image: null, fs: 16, ff: "'Fira Code',monospace", emoji: '🌑', venue: '',                               fullBg: false },
  { id: '6', name: 'City Marathon',          type: 'sports',      target: new Date('2026-06-28T07:00:00'), image: null, fs: 16, ff: "'Fira Code',monospace", emoji: '🏃', venue: 'City Hall, Chicago',              fullBg: false },
];
