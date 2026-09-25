# 実装引き継ぎ: 買取→法人向け商品の橋（MVP＝「入れ替え予定ヒアリング」と台帳）

> 2026-09-21。設計の正本は `BUYBACK-TO-B2B-BRIDGE-DESIGN.md`（Fable設計・司令塔裏取り）。この1枚だけで着手できる粒度で書く。
> **コードは書かない。** 作るのは文書4枚と guardrails の追記1節。実装者はどのモデルでもよい。

## 読む順
1. `BUYBACK-TO-B2B-BRIDGE-DESIGN.md` の E（MVP）→ C-Q2 → D → G
2. `ZERO-CAPITAL-SOURCING-DESIGN.md` の「ルート4」（条件書の条項の正本）
3. `../line-bot/knowledge-packs/best-price/guardrails.md`（追記先。既存の「他サービスの案内で守ること」節の直後に足す）

## スコープ（MVPだけ）
作るもの（すべて `best-price/docs/bridge/` 配下・新規ディレクトリ）:
1. `hearing.md` — 入れ替え予定ヒアリング文面1通。3問だけ: 入れ替え予定の有無／台数（PC・スマホ・什器）／時期。売り込み文言なし。末尾に「動作品のみ買取・廃棄分は運ばない」を1行。
2. `terms.md` — 買取条件書1枚。ルート4の4条項（動作・再販できる物に限定／廃棄分は先方の産廃業者へ／当社は廃棄物を運ばない／データ消去の責任分担）＋許可証提示・取引記録・出所確認。
3. `erasure-report-template.md` — 消去作業報告書の様式。項目: 型番／シリアル／消去方式／日時／担当／作業前後の写真の有無。冒頭に「第三者認証ではない」「SSDは方式に限界がある」を明記。**「証明書」「保証」という語を使わない。**
4. `../BRIDGE-LEDGER.md`（`best-price/docs/` 直下）— 台帳。表2つ:
   - 法人: 日付／相手（イニシャル可）／送付／予定あり／引取日確定／決裁者と対面／AI・LINEを聞かれた回数
   - 道具: 日付／通知件数／貼った数／そのまま送った数／返信までの分
5. guardrails 追記（line-bot 側、別PR）: 「## 買取とDXの両方向の線」節。買取→DX: 聞かれたら答える・会社案内1枚・口頭で勧めない。DX→買取: 言わない。

作らないもの: LP、価格表、証明書の自動生成、Target-List-maker の復活、キミにお知らせの販売用文面。

## 着手手順
1. `best-price` で `git checkout -b feat/bridge-mvp`。`docs/bridge/` を作り 1〜3 を書く。4 は `docs/BRIDGE-LEDGER.md`。
2. 文面の禁句チェック: `grep -nE "必ず|絶対|保証|今だけ|証明書|無料回収|高額買取|即金" docs/bridge/*.md docs/BRIDGE-LEDGER.md` が **0件**。
3. `line-bot` は別ブランチ `feat/guardrails-bridge` で guardrails.md に節を追記 → `node tools/generate-knowledge-content.mjs best-price` で再生成 → `cd apps/worker && npx vitest run src/services/knowledge-packs.test.ts` 緑（既存テストは buildSystemPrompt の文言を見ているので、既存文言を消さないこと）。
4. PRを2本（best-price / line-bot）。本文に設計書へのパスを書く。

## 機械的な完了判定
- `ls best-price/docs/bridge/` に hearing.md / terms.md / erasure-report-template.md の3つ、`best-price/docs/BRIDGE-LEDGER.md` が存在
- 上の grep が0件
- line-bot の knowledge-packs.test.ts が緑、`grep -n "両方向の線" line-bot/apps/worker/src/services/best-price-knowledge-content.ts` が1件以上
- （運用側・実装の外）台帳に「送付」5行と、返答欄が埋まった行 ≥1。0件でも台帳が埋まっていれば運用の完了判定は成立

## 地雷
- 「証明書」と書きたくなる。書かない（法的定義が無く、第三者認証と誤認される）。「作業報告書」。
- 条件書に「無料で引き取ります」を入れない。廃棄物処理法の無許可収集になる（`ZERO-CAPITAL-SOURCING-DESIGN.md` 冒頭）。
- ヒアリング文にAI・DXの一言を足さない。台帳の「聞かれた回数」が意味を失う。
- guardrails の既存文言を書き換えない（テストが文言一致で見ている）。追記のみ。
- 数字（5社・5台）は仮置き。文書に「目標」として書かない。台帳の実数だけを書く。
- キミにお知らせの配線（`line-bot/knowledge-packs/frima-reply-assist/README.md` 手順）は**このMVPの外**。自家消費として別途進める。

## 転記元（実在確認済み・2026-09-21）
- `best-price/docs/ZERO-CAPITAL-SOURCING-DESIGN.md` ルート4節（条件書の条項）
- `line-bot/knowledge-packs/best-price/guardrails.md`「他サービスの案内で守ること」節（追記位置）
- `line-bot/tools/generate-knowledge-content.mjs`（再生成コマンド）
- `line-bot/apps/worker/src/services/knowledge-packs.test.ts`（既存テスト）
