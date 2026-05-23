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
