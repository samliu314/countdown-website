# UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix mobile card layout, add button press feedback with loading states, and replace the unused "Start Date" field with a searchable timezone picker that stores timezone per-event and counts down to the correct UTC moment.

**Architecture:** Pure CSS for mobile and press feedback (no React changes in Tasks 1–2). New `lib/timezone.ts` pure utility with TDD. `Event` type gains a `timezone: string` field. `ClientApp.tsx` and `EventCard.tsx` updated to use it. No new dependencies — uses browser-native `Intl` API.

**Tech Stack:** Next.js 16 / React 19 / TypeScript 5, Vitest, CSS media queries, `Intl.DateTimeFormat`

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `app/globals.css` | Add `@media (max-width: 640px)` block; `.btn:active`; `.tz-picker`/`.tz-options`/`.tz-option` styles |
| Modify | `lib/types.ts` | Add `timezone: string` to `Event` |
| Modify | `lib/initialEvents.ts` | Add `timezone: 'UTC'` to all 6 sample events |
| Create | `lib/timezone.ts` | `tzLocalToUTC` and `utcToTzLocal` pure helpers |
| Create | `tests/lib/timezone.test.ts` | Vitest tests for timezone helpers |
| Modify | `components/EventCard.tsx` | Pass `timeZone: ev.timezone` to `toLocaleDateString` |
| Modify | `components/ClientApp.tsx` | Add `TIMEZONES`, loading states, timezone picker state + JSX |

---

## Task 1: Mobile Responsive CSS

**Files:**
- Modify: `app/globals.css` (append at end of file)

- [ ] **Step 1: Append the media query block to `app/globals.css`**

  Add at the very end of `countdown/app/globals.css`:

  ```css
  /* ── Mobile ── */
  @media (max-width: 640px) {
    header { padding: 0.9rem 1.2rem; }
    main { padding: 1.5rem 1rem 5rem; }

    .event-card { flex-direction: column; min-height: unset; }
    .event-card:hover { transform: none; }

    .card-hero { width: 100%; height: 160px; }

    .card-body { padding: 0.9rem 1rem; }

    .cd-num { font-size: 1.3rem; }

    .card-name { white-space: normal; }

    .two-col { grid-template-columns: 1fr; }

    .modal { padding: 1.2rem; }
  }
  ```

- [ ] **Step 2: Verify visually**

  Open http://localhost:3000 in Chrome DevTools → toggle device toolbar → select iPhone SE (375px wide). Event cards should stack vertically with the hero image on top, countdown digits fitting without overlap.

- [ ] **Step 3: Commit**

  ```bash
  git add app/globals.css
  git commit -m "feat: add mobile responsive layout"
  ```

---

## Task 2: Button Press Feedback + Timezone Picker CSS

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add `:active` state and transition to `.btn`**

  In `countdown/app/globals.css`, find the line (line 98):
  ```css
  transition: border-color 0.2s, color 0.2s;
  ```
  Replace it with:
  ```css
  transition: border-color 0.2s, color 0.2s, transform 0.1s, filter 0.1s;
  ```

  Then find the line (line 117):
  ```css
  .btn-danger:hover { border-color: #ff4444; color: #ff4444; }
  ```
  Add immediately after it:
  ```css
  .btn:active { transform: scale(0.96); filter: brightness(0.88); }
  ```

- [ ] **Step 2: Add timezone picker styles**

  Append after the `.btn:active` line:
  ```css

  /* ── Timezone picker ── */
  .tz-picker { position: relative; }
  .tz-options {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #030c1e;
    border: 1px solid var(--border);
    border-top: none;
    border-radius: 0 0 2px 2px;
    max-height: 180px;
    overflow-y: auto;
    z-index: 10;
  }
  .tz-option {
    padding: 0.45rem 0.75rem;
    font-size: 0.78rem;
    font-family: 'Fira Code', monospace;
    color: var(--text);
    cursor: pointer;
    transition: background 0.15s;
  }
  .tz-option:hover, .tz-option.active {
    background: rgba(0,200,255,.1);
    color: var(--accent);
  }
  ```

