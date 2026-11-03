const TZ = 'Europe/Oslo';

const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('nb-NO', { timeZone: TZ, weekday: 'short' });

// '2026-11-03' i norsk tid
export function osloDate(ms = Date.now()) {
  return dateFmt.format(new Date(ms));
}

// 'Ma', 'Ti', …
export function osloWeekday(ms) {
  const s = dayFmt.format(new Date(ms)).replace('.', '');
  return s.charAt(0).toUpperCase() + s.slice(1, 2);
}

// De siste n dagene (eldste først), som [{ date, label }]
export function lastDays(n, now = Date.now()) {
  const out = [];
  const seen = new Set();
  for (let i = n - 1; i >= 0; i--) {
    const ms = now - i * 86400000;
    const date = osloDate(ms);
    if (seen.has(date)) continue;
    seen.add(date);
    out.push({ date, label: osloWeekday(ms) });
  }
  return out;
}
