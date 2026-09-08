# 実装ハンドオフ: 売り先くらべレポート（MVP・1つだけ）

作成: 2026-09-08（3段構えの手順3）。設計の正本は `LP-PROFIT-DESIGN.md`（設計＝Fable／裏取り＝司令塔）。
**この1枚だけで着手できる**ように書いてある。実装は次チャット・別モデルで。このセッションでは実装しない。

## 0. 読む順（合計15分）
1. `docs/LP-PROFIT-DESIGN.md` の **E（MVP）→ C（具体機構）→ G（地雷）**。A/B/D/F は必要なときに。
2. `index.html`（`#flow` の手順2の場所）、`config.js`（変数名）、`site.js`（`[data-cta]` 一括書き換え・`render()`・`mon`）。
3. 転記元: `../reviewcheck.jp/packages/core/src/utils/reportId.ts`（base64url の encode/decode。**そのまま写す**）、`../ai-health-check.link/src/kenshin/banned.ts`（禁句の正規表現。断定・煽り・比較・時限の行だけ抜く）。

## 1. スコープ（これだけ。増やさない）
| 変更 | ファイル | 内容 |
|---|---|---|
| 新規 | `report.html` | `location.hash` の payload を表示。C-2 の要素ID・C-3 の3行表・C-4 の mailto・`noindex`。`[data-cta]` を**置かない** |
| 新規 | `report-codec.js` | `encodePayload(obj)` / `decodePayload(str)`（reportId.ts 移植）＋ v1 検証（型・範囲・文字数）。失敗は `null` |
| 新規 | `tools/report-maker.html` | 担当者用。入力→レポートURL＋返事メール本文をコピー。`high < MIN_ESTIMATE` と禁句で作らせない。氏名・住所・口座の欄は作らない。`noindex`・どこからもリンクしない |
| 変更 | `config.js` | `SAMPLE_REPORT_ENABLED: true` を1行追加 |
| 変更 | `site.js` | (a) `window.BP_calc = function(x, rate){ ... }`（既存の `x - x*rate + bonus` を1関数に）。`render()` はこれを呼ぶ。(b) `[data-sample-report]` を `SAMPLE_REPORT_ENABLED` で `hidden` 切替（`[data-monitor]` と同じ書き方） |
| 変更 | `index.html` | `#flow` の手順2（目安額の li）に `<a data-sample-report href="report.html#<見本payload>">返事の見本を見る</a>` を1本 |
| 変更 | `docs/DESIGN.md` | §2-1 目安額テンプレの「▼ 次のどちらか」の前に「内訳と、ほかの売り方との比べ方 → {{REPORT_URL}}」を1行 |
| 変更 | `README.md` | `site.js` の行を「計算（振込目安）だけ持つ」に直す（設計 G-12） |

**やらないこと**: 紹介コード（`?ref`）・`REFERRAL_ENABLED`・FAQ変更・LP他セクションの文言変更・GA等の計測・OG画像・バックエンド・DB。第2弾の着手条件は「初回振込1件完了」（設計 E）。

## 2. 着手手順
1. `git fetch origin && git status` で origin/main と一致を確認（このリポは `idea-to-pr.yml` の自動PRが並行して動くことがある。[[parallel-sessions-trust-git-not-memory]]）。
2. ブランチ `feat/report-page` を切る。
3. 実装順: `report-codec.js`（往復テスト: 日本語 item を encode→decode で同一・不正 payload 5種が null）→ `site.js` の `BP_calc`（シミュレーター既定値 30,000円 の表示が変わらないこと）→ `report.html` → `tools/report-maker.html` → `index.html` のリンク → `config.js` → `docs/DESIGN.md`・`README.md`。
4. 見本payload: 作成ツールで `sample:true`・item「（見本）スマートフォン」・low 30000・high 38000・d 当日 で生成し、その文字列を `index.html` にリテラルで貼る。
5. ローカル確認: `.claude/launch.json` の `best-price-static`（`npx serve -l 5173`）で `http://localhost:5173/report.html#<payload>` を開く。幅 375px で横はみ出しゼロ（既存LPと同じ確認方法）。
6. commit → push → Vercel 自動デプロイ → **本番URLをスマホで開いて、送るボタンでメールアプリが起動し本文が全部入っていること**を見てから完了（設計 G-6・G-7・G-13）。

