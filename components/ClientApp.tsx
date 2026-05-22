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
