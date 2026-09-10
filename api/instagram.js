// Vercel Serverless Function: Instagram Graph API の最新投稿を返す。
// トークンはサーバー側の環境変数のみ（ページには漏らさない）。
// 必要な環境変数（Vercel のプロジェクト設定で登録する）:
//   IG_ACCESS_TOKEN  … Instagram Graph API の長期アクセストークン
//   IG_USER_ID       … Instagram ビジネスアカウントの user id（省略時は /me/media を使う）
// どちらも未設定なら 200 + {items:[]} を返す（LP側はその場合セクションを隠す）。
// レスポンスは best-price の他ページ同様、公開情報のみ（投稿の画像URL・キャプション・パーマリンク）。

const CACHE = { at: 0, body: null };
const TTL_MS = 30 * 60 * 1000; // 30分キャッシュ（API上限を守る）

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const token = process.env.IG_ACCESS_TOKEN;
  const userId = process.env.IG_USER_ID;

  // トークン未設定 → 空を返す（LP側でセクションを隠す。空フィードを出さない）
  if (!token) {
    return res.status(200).end(JSON.stringify({ items: [], reason: 'no_token' }));
  }

  // キャッシュヒット
  if (CACHE.body && Date.now() - CACHE.at < TTL_MS) {
    return res.status(200).end(CACHE.body);
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
      // トークン切れなどは空扱い（LPを壊さない）
      const body = JSON.stringify({ items: [], reason: 'api_error' });
      return res.status(200).end(body);
    }

    const items = data.data
      .map((m) => ({
        id: m.id,
        // 動画はサムネ、それ以外は画像URL
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
    return res.status(200).end(body);
  } catch (e) {
    return res.status(200).end(JSON.stringify({ items: [], reason: 'exception' }));
  }
};
