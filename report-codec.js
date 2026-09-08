// report.html の payload を URL の hash に載せる／戻すための codec。
// 転記元: reviewcheck.jp/packages/core/src/utils/reportId.ts（base64url(JSON)・TextEncoder経由）。
// 設計: docs/LP-PROFIT-DESIGN.md C-1。個人情報の項目はスキーマに存在しない（構造で防ぐ）。
// 依存ゼロ。ブラウザでも Node（テスト）でも動く。
(function (root) {
  "use strict";

  var LIMITS = { item: 60, note: 120, max: 10000000 };

  function b64encode(bin) { return (typeof btoa === "function") ? btoa(bin) : Buffer.from(bin, "binary").toString("base64"); }
  function b64decode(b64) { return (typeof atob === "function") ? atob(b64) : Buffer.from(b64, "base64").toString("binary"); }

  // JSON → base64url（+ / = を置換）
  function encode(obj) {
    var json = JSON.stringify(JSON.parse(JSON.stringify(obj))); // undefined を落として短くする
    var bytes = new TextEncoder().encode(json);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return b64encode(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function isDate(s) {
    if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var d = new Date(s + "T00:00:00Z");
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }
  function isInt(n) { return typeof n === "number" && isFinite(n) && Math.floor(n) === n; }

  // base64url → 検証済み payload。1つでも外れたら null（fail-closed）。未知のキーは無視。
  function decode(str) {
    try {
      if (typeof str !== "string" || !str) return null;
      var b64 = str.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var bin = b64decode(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var p = JSON.parse(new TextDecoder().decode(bytes));
      if (!p || typeof p !== "object") return null;
      if (p.v !== 1) return null;
      if (typeof p.item !== "string") return null;
      var item = p.item.trim();
      if (item.length < 1 || item.length > LIMITS.item) return null;
      if (!isInt(p.low) || !isInt(p.high)) return null;
      if (!(p.low > 0 && p.low <= p.high && p.high <= LIMITS.max)) return null;
      if (!isDate(p.d)) return null;
      var note = "";
      if (p.note !== undefined && p.note !== null) {
        if (typeof p.note !== "string") return null;
        note = p.note.trim();
        if (note.length > LIMITS.note) return null;
      }
      if (p.diy !== undefined && typeof p.diy !== "boolean") return null;
      if (p.sample !== undefined && typeof p.sample !== "boolean") return null;
      return { v: 1, item: item, low: p.low, high: p.high, d: p.d, diy: p.diy === true, note: note, sample: p.sample === true };
    } catch (e) {
      return null;
    }
  }

  // 禁句（ai-health-check.link/src/kenshin/banned.ts から「断定・煽り・比較・時限」の行だけ抜粋）。
  // 価格表示の「20%」は対象にしない（割合の%断定は自由記述で書かせない運用にする）。
  var BANNED = [
    /必ず|絶対|確実に/,
    /(確率|可能性)が高い/,
    /他社(より|と比べ|と比較)|ナンバーワン|日本一|最大級|no\.?1/i,
    /保証(しま|され|付)/,
    /今だけ|期間限定|先着|割引|円\s*OFF|オフキャンペーン/i,
    /高額買取|業界最高値|最高値|誰でも稼げ/,
    /平均より|業界平均|ランキング|順位|ワースト/
  ];
  function findBanned(text) {
    var hits = [];
    if (typeof text !== "string") return hits;
    for (var i = 0; i < BANNED.length; i++) { var m = text.match(BANNED[i]); if (m) hits.push(m[0]); }
    return hits;
  }

  var api = { encode: encode, decode: decode, findBanned: findBanned, LIMITS: LIMITS, BANNED: BANNED };
  root.BP_report = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
