import { RATINGS, LINES } from '../lib/config.js';
import { redis } from '../lib/redis.js';
import { lastDays } from '../lib/time.js';

const MIN_VOTES_FOR_WORST = 3;

function indexOf(byRating) {
  let n = 0, sum = 0;
  for (const [id, c] of Object.entries(byRating)) {
    n += c;
    sum += c * (RATINGS[id]?.score ?? 0);
  }
  return n ? Math.round((sum / n) * 10) / 10 : null;
}

// GET /api/stats
export async function GET() {
  const r = redis();
  const days = lastDays(7);
  const [hashes, lastGreit, total] = await Promise.all([
    Promise.all(days.map((d) => r.hgetall(`d:${d.date}`))),
    r.get('last:greit'),
    r.get('total'),
  ]);

  const week = [];
  const weekLines = {}; // line -> { votes, byRating }
  let todayByRating = {};
  let todayVotes = 0;

  days.forEach((d, i) => {
    const h = hashes[i] || {};
    const byRating = {};
    let votes = 0;
    for (const [field, raw] of Object.entries(h)) {
      const [line, rating] = field.split(':');
      const c = Number(raw) || 0;
      if (!RATINGS[rating] || !LINES[line]) continue;
      byRating[rating] = (byRating[rating] || 0) + c;
      votes += c;
      const wl = (weekLines[line] ||= { votes: 0, byRating: {} });
      wl.votes += c;
      wl.byRating[rating] = (wl.byRating[rating] || 0) + c;
    }
    week.push({ label: d.label, date: d.date, votes, index: indexOf(byRating) });
    if (i === days.length - 1) {
      todayByRating = byRating;
      todayVotes = votes;
    }
  });

  const ratings = Object.entries(RATINGS)
    .map(([id, { label }]) => {
      const count = todayByRating[id] || 0;
      return { id, label, count, pct: todayVotes ? Math.round((count / todayVotes) * 100) : 0 };
    })
    .sort((a, b) => b.count - a.count);

  let worst = null;
  for (const [line, v] of Object.entries(weekLines)) {
    if (v.votes < MIN_VOTES_FOR_WORST) continue;
    const idx = indexOf(v.byRating);
    if (!worst || idx > worst.index) {
      worst = {
        id: line,
        name: LINES[line],
        index: idx,
        votes: v.votes,
        pctDod: Math.round(((v.byRating.dod || 0) / v.votes) * 100),
      };
    }
  }

  const body = {
    today: { votes: todayVotes, index: indexOf(todayByRating), ratings },
    week,
    worst,
    facts: {
      forsinketToday: todayByRating.forsinket || 0,
      drittToday: todayByRating.dritt || 0,
      bussToday: todayByRating.buss || 0,
      lastGreitMs: lastGreit ? Number(lastGreit) : null,
      total: Number(total) || 0,
    },
    lines: Object.entries(LINES).map(([id, name]) => ({ id, name })),
  };

  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Nettleseren mellomlagrer ikke; Vercels CDN kan mellomlagre i 5 sek.
      // Sparer databasekall når mange ser på samtidig.
      'cache-control': 'no-store',
      'cdn-cache-control': 'public, s-maxage=5',
    },
  });
}
