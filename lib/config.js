// Symbolene passasjerene kan trykke på. `score` brukes til dritt-indeksen (0–10).
export const RATINGS = {
  dod:       { label: 'Jeg døde litt',     score: 10 },
  dritt:     { label: 'Ren dritt',         score: 9 },
  buss:      { label: 'Buss for tog',      score: 8 },
  forsinket: { label: 'Forsinket. Igjen.', score: 7 },
  sild:      { label: 'Sild i tønne',      score: 6 },
  greit:     { label: 'Mistenkelig greit', score: 0 },
};

// Strekningene man kan velge. Legg til flere her – id-en (venstre) må være unik.
export const LINES = {
  'drammen-oslo':    'Drammen → Oslo S',
  'oslo-lillestrom': 'Oslo S → Lillestrøm',
  'gardermobanen':   'Gardermobanen',
  'ostfoldbanen':    'Østfoldbanen',
  'vestfoldbanen':   'Vestfoldbanen',
  'dovrebanen':      'Dovrebanen',
  'bergensbanen':    'Bergensbanen',
  'sorlandsbanen':   'Sørlandsbanen',
  'jaerbanen':       'Jærbanen',
  'nordlandsbanen':  'Nordlandsbanen',
};

// Maks antall trykk per person (IP) per time. Stopper den verste spammen.
export const MAX_VOTES_PER_HOUR = 15;

// Hvor lenge dagstall beholdes i databasen.
export const KEEP_DAYS = 40;
