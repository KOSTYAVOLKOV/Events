const SOURCES = {
  jazz: { id: 'jazz', name: 'Jazz in Amsterdam', url: 'https://jazzin.amsterdam/api?calendar=jazzAmsterdam&page=1&archive=false' },
  art: { id: 'art', name: 'Art Ahead', url: 'https://artahead.nl/feed.xml' },
  city: { id: 'city', name: 'Gemeente Amsterdam', url: 'https://api.data.amsterdam.nl/v1/evenementen/v1/evenementen' },
  club: { id: 'club', name: 'Resident Advisor', url: 'https://ra.co/events/nl/amsterdam' },
};

const safeUrl = value => {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
};

function parseJazz(payload) {
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.events) ? payload.events : [];
  return rows.map(event => ({
    id: String(event.id ?? `jazz-${event.title ?? ''}-${event.date ?? ''}`),
    title: String(event.title ?? '').trim(),
    date: [event.date, event.time].filter(Boolean).join(' '),
    venue: String(event.venue ?? ''),
    price: String(event.price ?? ''),
    url: safeUrl(event.site ?? ''),
    category: 'jazz',
    source: SOURCES.jazz.name,
  })).filter(event => event.title && event.date);
}

function decodeXml(value = '') {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\s+/g, ' ').trim();
}

function xmlValue(block, tag) {
  const escaped = tag.replace(':', '\\:');
  const match = block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
  if (match) return decodeXml(match[1]);
  const atomLink = tag === 'link' && block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i);
  return atomLink ? decodeXml(atomLink[1]) : '';
}

function eventDate(text) {
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::\d{2})?)?/);
  if (iso) return `${iso[1]}${iso[2] ? ` ${iso[2]}` : ''}`;
  const opens = text.match(/\b(?:opens?|opening|from)\s*:?\s*(\d{1,2}\s+[A-Za-zÀ-ÿ]+(?:\s+20\d{2})?)/i);
  if (!opens) return '';
  const value = opens[1];
  return /20\d{2}/.test(value) ? value : `${value} ${new Date().getFullYear()}`;
}

function parseArtAhead(xml) {
  const blocks = xml.match(/<(?:item|entry)\b[^>]*>[\s\S]*?<\/(?:item|entry)>/gi) || [];
  return blocks.map((block, index) => {
    const title = xmlValue(block, 'title');
    const description = xmlValue(block, 'description') || xmlValue(block, 'summary') || xmlValue(block, 'content:encoded');
    const combined = `${title} ${description}`;
    const url = safeUrl(xmlValue(block, 'link') || xmlValue(block, 'guid'));
    const date = eventDate(combined);
    // Art Ahead's feed covers multiple Dutch cities; keep Amsterdam entries only.
    if (!/Amsterdam/i.test(combined) || !title || !url) return null;
    return {
      id: `art-${url || index}`, title, date: date || 'Date TBA', venue: '', price: '',
      url, category: 'art', source: SOURCES.art.name,
    };
  }).filter(Boolean);
}

function records(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?._embedded?.evenementen)) return payload._embedded.evenementen;
  if (Array.isArray(payload?.evenementen)) return payload.evenementen;
  return [];
}

function parseCityEvents(payload) {
  return records(payload).map(event => {
    const date = [event.startdatum, event.starttijd].filter(Boolean).join(' ');
    return {
      id: `city-${event.id ?? event.url ?? event.titel}`,
      title: String(event.titel ?? '').trim(),
      date,
      venue: '',
      price: '',
      url: safeUrl(event.url ?? ''),
      category: 'events',
      source: SOURCES.city.name,
    };
  }).filter(event => event.title && event.date);
}

function inNextWeek(event) {
  const date = new Date(event.date);
  if (Number.isNaN(date.valueOf())) return event.date === 'Date TBA';
  const now = new Date();
  const until = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return date >= now && date <= until;
}

module.exports = async function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const today = new Date().toISOString().slice(0, 10);
  const cityUrl = new URL(SOURCES.city.url);
  cityUrl.searchParams.set('startdatum[gte]', today);
  const [jazzResult, artResult, cityResult] = await Promise.allSettled([
    fetch(SOURCES.jazz.url, { headers: { Accept: 'application/json' } }).then(async response => {
      if (!response.ok) throw new Error(`Jazz API HTTP ${response.status}`);
      return parseJazz(await response.json());
    }),
    fetch(SOURCES.art.url, { headers: { Accept: 'application/rss+xml, application/xml, text/xml' } }).then(async response => {
      if (!response.ok) throw new Error(`Art Ahead RSS HTTP ${response.status}`);
      return parseArtAhead(await response.text());
    }),
    fetch(cityUrl, { headers: { Accept: 'application/json' } }).then(async response => {
      if (!response.ok) throw new Error(`Amsterdam events API HTTP ${response.status}`);
      return parseCityEvents(await response.json());
    }),
  ]);

  const jazz = jazzResult.status === 'fulfilled' ? jazzResult.value : [];
  const art = artResult.status === 'fulfilled' ? artResult.value : [];
  const city = cityResult.status === 'fulfilled' ? cityResult.value : [];
  const events = [...jazz, ...art, ...city].filter(inNextWeek)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const statuses = [
    { ...SOURCES.jazz, status: jazzResult.status === 'fulfilled' ? 'connected' : 'unavailable' },
    { ...SOURCES.art, status: artResult.status === 'fulfilled' ? 'connected' : 'unavailable' },
    { ...SOURCES.city, status: cityResult.status === 'fulfilled' ? 'connected' : 'unavailable' },
    { ...SOURCES.club, status: 'link-only' },
  ];

  return res.status(200).json({ events, sources: statuses, updatedAt: new Date().toISOString() });
};
