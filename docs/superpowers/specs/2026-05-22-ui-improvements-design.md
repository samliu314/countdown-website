# UI Improvements — Design Spec
**Date:** 2026-05-22
**Status:** Approved
**Scope:** Three UI improvements — mobile layout fix, button press feedback, timezone-aware events

---

## Problem

1. **Mobile layout:** Event cards use a horizontal layout (hero image left, content right) with no responsive breakpoints. On narrow phone screens the countdown digits overflow and stack unreadably.
2. **Button feedback:** Buttons have no press state and async Firebase operations (login, save) give no visual feedback, leaving users uncertain whether their tap registered.
3. **Timezone:** The "Start Date (Display)" field in the event modal is unused. Events are stored without a timezone, so an event set to "8pm" is treated as 8pm in whatever timezone the editor's browser happens to be in — wrong for international events.

---

## Goal

- Cards readable and usable on mobile (portrait orientation)
- Buttons give immediate tactile press feedback; async operations show a loading state
- Events store a timezone; the countdown counts down to the correct absolute UTC moment regardless of where the viewer is; the date shown on the card reflects the event's local time

---

## Section 1: Mobile Layout Fix

### Approach
Pure CSS media query added to `globals.css`. No React changes.

### Breakpoint: `max-width: 640px`

| Element | Desktop | Mobile |
|---|---|---|
| `.events-grid` | multi-column grid | single column |
| `.event-card` | `flex-direction: row` | `flex-direction: column` |
| `.card-hero` | `width: 200px`, full height | `width: 100%`, `height: 160px` |
| `.cd-num` | `font-size: 1.7rem` | `font-size: 1.3rem` |
| `.card-name` | unchanged | `font-size` capped so long names don't overflow |

---

## Section 2: Button Press Feedback + Loading States

### CSS `:active` state
Added to `.btn` in `globals.css`:
```css
.btn:active { transform: scale(0.96); filter: brightness(0.88); }
```
Transition already exists (`transition: ...`) — add `transform 0.1s` to it.

### Loading states in `ClientApp.tsx`
Two new boolean states:
- `isLoggingIn` — set `true` before `signInWithEmailAndPassword`, `false` in finally block
- `isSaving` — set `true` before `updateEvent`/`addEvent`, `false` in finally block

While loading:
- Button `disabled={true}` and `opacity: 0.6`
- Button text changes: "Sign In" → "Signing in…", "Save Event" → "Saving…"

Modals already close automatically on success — no change needed.

---

## Section 3: Timezone-Aware Events

### Data model change
`lib/types.ts` — add one field:
```typescript
timezone: string;  // IANA timezone, e.g. "Asia/Tokyo"
```

`lib/initialEvents.ts` — add `timezone: 'UTC'` to all 6 sample events.

`lib/firestore.ts` — no change needed; `timezone` is spread into Firestore automatically via `toFirestore`.

### Timezone conversion
When saving an event, the `datetime-local` input value (e.g. `"2026-06-15T20:00"`) is interpreted as local time in the selected timezone and converted to a UTC `Date` using the browser `Intl` API:

```typescript
function tzLocalToUTC(localDatetime: string, tz: string): Date {
  // Treat input as UTC to extract the numbers, then find the real offset
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
    `${get('year')}-${get('month')}-${get('day')}T${String(h).padStart(2,'0')}:${get('minute')}:${get('second')}Z`
  );
  return new Date(naive.getTime() + (naive.getTime() - tzAsUTC.getTime()));
}
```

### Searchable timezone picker (replaces "Start Date" field)
Located in `ClientApp.tsx` event modal.

**State:**
- `evtTz: string` — selected IANA timezone string (default `'UTC'`)
- `tzSearch: string` — current text in the search input
- `tzOpen: boolean` — whether the dropdown list is visible

**Behavior:**
- Text input shows the label of the currently selected timezone (e.g. "Tokyo, Japan")
- On focus/type: `tzOpen = true`, list filters by `tzSearch` matching label
- Click an option: sets `evtTz`, sets display label, closes dropdown
- Click outside: closes dropdown

**Curated list (~35 entries):**
```
UTC                    → UTC
Honolulu, Hawaii       → Pacific/Honolulu
Anchorage, Alaska      → America/Anchorage
Los Angeles            → America/Los_Angeles
Denver                 → America/Denver
Chicago                → America/Chicago
Mexico City            → America/Mexico_City
New York               → America/New_York
Toronto                → America/Toronto
Miami                  → America/New_York
São Paulo              → America/Sao_Paulo
Buenos Aires           → America/Argentina/Buenos_Aires
London                 → Europe/London
Lisbon                 → Europe/Lisbon
Paris                  → Europe/Paris
Madrid                 → Europe/Madrid
Rome                   → Europe/Rome
Berlin                 → Europe/Berlin
Amsterdam              → Europe/Amsterdam
Stockholm              → Europe/Stockholm
Helsinki               → Europe/Helsinki
Moscow                 → Europe/Moscow
Istanbul               → Europe/Istanbul
Dubai                  → Asia/Dubai
Riyadh                 → Asia/Riyadh
Karachi                → Asia/Karachi
Mumbai                 → Asia/Kolkata
Bangkok                → Asia/Bangkok
Singapore              → Asia/Singapore
Hong Kong              → Asia/Hong_Kong
Beijing / Shanghai     → Asia/Shanghai
Seoul                  → Asia/Seoul
Tokyo, Japan           → Asia/Tokyo
Sydney                 → Australia/Sydney
Auckland               → Pacific/Auckland
```

### EventCard display
`dateStr` in `EventCard.tsx` passes `timeZone: ev.timezone` to `toLocaleDateString`, so the date shown on the card reflects the event's local time:
```typescript
const dateStr = ev.target.toLocaleDateString('en-US', {
  weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
  timeZone: ev.timezone,
});
```

---

## Files Changed

| File | Change |
|---|---|
| `app/globals.css` | Add `@media (max-width: 640px)` block; add `:active` to `.btn` |
| `lib/types.ts` | Add `timezone: string` to `Event` |
| `lib/initialEvents.ts` | Add `timezone: 'UTC'` to all 6 events |
| `components/ClientApp.tsx` | Add `isLoggingIn`, `isSaving`, `evtTz`, `tzSearch`, `tzOpen` states; add `tzLocalToUTC`; replace "Start Date" field with searchable timezone picker; update `saveEvent` |
| `components/EventCard.tsx` | Pass `timeZone: ev.timezone` to `toLocaleDateString` |

---

## Out of Scope

- Auto-detecting timezone from venue text (NLP/geocoding)
- Showing the timezone abbreviation (e.g. "JST") on the card
- Changing existing events' timezones after creation
- Adding new timezones beyond the curated ~35
