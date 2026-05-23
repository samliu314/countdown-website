import { describe, it, expect } from 'vitest';
import { tzLocalToUTC, utcToTzLocal } from '@/lib/timezone';

describe('tzLocalToUTC', () => {
  it('converts Tokyo time to correct UTC (UTC+9)', () => {
    // 8pm Tokyo = 11am UTC
    const result = tzLocalToUTC('2026-06-15T20:00', 'Asia/Tokyo');
    expect(result.toISOString()).toBe('2026-06-15T11:00:00.000Z');
  });

  it('converts New York EDT time to correct UTC (UTC-4 in June)', () => {
    // 8pm EDT = midnight UTC next day
    const result = tzLocalToUTC('2026-06-15T20:00', 'America/New_York');
    expect(result.toISOString()).toBe('2026-06-16T00:00:00.000Z');
  });

  it('leaves UTC time unchanged', () => {
    const result = tzLocalToUTC('2026-06-15T20:00', 'UTC');
    expect(result.toISOString()).toBe('2026-06-15T20:00:00.000Z');
  });
});

describe('utcToTzLocal', () => {
  it('converts UTC to Tokyo local time string', () => {
    const utc = new Date('2026-06-15T11:00:00Z');
    expect(utcToTzLocal(utc, 'Asia/Tokyo')).toBe('2026-06-15T20:00');
  });

  it('converts UTC to New York EDT local time string', () => {
    const utc = new Date('2026-06-16T00:00:00Z');
    expect(utcToTzLocal(utc, 'America/New_York')).toBe('2026-06-15T20:00');
  });

  it('round-trips through tzLocalToUTC', () => {
    const localStr = '2026-09-01T09:00';
    const tz = 'Asia/Singapore';
    const utc = tzLocalToUTC(localStr, tz);
    expect(utcToTzLocal(utc, tz)).toBe(localStr);
  });
});
