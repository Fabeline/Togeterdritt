import { Redis } from '@upstash/redis';

// Redis.fromEnv() leser KV_REST_API_URL/KV_REST_API_TOKEN (eller UPSTASH_REDIS_REST_*),
// som Vercel setter automatisk når du kobler Upstash til prosjektet.
// globalThis.__TGD_REDIS__ brukes bare av den lokale testen.
let client;
export function redis() {
  if (globalThis.__TGD_REDIS__) return globalThis.__TGD_REDIS__;
  if (!client) client = Redis.fromEnv();
  return client;
}
