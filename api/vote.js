import { createHash } from 'node:crypto';
import { RATINGS, LINES, MAX_VOTES_PER_HOUR, KEEP_DAYS } from '../lib/config.js';
import { redis } from '../lib/redis.js';
import { osloDate } from '../lib/time.js';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// POST /api/vote  { "line": "drammen-oslo", "rating": "dritt" }
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ugyldig forespørsel.' }, 400);
  }

  const { line, rating } = body || {};
  if (!LINES[line]) return json({ error: 'Ukjent strekning.' }, 400);
  if (!RATINGS[rating]) return json({ error: 'Ukjent symbol.' }, 400);

  const r = redis();
  const now = Date.now();
  const date = osloDate(now);

  // Enkel spam-sperre. IP-en lagres aldri, bare en hash som byttes hver dag.
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'ukjent';
  const salt = process.env.SALT || 'togeterdritt';
  const who = createHash('sha256').update(`${ip}|${date}|${salt}`).digest('hex').slice(0, 32);
  const rlKey = `rl:${who}:${Math.floor(now / 3600000)}`;
  const tries = await r.incr(rlKey);
  if (tries === 1) await r.expire(rlKey, 3600);
  if (tries > MAX_VOTES_PER_HOUR) {
    return json({ error: 'Rolig nå. Du har klaget nok denne timen – ta en pust og prøv igjen senere.' }, 429);
  }

  // Tellingen: én hash per dag, felt = "strekning:symbol"
  const dayKey = `d:${date}`;
  const count = await r.hincrby(dayKey, `${line}:${rating}`, 1);
  await r.expire(dayKey, KEEP_DAYS * 86400);
  await r.incr('total');
  if (rating === 'greit') await r.set('last:greit', now);

  return json({
    ok: true,
    count, // du er passasjer nr. X som trykket dette på denne strekningen i dag
    line: LINES[line],
    rating: RATINGS[rating].label,
  });
}