## 3. 完了判定（機械的に確認できるもの）
- [ ] `node -e` で `report-codec.js` の往復テスト: 日本語 item を含む payload が encode→decode で深い等価。`v!==1`／`low>high`／`item` 61文字／`note` 121文字／JSONでない文字列 の5つが `null`
- [ ] `grep -c "data-cta" report.html` が 0
- [ ] `grep -c "innerHTML" report.html report-codec.js tools/report-maker.html` が 0
- [ ] `grep -n "robots" report.html tools/report-maker.html` に `noindex` が出る
- [ ] 禁句 grep（banned.ts 由来の正規表現）を `index.html report.html tools/report-maker.html` に当てて 0 件（「20%」等の価格表示は対象外になるよう正規表現側で除く）
- [ ] `site.js` に `x - x *` の式が **1か所**（`BP_calc` の中）だけ
- [ ] 幅 375px で `document.documentElement.scrollWidth === 375`（report.html）
- [ ] 本番 `https://bestprice-kaitori.com/report.html#<見本>` が 200 で、`#rp-sample-banner` が表示される
- [ ] 本番 `index.html` の `#flow` から見本リンクが開く／`SAMPLE_REPORT_ENABLED:false` にすると消える
- [ ] スマホ（iOS メールと Gmail アプリの両方）で `#rp-send` → メール本文が C-4 のとおり全行入っている（**人の目で1回**）

## 4. 地雷（設計 G の要約。全文は設計書）
- `report.html` に `[data-cta]` を置くと `site.js` に mailto を上書きされる（G-1）
- `btoa` に日本語を直接渡すと落ちる。TextEncoder 経由（G-2）
- payload は `location.hash`。クエリは読まない（G-3）
- `textContent` 以外で描画しない（G-4）
- 計算式は `BP_calc` 1か所（G-5）
- mailto 本文は 300文字以内・`%0A` 改行・実機で確認（G-6）
- メール内リンクで `#` が落ちる環境が見つかったら `?r=` へ（G-7）
- 見本は必ず `sample:true`（G-8）
- 荷物到着ごとに `MONITOR_FILLED` を更新する運用（G-9）
- レポートに「食い違う場合はメールが正です」を1行（G-10）
- 作成ツールの自由記述に禁句ガード（G-11）
- 判定期間中は `#flow` 以外のLP文言を触らない（G-14）

## 5. 運用（実装の後・週1）
- 月曜に P（写真メール数）・R（レポート発行数）・S（発送件数）を数え、落札額シートの「週次」タブに書く。
- 判定: R=10 で S≥3 → 続行／R=10 で S≤1 → 比べ表・ボタン文言・送り先の位置の**どれか1つ**を替える／4週間で R<5 → LPは触らず集客（`docs/DESIGN.md` §6）へ。
- 第2弾（紹介コード）は初回振込1件が完了した日に着手。設計 A-5〜7・C-4・D「紹介の文言」を読む。

## 6. 転記元の実在パス（司令塔が2026-09-08に確認）
- `C:\Users\info\OneDrive\デスクトップ\Resilio\github\reviewcheck.jp\packages\core\src\utils\reportId.ts`
- `C:\Users\info\OneDrive\デスクトップ\Resilio\github\reviewcheck.jp\apps\web\lib\affiliateRef.ts`（第2弾用）
- `C:\Users\info\OneDrive\デスクトップ\Resilio\github\ai-health-check.link\src\kenshin\banned.ts`
- 既存LPの確認方法: `C:\Users\info\OneDrive\デスクトップ\Resilio\github\best-price\.claude\launch.json`（`best-price-static`）
