// Cloudflare Pages Function: Instagram Graph API の最新投稿を返す。
const CACHE = { at: 0, body: null };
const TTL_MS = 30 * 60 * 1000;

export async function onRequestGet({ env }) {
  const headers = {
    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    'Content-Type': 'application/json; charset=utf-8',
  };

  const token = env.IG_ACCESS_TOKEN;
  const userId = env.IG_USER_ID;

  if (!token) {
    return new Response(JSON.stringify({ items: [], reason: 'no_token' }), { status: 200, headers });
  }

  if (CACHE.body && Date.now() - CACHE.at < TTL_MS) {
    return new Response(CACHE.body, { status: 200, headers });
  }

  try {
    const base = userId
      ? `https://graph.facebook.com/v21.0/${encodeURIComponent(userId)}/media`
      : 'https://graph.facebook.com/v21.0/me/media';
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const url = `${base}?fields=${fields}&limit=9&access_token=${encodeURIComponent(token)}`;

    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok || !Array.isArray(data.data)) {
      return new Response(JSON.stringify({ items: [], reason: 'api_error' }), { status: 200, headers });
    }

    const items = data.data
      .map((m) => ({
        id: m.id,
        image: m.media_type === 'VIDEO' ? m.thumbnail_url || m.media_url : m.media_url,
        caption: (m.caption || '').slice(0, 140),
        permalink: m.permalink,
        timestamp: m.timestamp,
      }))
      .filter((m) => m.image && m.permalink)
      .slice(0, 9);

    const body = JSON.stringify({ items });
    CACHE.at = Date.now();
    CACHE.body = body;
    return new Response(body, { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ items: [], reason: 'exception' }), { status: 200, headers });
  }
}
