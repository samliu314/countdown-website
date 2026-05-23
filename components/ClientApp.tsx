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