- [ ] **Step 3: Verify press feedback**

  Open http://localhost:3000 → click and hold the Login button. It should visibly scale down while pressed. Release — it snaps back.

- [ ] **Step 4: Commit**

  ```bash
  git add app/globals.css
  git commit -m "feat: add button press feedback and timezone picker styles"
  ```

---

## Task 3: Update `Event` Type and `initialEvents`

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/initialEvents.ts`

- [ ] **Step 1: Add `timezone` field to `lib/types.ts`**

  Replace the entire contents of `countdown/lib/types.ts` with:

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
    timezone: string;
  }
  ```

- [ ] **Step 2: Add `timezone: 'UTC'` to all 6 sample events in `lib/initialEvents.ts`**

  Replace the entire contents of `countdown/lib/initialEvents.ts` with:

  ```typescript
  import type { Event } from './types';

  export const initialEvents: Event[] = [
    { id: '1', name: 'Summer Music Festival', type: 'music',       target: new Date('2026-06-15T20:00:00'), image: null, fs: 18, ff: "'Syne',sans-serif",    emoji: '🎵', venue: 'Central Park, New York',        fullBg: false, timezone: 'UTC' },
    { id: '2', name: 'World Cup Final',        type: 'sports',      target: new Date('2026-07-19T15:00:00'), image: null, fs: 16, ff: "'Fira Code',monospace", emoji: '⚽', venue: 'MetLife Stadium, NJ',            fullBg: false, timezone: 'UTC' },
    { id: '3', name: 'Tech Summit 2026',       type: 'conference',  target: new Date('2026-09-01T09:00:00'), image: null, fs: 16, ff: "'Fira Code',monospace", emoji: '💻', venue: 'Moscone Center, San Francisco',  fullBg: false, timezone: 'UTC' },
    { id: '4', name: 'New Year 2027',          type: 'celebration', target: new Date('2027-01-01T00:00:00'), image: null, fs: 22, ff: "'Syne',sans-serif",    emoji: '🎆', venue: 'Times Square, New York',          fullBg: false, timezone: 'UTC' },
    { id: '5', name: 'Solar Eclipse',          type: 'nature',      target: new Date('2026-08-12T18:30:00'), image: null, fs: 16, ff: "'Fira Code',monospace", emoji: '🌑', venue: '',                               fullBg: false, timezone: 'UTC' },
    { id: '6', name: 'City Marathon',          type: 'sports',      target: new Date('2026-06-28T07:00:00'), image: null, fs: 16, ff: "'Fira Code',monospace", emoji: '🏃', venue: 'City Hall, Chicago',              fullBg: false, timezone: 'UTC' },
  ];
  ```

