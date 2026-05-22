# Firebase Persistence & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the in-memory event store and mock auth with Firebase Firestore (public read, authenticated write) and Firebase Authentication (email/password), so events persist across refreshes and are visible to all visitors.

**Architecture:** Firebase Client SDK runs entirely in the browser — no server needed. An `onSnapshot` listener keeps events in sync with Firestore in real-time. `onAuthStateChanged` tracks the editor session, which persists across refreshes automatically.

**Tech Stack:** Firebase JS SDK v11 (modular), Firestore, Firebase Auth, Vitest for unit tests, Next.js 16 / React 19 / TypeScript 5

---

## File Map

| Action | File | What changes |
|---|---|---|
| Create | `lib/firebase.ts` | Firebase app init; exports `auth` and `db` |
| Create | `lib/firestore.ts` | CRUD helpers + data conversion; exports `toFirestore`, `fromFirestore`, `subscribeEvents`, `addEvent`, `updateEvent`, `deleteEvent` |
| Create | `tests/lib/firestore.test.ts` | Unit tests for conversion functions and CRUD helpers |
| Create | `vitest.config.ts` | Vitest config with `@/` path alias |
| Create | `.env.local` | Firebase project credentials (never committed) |
| Modify | `lib/types.ts` | `id: number` → `id: string` |
| Modify | `components/EventCard.tsx` | `onEdit/onDelete` prop types `number` → `string` |
| Modify | `components/ClientApp.tsx` | Replace mock auth + in-memory state with Firebase listeners |
| Modify | `package.json` | Add `firebase` dependency; add `"test"` script |

---

## Task 1: Manual Firebase Console Setup

> These steps happen in a web browser — no code to write. Complete all of them before Task 2.

- [ ] **Step 1: Create a Firebase project**

  Go to https://console.firebase.google.com → **Add project** → enter a project name (e.g. `countdown-events`) → disable Google Analytics if prompted → **Create project**.

- [ ] **Step 2: Enable Firestore**

  In the Firebase console sidebar → **Build → Firestore Database** → **Create database** → choose **Production mode** → pick a region close to you → **Done**.

- [ ] **Step 3: Set Firestore security rules**

  In Firestore → **Rules** tab → replace the entire content with:

  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /events/{eventId} {
        allow read:  if true;
        allow write: if request.auth != null;
      }
    }
  }
  ```

  Click **Publish**.

- [ ] **Step 4: Enable Email/Password authentication**

  Sidebar → **Build → Authentication** → **Get started** → **Sign-in method** tab → click **Email/Password** → toggle **Enable** → **Save**.

- [ ] **Step 5: Create the editor account**

  Still in Authentication → **Users** tab → **Add user** → enter your email (e.g. `editor@yourdomain.com`) and a strong password → **Add user**. Write down the email and password — you will use them to log in to the website.

- [ ] **Step 6: Copy your Firebase config**

  Sidebar → **Project settings** (gear icon) → scroll to **Your apps** → click **</>** (Web) → register the app (any nickname) → copy the `firebaseConfig` object values. You'll need all 6 values in Task 2.

---

## Task 2: Install Firebase SDK and Configure Environment

**Files:**
- Modify: `package.json`
- Create: `.env.local`
- Modify: `vitest.config.ts` (created in Task 4, but `.gitignore` check is here)

- [ ] **Step 1: Install the Firebase SDK**

  In your terminal, from the `countdown/` directory:

  ```bash
  npm install firebase
  ```

  Expected output ends with: `added N packages` (no errors).

- [ ] **Step 2: Create `.env.local` with your Firebase credentials**

  Create `countdown/.env.local` with these contents, filling in the values from your Firebase config copied in Task 1 Step 6:

  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
  NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
  ```

- [ ] **Step 3: Verify `.env.local` is git-ignored**

  Run:
  ```bash
  cat .gitignore | grep env
  ```

  Expected output: `.env*.local` (create-next-app adds this automatically). If missing, add `.env.local` to `.gitignore` manually.

- [ ] **Step 4: Commit the dependency update**

  ```bash
  git add package.json package-lock.json
  git commit -m "feat: install firebase sdk"
  ```

---

## Task 3: Create `lib/firebase.ts`

