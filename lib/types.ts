export type EventType = 'music' | 'sports' | 'conference' | 'nature' | 'celebration' | 'other';

export interface Event {
  id: string;
  name: string;
  type: EventType;
  target: Date;
  image: string | null;
  fs: number;
  ff: string;
  emoji: string;
  venue: string;
  fullBg: boolean;
}