- [ ] **Step 3: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: errors only in `components/ClientApp.tsx` and `components/EventCard.tsx` (they reference `Event` but haven't been updated yet). No errors in `lib/types.ts` or `lib/initialEvents.ts`.

- [ ] **Step 4: Commit**

  ```bash
  git add lib/types.ts lib/initialEvents.ts
  git commit -m "feat: add timezone field to Event type"
  ```

---

## Task 4: Create `lib/timezone.ts` (TDD)

**Files:**
- Create: `tests/lib/timezone.test.ts`
- Create: `lib/timezone.ts`

- [ ] **Step 1: Write the failing tests**

  Create `countdown/tests/lib/timezone.test.ts`:

  ```typescript
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
  ```

- [ ] **Step 2: Run tests — verify they fail**

  ```bash
  npm test
  ```

  Expected: fails with `Cannot find module '@/lib/timezone'`.

- [ ] **Step 3: Create `lib/timezone.ts`**

  Create `countdown/lib/timezone.ts`:

  ```typescript
  export function tzLocalToUTC(localDatetime: string, tz: string): Date {
    const naive = new Date(localDatetime + 'Z');
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).formatToParts(naive);
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0';
    const h = Number(get('hour')) % 24;
    const tzAsUTC = new Date(
      `${get('year')}-${get('month')}-${get('day')}T${String(h).padStart(2, '0')}:${get('minute')}:${get('second')}Z`
    );
    return new Date(naive.getTime() + (naive.getTime() - tzAsUTC.getTime()));
  }

  export function utcToTzLocal(date: Date, tz: string): string {
    return date.toLocaleString('sv', { timeZone: tz }).replace(' ', 'T').slice(0, 16);
  }
  ```

- [ ] **Step 4: Run tests — verify all pass**

  ```bash
  npm test
  ```

  Expected: all tests pass (8 from `firestore.test.ts` + 6 from `timezone.test.ts` = 14 total).

- [ ] **Step 5: Commit**

  ```bash
  git add lib/timezone.ts tests/lib/timezone.test.ts
  git commit -m "feat: add timezone conversion helpers with tests"
  ```

---

## Task 5: Update `components/EventCard.tsx`

**Files:**
- Modify: `components/EventCard.tsx` (line 38–41)

- [ ] **Step 1: Pass `timeZone` option to the date formatter**

  In `countdown/components/EventCard.tsx`, find the `dateStr` assignment (lines 38–41):

  ```typescript
  const dateStr = ev.target.toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
  });
  ```

  Replace it with:

  ```typescript
  const dateStr = ev.target.toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: ev.timezone ?? 'UTC',
  });
  ```

- [ ] **Step 2: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: only `components/ClientApp.tsx` still has errors (will be fixed in Task 6). No errors in `EventCard.tsx`.

- [ ] **Step 3: Run tests**

  ```bash
  npm test
  ```

  Expected: all 14 tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add components/EventCard.tsx
  git commit -m "feat: display event date in event timezone"
  ```

---

## Task 6: Update `components/ClientApp.tsx`

**Files:**
- Modify: `components/ClientApp.tsx`

Replace the entire file with the version below. Key changes from the current version:
- Import `tzLocalToUTC`, `utcToTzLocal` from `@/lib/timezone`
- Add `TIMEZONES` constant (35 city → IANA pairs)
- Add `isLoggingIn`, `isSaving` loading states
- Add `evtTz`, `tzSearch`, `tzOpen` timezone picker states
- `doLogin` wrapped in `isLoggingIn` try/finally
- `saveEvent` wrapped in `isSaving` try/finally; uses `tzLocalToUTC`; includes `timezone: evtTz`
- `openAdd` resets `evtTz`/`tzSearch` to `'UTC'`
- `openEdit` uses `utcToTzLocal` to show target time in event's timezone; restores `evtTz`/`tzSearch`
- Login modal: Sign In button shows "Signing in…" and disables while `isLoggingIn`
- Event modal: replaces "Start Date" field with searchable timezone picker; Save button shows "Saving…" and disables while `isSaving`

- [ ] **Step 1: Replace `components/ClientApp.tsx`**

  ```tsx
  'use client';

  import { useState, useRef, useCallback, useEffect } from 'react';
  import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
  import { auth } from '@/lib/firebase';
  import { subscribeEvents, addEvent, updateEvent, deleteEvent } from '@/lib/firestore';
  import { tzLocalToUTC, utcToTzLocal } from '@/lib/timezone';
  import type { Event, EventType } from '@/lib/types';
  import EventCard from './EventCard';

  const EMOJIS: Record<EventType, string> = {
    music: '🎵', sports: '⚽', conference: '💻', nature: '🌿', celebration: '🎆', other: '📅',
  };

  const TIMEZONES: { label: string; value: string }[] = [
    { label: 'UTC',                  value: 'UTC' },
    { label: 'Honolulu, Hawaii',     value: 'Pacific/Honolulu' },
    { label: 'Anchorage, Alaska',    value: 'America/Anchorage' },
    { label: 'Los Angeles',          value: 'America/Los_Angeles' },
    { label: 'Denver',               value: 'America/Denver' },
    { label: 'Chicago',              value: 'America/Chicago' },
    { label: 'Mexico City',          value: 'America/Mexico_City' },
    { label: 'New York',             value: 'America/New_York' },
    { label: 'Toronto',              value: 'America/Toronto' },
    { label: 'Miami',                value: 'America/New_York' },
    { label: 'São Paulo',            value: 'America/Sao_Paulo' },
    { label: 'Buenos Aires',         value: 'America/Argentina/Buenos_Aires' },
    { label: 'London',               value: 'Europe/London' },
    { label: 'Lisbon',               value: 'Europe/Lisbon' },
    { label: 'Paris',                value: 'Europe/Paris' },
    { label: 'Madrid',               value: 'Europe/Madrid' },
    { label: 'Rome',                 value: 'Europe/Rome' },
    { label: 'Berlin',               value: 'Europe/Berlin' },
    { label: 'Amsterdam',            value: 'Europe/Amsterdam' },
    { label: 'Stockholm',            value: 'Europe/Stockholm' },
    { label: 'Helsinki',             value: 'Europe/Helsinki' },
    { label: 'Moscow',               value: 'Europe/Moscow' },
    { label: 'Istanbul',             value: 'Europe/Istanbul' },
    { label: 'Dubai',                value: 'Asia/Dubai' },
    { label: 'Riyadh',               value: 'Asia/Riyadh' },
    { label: 'Karachi',              value: 'Asia/Karachi' },
    { label: 'Mumbai',               value: 'Asia/Kolkata' },
    { label: 'Bangkok',              value: 'Asia/Bangkok' },
    { label: 'Singapore',            value: 'Asia/Singapore' },
    { label: 'Hong Kong',            value: 'Asia/Hong_Kong' },
    { label: 'Beijing / Shanghai',   value: 'Asia/Shanghai' },
    { label: 'Seoul',                value: 'Asia/Seoul' },
    { label: 'Tokyo, Japan',         value: 'Asia/Tokyo' },
    { label: 'Sydney',               value: 'Australia/Sydney' },
    { label: 'Auckland',             value: 'Pacific/Auckland' },
  ];

  export default function ClientApp() {
    // ── Auth ──────────────────────────────────────────────
    const [isEditor, setIsEditor] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginUser, setLoginUser] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [loginErr, setLoginErr] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

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
    const [evtTz, setEvtTz] = useState('UTC');
    const [tzSearch, setTzSearch] = useState('UTC');
    const [tzOpen, setTzOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
      setIsLoggingIn(true);
      try {
        await signInWithEmailAndPassword(auth, loginUser, loginPass);
        setShowLoginModal(false);
        setLoginErr(false);
        setLoginUser('');
        setLoginPass('');
      } catch {
        setLoginErr(true);
      } finally {
        setIsLoggingIn(false);
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
      setEvtTz('UTC'); setTzSearch('UTC'); setTzOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowEventModal(true);
    }, []);

    const openEdit = useCallback((id: string) => {
      const ev = events.find(e => e.id === id);
      if (!ev) return;
      const tz = ev.timezone ?? 'UTC';
      setEditId(id);
      setEvtName(ev.name);
      setEvtType(ev.type);
      setEvtTarget(utcToTzLocal(ev.target, tz));
      setEvtVenue(ev.venue);
      setEvtFullBg(ev.fullBg);
      setEvtFs(ev.fs);
      setEvtFf(ev.ff);
      setEvtImg(ev.image);
      setEvtImgLabel(ev.image ? '✓ Image loaded' : '');
      setEvtTz(tz);
      setTzSearch(TIMEZONES.find(t => t.value === tz)?.label ?? tz);
      setTzOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowEventModal(true);
    }, [events]);

    const saveEvent = useCallback(async () => {
      if (!evtName.trim() || !evtTarget) { alert('Event name and target date are required.'); return; }
      setIsSaving(true);
      try {
        const data = {
          name: evtName.trim(), type: evtType, target: tzLocalToUTC(evtTarget, evtTz),
          image: evtImg, fs: evtFs, ff: evtFf, venue: evtVenue.trim(),
          fullBg: evtFullBg, emoji: EMOJIS[evtType], timezone: evtTz,
        };
        if (editId !== null) {
          await updateEvent(editId, data);
        } else {
          await addEvent(data);
        }
        setShowEventModal(false);
      } finally {
        setIsSaving(false);
      }
    }, [evtName, evtType, evtTarget, evtImg, evtFs, evtFf, evtVenue, evtFullBg, editId, evtTz]);

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

    const filteredTz = TIMEZONES.filter(t =>
      t.label.toLowerCase().includes(tzSearch.toLowerCase())
    );

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

              <button
                className="btn btn-primary"
                style={{ width: '100%', opacity: isLoggingIn ? 0.6 : 1 }}
                onClick={doLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Signing in…' : 'Sign In'}
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
                  <label className="lbl">Timezone</label>
                  <div className="tz-picker">
                    <input
                      className="inp"
                      type="text"
                      value={tzSearch}
                      placeholder="Search city…"
                      onChange={e => { setTzSearch(e.target.value); setTzOpen(true); }}
                      onFocus={() => { setTzSearch(''); setTzOpen(true); }}
                      onBlur={() => setTimeout(() => {
                        setTzOpen(false);
                        if (!TIMEZONES.find(t => t.label === tzSearch)) {
                          setTzSearch(TIMEZONES.find(t => t.value === evtTz)?.label ?? evtTz);
                        }
                      }, 150)}
                    />
                    {tzOpen && filteredTz.length > 0 && (
                      <div className="tz-options">
                        {filteredTz.map(t => (
                          <div
                            key={t.value + t.label}
                            className={`tz-option${evtTz === t.value ? ' active' : ''}`}
                            onMouseDown={() => {
                              setEvtTz(t.value);
                              setTzSearch(t.label);
                              setTzOpen(false);
                            }}
                          >
                            {t.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                <button
                  className="btn btn-primary"
                  style={{ flex: 2, opacity: isSaving ? 0.6 : 1 }}
                  onClick={saveEvent}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : 'Save Event'}
                </button>
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

- [ ] **Step 3: Run tests**

  ```bash
  npm test
  ```

  Expected: all 14 tests pass.

- [ ] **Step 4: Commit**

  ```bash
  git add components/ClientApp.tsx
  git commit -m "feat: add loading states and timezone picker to client app"
  ```

---

## Task 7: Manual Verification

- [ ] **Step 1: Open http://localhost:3000 on a narrow window (or phone)**

  Resize browser to ~375px wide. Event cards should stack vertically with the hero image on top, countdown digits readable.

- [ ] **Step 2: Verify button press feedback**

  Click and hold the Login button — it should scale down slightly. Release — it snaps back.

- [ ] **Step 3: Verify timezone picker**

  Log in → click **+** → in the event modal, the "Start Date" field is now a "Timezone" search input. Type "tok" → "Tokyo, Japan" appears → click it → field shows "Tokyo, Japan".

- [ ] **Step 4: Verify loading states**

  Add an event and click **Save Event** — the button briefly shows "Saving…" while Firebase writes. Login modal shows "Signing in…" while authenticating.

- [ ] **Step 5: Verify timezone correctness**

  Add an event with timezone "Tokyo, Japan" and target time "2026-12-31T20:00". Refresh the page. The countdown should be counting down to 8pm Tokyo time (which is 11am UTC). Verify by checking that the displayed date on the card says "Thu, December 31, 2026".

- [ ] **Step 6: Push to GitHub and Vercel**

  ```bash
  git push origin main
  ```

  Vercel auto-deploys from `main`. Verify the live site at your Vercel URL.