**Files:**
- Create: `lib/firebase.ts`

- [ ] **Step 1: Create the file**

  Create `countdown/lib/firebase.ts`:

  ```typescript
  import { initializeApp, getApps } from 'firebase/app';
  import { getAuth } from 'firebase/auth';
  import { getFirestore } from 'firebase/firestore';

  const firebaseConfig = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

  export const auth = getAuth(app);
  export const db   = getFirestore(app);
  ```

  The `getApps().length` guard prevents re-initializing the app during Next.js hot reloads.

- [ ] **Step 2: Commit**

  ```bash
  git add lib/firebase.ts
  git commit -m "feat: initialize firebase app"
  ```

---

## Task 4: Install Vitest and Create Config

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

  ```bash
  npm install -D vitest
  ```

- [ ] **Step 2: Add test script to `package.json`**

  Open `countdown/package.json`. The `"scripts"` section currently looks like:

  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  ```

  Add the `"test"` line:

  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  ```

- [ ] **Step 3: Create `vitest.config.ts`**

  Create `countdown/vitest.config.ts`:

  ```typescript
  import { defineConfig } from 'vitest/config';
  import { resolve } from 'path';

  export default defineConfig({
    test: {
      environment: 'node',
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, '.'),
      },
    },
  });
  ```

- [ ] **Step 4: Verify Vitest runs (no tests yet)**

  ```bash
  npm test
  ```

  Expected output: `No test files found` or similar. No errors.

- [ ] **Step 5: Commit**

  ```bash
  git add vitest.config.ts package.json package-lock.json
  git commit -m "chore: add vitest"
  ```

---

## Task 5: Create `lib/firestore.ts` (TDD)

**Files:**
- Create: `tests/lib/firestore.test.ts`
- Create: `lib/firestore.ts`

- [ ] **Step 1: Write the failing tests**

  Create `countdown/tests/lib/firestore.test.ts`:

  ```typescript
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
  ```

