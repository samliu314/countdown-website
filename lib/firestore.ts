import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Event } from '@/lib/types';

type EventPayload = Omit<Event, 'id'>;

export function toFirestore(data: EventPayload): Record<string, unknown> {
  return {
    ...data,
    target: Timestamp.fromDate(data.target),
  };
}

export function fromFirestore(id: string, data: Record<string, unknown>): Event {
  return {
    ...(data as Omit<Event, 'id' | 'target'>),
    id,
    target: (data.target as { toDate: () => Date }).toDate(),
  };
}

export function subscribeEvents(callback: (events: Event[]) => void): () => void {
  return onSnapshot(collection(db, 'events'), snapshot => {
    const events = snapshot.docs.map(d => fromFirestore(d.id, d.data()));
    callback(events);
  });
}

export async function addEvent(data: EventPayload): Promise<void> {
  await addDoc(collection(db, 'events'), toFirestore(data));
}

export async function updateEvent(id: string, data: EventPayload): Promise<void> {
  await updateDoc(doc(db, 'events', id), toFirestore(data));
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, 'events', id));
}
