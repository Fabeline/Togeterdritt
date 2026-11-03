# togeterdritt.no

Anonym klagemur for tog. Passasjerer trykker på et symbol (dødningshode, bæsj,
snegle …), og alt samles i en humoristisk statistikk.

**Oppsett:** én statisk side + to Vercel Functions + Upstash Redis (via Vercel Marketplace).
Ingen rammeverk, ingen byggesteg, ingen databasetabeller.

```
public/index.html   hele appen (vurder → takk → statistikk)
api/vote.js         POST /api/vote   – registrerer et trykk
api/stats.js        GET  /api/stats  – dagens tall, ukens verste strekning, fakta
lib/config.js       symboler, poeng og strekninger – rediger her
dev/server.mjs      lokal testserver med falsk database i minnet
```

## Publisere (ca. 5 minutter)

1. Legg mappen i et nytt GitHub-repo og importer det i Vercel
   (Add New → Project). Framework preset: **Other**. Ingen build-kommando.
2. I prosjektet: **Storage → Create Database → Upstash for Redis** (gratisnivået holder lenge),
   og koble den til prosjektet. Vercel setter da `KV_REST_API_URL` og `KV_REST_API_TOKEN` automatisk.
3. (Valgfritt) Legg til miljøvariabelen `SALT` med en tilfeldig tekst – brukes når IP-er
   hashes for spam-sperren.
4. Redeploy. Ferdig.
5. Domene: **Settings → Domains → togeterdritt.no**, og legg inn DNS-oppføringene Vercel
   viser hos domeneregistraren din.

Med CLI i stedet: `npm i -g vercel && vercel` og deretter `vercel --prod`.

## Lokalt

```bash
npm install
node dev/server.mjs        # http://localhost:3000, falsk database i minnet
# eller mot ekte Upstash:
vercel link && vercel env pull .env.development.local && vercel dev
```

## Hvordan dataene lagres

| Nøkkel                | Type   | Innhold                                              |
|-----------------------|--------|------------------------------------------------------|
| `d:2026-11-03`        | hash   | `strekning:symbol` → antall den dagen (norsk tid), slettes etter 40 dager |
| `total`               | tall   | alle klager noensinne                                |
| `last:greit`          | tall   | tidspunkt for siste «Mistenkelig greit»              |
| `rl:<hash>:<time>`    | tall   | spam-sperre, maks 15 trykk per time per IP, utløper etter 1 time |

IP-adresser lagres aldri – bare en hash som byttes hver dag.

## Endre ting

- **Strekninger / symboler / poeng:** `lib/config.js`. Nye symboler trenger også en knapp
  og et ikon i `public/index.html`.
- **Morsomme tekster:** funksjonen `kommentar()` og fakta-kortene i `public/index.html`.
- **Spam-grense:** `MAX_VOTES_PER_HOUR` i `lib/config.js`.
