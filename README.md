# best-price — 送るだけの買取代行（お預かり販売）LP

長野県 諏訪・岡谷・塩尻・下諏訪 起点の、対面ゼロ・宅配のみの買取代行サービスの公開ページ。
設計の正本は [`docs/DESIGN.md`](docs/DESIGN.md)（全体フロー・LINE設計・写真テンプレ・卸し方・台帳・集客・30日計画）。

## ファイル
| ファイル | 役割 |
|---|---|
| `index.html` | LP本体（静的・外部依存なし） |
| `legal.html` | 古物営業法の表示・特商法表記・個人情報の取扱い |
| `config.js` | ★法人名・許可番号・LINE URL・手数料の設計値。**書き換えるのはここだけ** |
| `site.js` | config の値を画面に流し込む共通スクリプト（ロジックは持たない） |
| `docs/DESIGN.md` | 設計図（正本） |

## 公開前に埋めるもの（`config.js`）
`[...]` で始まる値は未記入で、画面上では**黄色**で表示される（空白で隠さない）。
- `COMPANY_NAME` / `REPRESENTATIVE` / `ADDRESS` / `SHIP_TO`
- `PUBLIC_SAFETY_COMMISSION` / `LICENSE_NO`（許可証のとおりに）
- `CONTACT_EMAIL`（LINE 稼働までの受付窓口）
- `SITE_URL`（本番ドメイン）

`LINE_URL` を入れると、ページ内の CTA が全部 LINE に切り替わる（空ならメール受付）。

## 公開手順
1. **管轄警察署へ URL の届出**（ホームページ利用取引）。公開前に済ませる。
2. `config.js` を埋めて、ローカルでブラウザで開いて黄色が残っていないことを確認。
3. Vercel に静的サイトとしてデプロイ（ビルド不要・Framework Preset: Other）。
4. ドメインは Cloudflare → Vercel を1コマンドで接続（www は作らない方針）:
   ```bash
   node ../ai-hub/bin/domain-connect.mjs 取得したドメイン
   ```
5. OGP 画像（1200x630）ができたら `index.html` の head に `og:image`（絶対URL）を追加する。

## LINE 公式の接続（後回し・設計済み）
`docs/DESIGN.md` §2 にあいさつ文・目安額テンプレ・発送ガイド・LTV施策の文面がある。
LINE 公式アカウントを作り、`config.js` の `LINE_URL` に友だち追加 URL を入れるだけで LP 側は完了。
