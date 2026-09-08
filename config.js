// ============================================================
// best-price 設定（正本はここだけ。index.html と legal.html の両方が読む）
// ★ "[...]" で始まる値は「未記入」。画面上では黄色で目立つ（fail-closed: 空白で隠さない）
// ★ LINE_URL を入れると、ページ内のすべての CTA が自動で LINE に切り替わる
// ============================================================
window.BP_CONFIG = {
  // --- 名称 ---
  SERVICE_NAME: "ベストプライス",
  SERVICE_SUB: "買取代行（お預かり販売）",

  // --- 事業者（古物営業法の表示義務・特商法表記に使う） ---
  COMPANY_NAME: "株式会社ベストトラスト",
  REPRESENTATIVE: "小林孝至",
  ADDRESS: "長野県岡谷市長地柴宮二丁目5番65号",
  SHIP_TO: "長野県岡谷市長地柴宮二丁目5番65号 株式会社ベストトラスト 宛",
  PUBLIC_SAFETY_COMMISSION: "長野県公安委員会",
  LICENSE_NO: "481212600002",

  // --- 受付窓口 ---
  LINE_URL: "",                      // 例: "https://lin.ee/xxxxxxx"。空なら メール受付にフォールバック
  CONTACT_EMAIL: "info@best-trust.biz",
  PHONE: "",                         // 任意（空なら表示しない）
  BUSINESS_HOURS: "10:00〜18:00（土日祝を除く）",
  REPLY_WITHIN: "24時間以内",
  SITE_URL: "https://bestprice-kaitori.com/",  // 本番ドメイン（末尾スラッシュ）。www は作らない方針

  // --- 手数料の設計値（docs/DESIGN.md §8 と一致させる） ---
  FEE_RATE: 0.20,          // 全部込み手数料（オークション実費を含む）
  REPEAT_FEE_RATE: 0.17,   // 2回目以降
  MIN_FEE_RATE: 0.14,      // 紹介併用時の下限
  BONUS_THRESHOLD: 50000,  // この落札額以上で送料分を上乗せ
  BONUS_AMOUNT: 1000,
  MIN_ESTIMATE: 5000,      // 目安額がこれ未満の品は受付しない

  // --- 最初の10件モニター（需要を「財布」で測る最初のオファー。埋まったら false にする） ---
  MONITOR_ENABLED: true,
  MONITOR_SLOTS: 10,
  MONITOR_FEE_RATE: 0.15,
  MONITOR_FILLED: 0,       // 埋まった件数（手動更新。★荷物が到着した当日に更新する。report.html の15%行もこれを見る）

  // --- 目安額レポート（report.html）。LP の「返事の見本を見る」リンクの表示だけを切り替える ---
  SAMPLE_REPORT_ENABLED: true
};
