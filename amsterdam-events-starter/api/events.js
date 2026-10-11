const SOURCES = [
  { id: 'jazz', name: 'Jazz in Amsterdam', url: 'https://jazzin.amsterdam/api?calendar=jazzAmsterdam&page=1&archive=false' },
  { id: 'art', name: 'Art Ahead', url: 'https://artahead.nl' },
  { id: 'club', name: 'Resident Advisor', url: 'https://ra.co/events/nl/amsterdam' },
];
const safeUrl = value => { try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
function asEvents(payload, source) {
  const values = Array.isArray(payload) ? payload : Array.isArray(payload?.events) ? payload.events : Array.isArray(payload?.data) ? payload.data : [];
  return values.map(x => ({
    id: String(x.id ?? x.url ?? `${source.id}-${x.title ?? x.name ?? ''}`),
    title: String(x.title ?? x.name ?? '').trim(),
    date: [x.date, x.time].filter(Boolean).join(' '),
    venue: String(x.venue ?? x.location ?? ''),
    price: String(x.price ?? ''),
    address: String(x.address ?? ''),
    url: safeUrl(x.site ?? x.url ?? x.link ?? ''), category: source.id, source: source.name,
  })).filter(x => x.title && x.date);
}
module.exports = async function handler(_req, res) {
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  // Only consume the explicitly published JSON API. No private endpoints, browser impersonation, or scraping.
  try {
    const response = await fetch(SOURCES[0].url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Jazz API HTTP ${response.status}`);
    const payload = await response.json();
    const now = new Date();
    const until = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const events = asEvents(payload, SOURCES[0])
      .filter(event => {
        const date = new Date(event.date);
        return !Number.isNaN(date.valueOf()) && date >= now && date <= until;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return res.status(200).json({ events, sources: SOURCES.map((s, i) => ({ ...s, status: i === 0 ? 'connected' : 'link-only' })), updatedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(200).json({ events: [], sources: SOURCES.map((s, i) => ({ ...s, status: i === 0 ? 'unavailable' : 'link-only' })), error: 'Live feed is currently unavailable.', updatedAt: new Date().toISOString() });
  }
};
