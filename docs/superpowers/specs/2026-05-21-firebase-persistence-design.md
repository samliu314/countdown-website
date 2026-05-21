# Firebase Persistence & Auth — Design Spec
**Date:** 2026-05-21  
**Status:** Approved  
**Scope:** Replace in-memory event state and mock auth with Firebase Firestore + Firebase Authentication (email/password)

---

## Problem

Events are stored in `useState(initialEvents)` inside `ClientApp.tsx`. They reset on every page refresh. The login is a hardcoded client-side check (`user === 'editor' && pass === '1234'`), which exposes credentials in source code and cannot be used to enforce Firestore security rules.

---

## Goal

- Events persist in Firestore and are visible to all visitors in real time
- Only authenticated editors (Firebase Auth) can add, edit, or delete events
- The existing UI, layout, and styling remain completely unchanged
- The solution works with GitHub Pages (fully static, client-side only)

---

## Architecture

Approach A — Firebase Client SDK in the browser. No server-side code.

```
Browser
  ├── Firebase Auth  (signInWithEmailAndPassword / signOut / onAuthStateChanged)
  └── Firestore      (onSnapshot listener + addDoc / updateDoc / deleteDoc)
```

### New files
| File | Purpose |
|---|---|
| `lib/firebase.ts` | Initializes Firebase app; exports `auth` and `db` |
| `lib/firestore.ts` | Thin helpers: `subscribeEvents`, `addEvent`, `updateEvent`, `deleteEvent` |
| `.env.local` | Firebase project credentials (never committed to git) |

### Modified files
| File | Change |
|---|---|
| `components/ClientApp.tsx` | Replace mock auth with Firebase Auth; replace `useState(initialEvents)` with Firestore `onSnapshot` |

### Minor updates (type-only changes)
| File | Change |
|---|---|
| `lib/types.ts` | `id: number` → `id: string` (Firestore document IDs are strings, not numbers) |
| `components/EventCard.tsx` | `onEdit: (id: number)` and `onDelete: (id: number)` → `(id: string)` to match |

### Unchanged files
`initialEvents.ts` (kept but no longer imported at runtime), `globals.css`, `layout.tsx`, `page.tsx`

---

## Firestore Data Model

**Collection:** `events` (flat, one document per event, Firestore auto-generated ID)

```
events/{autoId}
  name:    string
  type:    string           // 'music' | 'sports' | 'conference' | 'nature' | 'celebration' | 'other'
  target:  Timestamp        // Firestore Timestamp, converts to/from JS Date
  image:   string | null    // base64 data URI
  fs:      number           // font size in px
  ff:      string           // font family CSS string
  emoji:   string
  venue:   string
  fullBg:  boolean
```

The `id` field is not stored in the document — it is the Firestore document ID itself, used for updates and deletes.

---

## Security Rules

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

- Any visitor can read all events (public gallery)
- Only users authenticated via Firebase Auth can write (add, edit, delete)
- The editor account is created once in the Firebase Console — no in-app registration

---

## Authentication Flow

1. Editor clicks **Login** → modal opens (same UI, "Username" label changes to "Email")
2. `signInWithEmailAndPassword(auth, email, password)` validates credentials with Firebase
3. `onAuthStateChanged` listener detects the session → sets `isEditor = true` in React state
4. Session persists across page refreshes (Firebase stores session in `localStorage` internally)
5. Editor clicks **Logout** → `signOut(auth)` is called → `onAuthStateChanged` fires with `null` → `isEditor = false`
6. The editor's Firebase Auth account is created once in the Firebase Console — credentials are never hardcoded in source

---

## Real-time Events Flow

- On component mount: `subscribeEvents(setEvents)` calls Firestore `onSnapshot` — events load and update live
- `useEffect` cleanup unsubscribes the listener on unmount (no memory leaks)
- Add: `addDoc(collection(db, 'events'), data)` — listener auto-updates the UI
- Edit: `updateDoc(doc(db, 'events', id), data)` — listener auto-updates the UI
- Delete: `deleteDoc(doc(db, 'events', id))` — listener auto-updates the UI
- No manual `setEvents` calls needed after CRUD operations — `onSnapshot` handles all updates

---

## Environment Variables

Stored in `.env.local` for local development. Never committed to git (add to `.gitignore`).

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

For GitHub Pages deployment: add these as **Repository Secrets** in GitHub → Settings → Secrets and variables → Actions. A GitHub Actions workflow injects them at build time via `NEXT_PUBLIC_*` env vars.

---

## Initial Data

The 6 hardcoded sample events in `initialEvents.ts` are not seeded to Firestore automatically. The editor adds real events through the UI after setup. `initialEvents.ts` is kept in the codebase but no longer imported in `ClientApp.tsx`.

---

## Out of Scope

- User registration flow (editor account created manually in Firebase Console only)
- Multiple editor accounts / roles
- Offline support / optimistic UI
- Image hosting via Firebase Storage (base64 in Firestore is retained as-is)
- GitHub Actions deployment pipeline (documented as manual steps only)