- [ ] **Step 2: Run tests — verify they fail**

  ```bash
  npm test
  ```

  Expected: tests fail with `Cannot find module '@/lib/firestore'` (the module doesn't exist yet).

- [ ] **Step 3: Create `lib/firestore.ts`**

  Create `countdown/lib/firestore.ts`:

  ```typescript
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
  ```

- [ ] **Step 4: Run tests — verify they pass**

  ```bash
  npm test
  ```

  Expected output: all 9 tests pass, no failures.

- [ ] **Step 5: Commit**

  ```bash
  git add lib/firestore.ts tests/lib/firestore.test.ts
  git commit -m "feat: add firestore helpers with tests"
  ```

---

## Task 6: Update `lib/types.ts`

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Change `id` from `number` to `string`**

  Open `countdown/lib/types.ts`. The full file is currently:

  ```typescript
  export type EventType = 'music' | 'sports' | 'conference' | 'nature' | 'celebration' | 'other';

  export interface Event {
    id: number;
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
  ```

  Replace it entirely with:

  ```typescript
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
  ```

- [ ] **Step 2: Run tests to confirm nothing breaks**

  ```bash
  npm test
  ```

  Expected: all 9 tests still pass.

- [ ] **Step 3: Commit**

  ```bash
  git add lib/types.ts
  git commit -m "feat: change Event.id to string for firestore compatibility"
  ```

---

## Task 7: Update `components/EventCard.tsx`

**Files:**
- Modify: `components/EventCard.tsx` (lines 25–26)

- [ ] **Step 1: Update the Props interface**

  Open `countdown/components/EventCard.tsx`. Find the `Props` interface (lines 22–27):

  ```typescript
  interface Props {
    event: Event;
    isEditor: boolean;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
  }
  ```

  Change it to:

  ```typescript
  interface Props {
    event: Event;
    isEditor: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  }
  ```

  No other changes needed in this file — `ev.id` is passed directly and TypeScript will now infer it as `string`.

- [ ] **Step 2: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no output (zero errors).

- [ ] **Step 3: Commit**

  ```bash
  git add components/EventCard.tsx
  git commit -m "feat: update EventCard prop types for string ids"
  ```

---

## Task 8: Update `components/ClientApp.tsx`

**Files:**
- Modify: `components/ClientApp.tsx`

This is the largest change. Replace the entire file with the version below, which:
- Adds two `useEffect` hooks for Firebase Auth and Firestore listeners
- Replaces `doLogin` / `logout` with Firebase Auth calls
- Changes `editId` type to `string | null`
- Changes `openEdit`, `saveEvent`, `delEvent` signatures to use `string` ids and `async`
- Removes the hardcoded `initialEvents` import
- Changes Login modal "Username" label to "Email"
- Removes the hardcoded demo hint

- [ ] **Step 1: Replace `components/ClientApp.tsx`**

  ```tsx
  'use client';

  import { useState, useRef, useCallback, useEffect } from 'react';
  import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
  import { auth } from '@/lib/firebase';
  import { subscribeEvents, addEvent, updateEvent, deleteEvent } from '@/lib/firestore';
  import type { Event, EventType } from '@/lib/types';
  import EventCard from './EventCard';

  const EMOJIS: Record<EventType, string> = {
    music: '🎵', sports: '⚽', conference: '💻', nature: '🌿', celebration: '🎆', other: '📅',
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  export default function ClientApp() {
    // ── Auth ──────────────────────────────────────────────
    const [isEditor, setIsEditor] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginUser, setLoginUser] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [loginErr, setLoginErr] = useState(false);

    // ── Events ────────────────────────────────────────────
    const [events, setEvents] = useState<Event[]>([]);
    const [sort, setSort] = useState('closest');
    const [filter, setFilter] = useState('all');

    // ── Event modal ───────────────────────────────────────
    const [showEventModal, setShowEventModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [evtName, setEvtName] = useState('');
    const [evtType, setEvtType] = useState<EventType>('music');
    const [evtTarget, setEvtTarget] = useState('');
    const [evtVenue, setEvtVenue] = useState('');
    const [evtFullBg, setEvtFullBg] = useState(false);
    const [evtFs, setEvtFs] = useState(16);
    const [evtFf, setEvtFf] = useState("'Fira Code',monospace");
    const [evtImg, setEvtImg] = useState<string | null>(null);
    const [evtImgLabel, setEvtImgLabel] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Firebase listeners ────────────────────────────────
    useEffect(() => {
      const unsub = onAuthStateChanged(auth, user => setIsEditor(!!user));
      return unsub;
    }, []);

    useEffect(() => {
      const unsub = subscribeEvents(setEvents);
      return unsub;
    }, []);

    // ── Auth handlers ─────────────────────────────────────
    const doLogin = useCallback(async () => {
      try {
        await signInWithEmailAndPassword(auth, loginUser, loginPass);
        setShowLoginModal(false);
        setLoginErr(false);
        setLoginUser('');
        setLoginPass('');
      } catch {
        setLoginErr(true);
      }
    }, [loginUser, loginPass]);

    const logout = useCallback(async () => {
      await signOut(auth);
    }, []);

    // ── Modal open helpers ────────────────────────────────
    const openAdd = useCallback(() => {
      setEditId(null);
      setEvtName(''); setEvtType('music'); setEvtTarget(''); setEvtVenue('');
      setEvtFullBg(false); setEvtFs(16); setEvtFf("'Fira Code',monospace");
      setEvtImg(null); setEvtImgLabel('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowEventModal(true);
    }, []);

    const openEdit = useCallback((id: string) => {
      const ev = events.find(e => e.id === id);
      if (!ev) return;
      const d = ev.target;
      setEditId(id);
      setEvtName(ev.name);
      setEvtType(ev.type);
      setEvtTarget(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      setEvtVenue(ev.venue);
      setEvtFullBg(ev.fullBg);
      setEvtFs(ev.fs);
      setEvtFf(ev.ff);
      setEvtImg(ev.image);
      setEvtImgLabel(ev.image ? '✓ Image loaded' : '');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowEventModal(true);
    }, [events]);

    const saveEvent = useCallback(async () => {
      if (!evtName.trim() || !evtTarget) { alert('Event name and target date are required.'); return; }
      const data = {
        name: evtName.trim(), type: evtType, target: new Date(evtTarget),
        image: evtImg, fs: evtFs, ff: evtFf, venue: evtVenue.trim(),
        fullBg: evtFullBg, emoji: EMOJIS[evtType],
      };
      if (editId !== null) {
        await updateEvent(editId, data);
      } else {
        await addEvent(data);
      }
      setShowEventModal(false);
    }, [evtName, evtType, evtTarget, evtImg, evtFs, evtFf, evtVenue, evtFullBg, editId]);

    const delEvent = useCallback(async (id: string) => {
      if (confirm('Delete this event?')) await deleteEvent(id);
    }, []);

    const handleImg = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        setEvtImg(ev.target?.result as string);
        setEvtImgLabel(`✓ ${file.name}`);
      };
      reader.readAsDataURL(file);
    }, []);

    // ── Sort & filter ─────────────────────────────────────
    const displayed = [...events]
      .filter(e => filter === 'all' || e.type === filter)
      .sort((a, b) => {
        if (sort === 'closest')  return a.target.getTime() - b.target.getTime();
        if (sort === 'farthest') return b.target.getTime() - a.target.getTime();
        if (sort === 'name')     return a.name.localeCompare(b.name);
        if (sort === 'type')     return a.type.localeCompare(b.type);
        return 0;
      });

    return (
      <>
        {/* ══ HEADER ══ */}
        <header>
          <div className="logo">
            <div className="logo-ring" />
            COUNTDOWN
          </div>
          <div className="header-right">
            <span className={`editor-badge${isEditor ? ' on' : ''}`}>Editor Mode</span>
            {isEditor
              ? <button className="btn btn-danger" onClick={logout}>Logout</button>
              : <button className="btn btn-primary" onClick={() => setShowLoginModal(true)}>Login</button>
            }
          </div>
        </header>

        {/* ══ MAIN ══ */}
        <main>
          <div className="page-header">
            <h1 className="page-title">Events</h1>
            <div className="controls-bar">
              <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value="closest">↑ Closest First</option>
                <option value="farthest">↓ Farthest First</option>
                <option value="name">A → Z Name</option>
                <option value="type">By Type</option>
              </select>
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="music">Music</option>
                <option value="sports">Sports</option>
                <option value="conference">Conference</option>
                <option value="nature">Nature</option>
                <option value="celebration">Celebration</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="events-grid">
            {events.length === 0
              ? <div className="no-results" style={{ display: 'block' }}>// No events yet</div>
              : displayed.length === 0
                ? <div className="no-results" style={{ display: 'block' }}>// No events match this filter</div>
                : displayed.map(ev => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      isEditor={isEditor}
                      onEdit={openEdit}
                      onDelete={delEvent}
                    />
                  ))
            }
          </div>
        </main>

        {/* ══ FAB ══ */}
        {isEditor && (
          <button className="fab show" onClick={openAdd} title="Add new event">+</button>
        )}

        {/* ══ LOGIN MODAL ══ */}
        {showLoginModal && (
          <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) setShowLoginModal(false); }}>
            <div className="modal">
              <button className="x-btn" onClick={() => setShowLoginModal(false)}>✕</button>
              <div className="modal-title">Editor Login</div>

              <div className="field">
                <label className="lbl">Email</label>
                <input className="inp" type="email" value={loginUser}
                  onChange={e => setLoginUser(e.target.value)} placeholder="editor@example.com" />
              </div>
              <div className="field">
                <label className="lbl">Password</label>
                <input className="inp" type="password" value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doLogin()}
                  placeholder="••••••••" />
              </div>

              {loginErr && (
                <p className="err-msg" style={{ display: 'block' }}>Invalid credentials</p>
              )}

              <button className="btn btn-primary" style={{ width: '100%' }} onClick={doLogin}>
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* ══ EVENT MODAL (ADD / EDIT) ══ */}
        {showEventModal && (
          <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) setShowEventModal(false); }}>
            <div className="modal wide">
              <button className="x-btn" onClick={() => setShowEventModal(false)}>✕</button>
              <div className="modal-title">{editId !== null ? 'Edit Event' : 'Add New Event'}</div>

              <div className="field">
                <label className="lbl">Event Name</label>
                <input className="inp" type="text" value={evtName}
                  onChange={e => setEvtName(e.target.value)}
                  placeholder="e.g. Summer Music Festival" />
              </div>

              <div className="two-col">
                <div className="field">
                  <label className="lbl">Event Type</label>
                  <select className="inp" value={evtType} onChange={e => setEvtType(e.target.value as EventType)}>
                    <option value="music">Music</option>
                    <option value="sports">Sports</option>
                    <option value="conference">Conference</option>
                    <option value="nature">Nature</option>
                    <option value="celebration">Celebration</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="field">
                  <label className="lbl">Start Date (Display)</label>
                  <input className="inp" type="date" />
                </div>
              </div>

              <div className="field">
                <label className="lbl">Countdown Target — Date &amp; Time</label>
                <input className="inp" type="datetime-local" value={evtTarget}
                  onChange={e => setEvtTarget(e.target.value)} />
              </div>

              <div className="field">
                <label className="lbl">Venue</label>
                <input className="inp" type="text" value={evtVenue}
                  onChange={e => setEvtVenue(e.target.value)}
                  placeholder="e.g. Madison Square Garden, New York" />
              </div>

              <div className="field">
                <label className="lbl">Background Image</label>
                <div className="upload-box" onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" accept="image/*"
                    onChange={handleImg} style={{ display: 'none' }} />
                  {evtImgLabel
                    ? <span>{evtImgLabel}</span>
                    : <span>↑ Click to upload<br /><span style={{ fontSize: '0.6rem', opacity: 0.55 }}>PNG · JPG · WEBP</span></span>
                  }
                </div>
                <label className="check-row" style={{ marginTop: '0.5rem' }}>
                  <input type="checkbox" checked={evtFullBg} onChange={e => setEvtFullBg(e.target.checked)} />
                  <span className="lbl">Full Background (blurred behind content)</span>
                </label>
              </div>

              <div className="two-col">
                <div className="field">
                  <label className="lbl">Font Size</label>
                  <div className="range-row">
                    <input type="range" min="12" max="32" value={evtFs}
                      onChange={e => setEvtFs(Number(e.target.value))} />
                    <span className="range-val">{evtFs}px</span>
                  </div>
                </div>
                <div className="field">
                  <label className="lbl">Font Style</label>
                  <select className="inp" value={evtFf} onChange={e => setEvtFf(e.target.value)}>
                    <option value="'Fira Code',monospace">Fira Code (Mono)</option>
                    <option value="'Syne',sans-serif">Syne (Display)</option>
                    <option value="Georgia,serif">Georgia (Serif)</option>
                    <option value="'Courier New',monospace">Courier New</option>
                    <option value="Impact,sans-serif">Impact (Bold)</option>
                  </select>
                </div>
              </div>

              <div className="modal-row">
                <button className="btn" style={{ flex: 1 }} onClick={() => setShowEventModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={saveEvent}>Save Event</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  ```

- [ ] **Step 2: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no output (zero errors).

- [ ] **Step 3: Run tests to confirm they still pass**

  ```bash
  npm test
  ```

  Expected: all 9 tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add components/ClientApp.tsx
  git commit -m "feat: wire firebase auth and firestore into client app"
  ```

---

## Task 9: Manual Verification

- [ ] **Step 1: Start the dev server**

  ```bash
  npm run dev
  ```

  Open http://localhost:3000.

- [ ] **Step 2: Verify the empty state**

  The page should load with `// No events yet` — confirming the Firestore connection is working (no events in the database yet).

- [ ] **Step 3: Verify login**

  Click **Login** → enter the email and password you created in Task 1 Step 5 → click **Sign In**. The header should show **Editor Mode** and the orange **+** FAB should appear.

- [ ] **Step 4: Add an event and verify persistence**

  Click **+** → fill in event name and a future target date → **Save Event**. The event card should appear immediately. Refresh the page (`F5`) — the event should still be there (loaded from Firestore).

- [ ] **Step 5: Verify edit and delete**

  Click the pencil icon (✎) on the event → change the name → **Save Event**. The card should update. Click the ✕ icon → confirm → the card should disappear and stay gone after refresh.

- [ ] **Step 6: Verify public read**

  Open the site in a private/incognito browser window (no login). The event should be visible. The editor buttons (✎ ✕) and FAB should not appear.

- [ ] **Step 7: Commit**

  ```bash
  git add -A
  git commit -m "feat: complete firebase persistence and auth integration"
  ```
