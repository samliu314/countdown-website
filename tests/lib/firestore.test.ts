import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
  },
  collection: vi.fn(() => 'mock-collection-ref'),
  onSnapshot:  vi.fn(() => vi.fn()),
  addDoc:      vi.fn(),
  updateDoc:   vi.fn(),
  deleteDoc:   vi.fn(),
  doc:         vi.fn(() => 'mock-doc-ref'),
}));

vi.mock('@/lib/firebase', () => ({ db: 'mock-db', auth: {} }));

import {
  toFirestore,
  fromFirestore,
  addEvent,
  updateEvent,
  deleteEvent,
} from '@/lib/firestore';
import { addDoc, updateDoc, deleteDoc, collection, doc } from 'firebase/firestore';

const mockPayload = {
  name: 'Test Event',
  type: 'music' as const,
  target: new Date('2026-06-15T20:00:00'),
  image: null,
  fs: 16,
  ff: "'Fira Code',monospace",
  emoji: '🎵',
  venue: 'Test Venue',
  fullBg: false,
};

describe('toFirestore', () => {
  it('converts Date target to Timestamp shape', () => {
    const result = toFirestore(mockPayload);
    expect(result.target).toHaveProperty('toDate');
    expect((result.target as { toDate: () => Date }).toDate()).toEqual(mockPayload.target);
  });

  it('preserves all non-date fields unchanged', () => {
    const result = toFirestore(mockPayload);
    expect(result.name).toBe('Test Event');
    expect(result.type).toBe('music');
    expect(result.venue).toBe('Test Venue');
    expect(result.image).toBeNull();
  });
});

describe('fromFirestore', () => {
  const firestoreData = {
    ...mockPayload,
    target: { toDate: () => mockPayload.target },
  };

  it('sets id from the document id argument', () => {
    const result = fromFirestore('doc-abc', firestoreData);
    expect(result.id).toBe('doc-abc');
  });

  it('converts Timestamp target back to a Date', () => {
    const result = fromFirestore('doc-abc', firestoreData);
    expect(result.target).toBeInstanceOf(Date);
    expect(result.target).toEqual(mockPayload.target);
  });

  it('preserves all non-date fields', () => {
    const result = fromFirestore('doc-abc', firestoreData);
    expect(result.name).toBe('Test Event');
    expect(result.venue).toBe('Test Venue');
  });
});

describe('addEvent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls addDoc with the events collection and converted data', async () => {
    await addEvent(mockPayload);
    expect(collection).toHaveBeenCalledWith('mock-db', 'events');
    expect(addDoc).toHaveBeenCalledWith(
      'mock-collection-ref',
      expect.objectContaining({ name: 'Test Event', type: 'music' }),
    );
  });
});

describe('updateEvent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls updateDoc with the correct document ref and converted data', async () => {
    await updateEvent('doc-abc', mockPayload);
    expect(doc).toHaveBeenCalledWith('mock-db', 'events', 'doc-abc');
    expect(updateDoc).toHaveBeenCalledWith(
      'mock-doc-ref',
      expect.objectContaining({ name: 'Test Event' }),
    );
  });
});

describe('deleteEvent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls deleteDoc with the correct document ref', async () => {
    await deleteEvent('doc-abc');
    expect(doc).toHaveBeenCalledWith('mock-db', 'events', 'doc-abc');
    expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
  });
});
