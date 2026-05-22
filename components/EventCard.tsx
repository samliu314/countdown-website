'use client';

import { useEffect, useState } from 'react';
import type { Event } from '@/lib/types';

interface Cd { days: number; h: number; m: number; s: number; past: boolean }

function countdown(target: Date): Cd {
  const d = target.getTime() - Date.now();
  if (d <= 0) return { days: 0, h: 0, m: 0, s: 0, past: true };
  return {
    days: Math.floor(d / 86400000),
    h:    Math.floor((d % 86400000) / 3600000),
    m:    Math.floor((d % 3600000)  / 60000),
    s:    Math.floor((d % 60000)    / 1000),
    past: false,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

interface Props {
  event: Event;
  isEditor: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function EventCard({ event: ev, isEditor, onEdit, onDelete }: Props) {
  const [cd, setCd] = useState<Cd>(() => countdown(ev.target));

  useEffect(() => {
    setCd(countdown(ev.target));
    const timer = setInterval(() => setCd(countdown(ev.target)), 1000);
    return () => clearInterval(timer);
  }, [ev.target]);

  const dateStr = ev.target.toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
  });

  const heroStyle: React.CSSProperties = ev.image
    ? { backgroundImage: `url(${ev.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div className={`event-card${cd.past ? ' past' : ''}`}>
      <div className="card-hero" style={heroStyle}>
        {!ev.image && <div className="card-emoji">{ev.emoji}</div>}
        <div className="type-badge">{ev.type}</div>
        <div className={`card-editor-btns${isEditor ? ' show' : ''}`}>
          <div className="icon-btn" onClick={() => onEdit(ev.id)} title="Edit">✎</div>
          <div className="icon-btn del" onClick={() => onDelete(ev.id)} title="Delete">✕</div>
        </div>
      </div>

      <div className="card-body">
        {ev.fullBg && ev.image && (
          <div className="card-full-bg" style={{ backgroundImage: `url(${ev.image})` }} />
        )}

        <div className="card-name" style={{ fontFamily: ev.ff, fontSize: `${ev.fs}px` }}>
          {ev.name}
        </div>

        <div className="card-when">
          <span className="card-when-date">{dateStr}</span>
          {ev.venue && <span className="card-when-venue">{ev.venue}</span>}
        </div>

        <div className="countdown-row">
          {(['days', 'h', 'm', 's'] as const).map((key, i) => (
            <div key={key} className="cd-unit">
              <div className="cd-num" suppressHydrationWarning>{pad(cd[key])}</div>
              <div className="cd-lbl">{['Days', 'Hours', 'Mins', 'Secs'][i]}</div>
            </div>
          ))}
        </div>

        {cd.past && <div className="past-tag">// EVENT PASSED</div>}
      </div>
    </div>
  );
}
