# 実装ハンドオフ: 売却体験コンテンツ（MVP）

> この1枚で着手できる粒度。設計は docs/CONTENT-SELLING-STORY-DESIGN.md（会議→Fable）。
> 実装は別チャット/別モデルでよい。ブランチを切って進める。

## 読む順
1. docs/CONTENT-SELLING-STORY-DESIGN.md（設計。特に C・E・G）
2. knowledge-packs/best-price/guardrails.md（禁句・分岐の置き場所）※これは line-bot リポ
3. best-price/index.html の #faq と item1（LP修正箇所）

## スコープ（MVPだけ・4週で1本の導線を閉じる）
Eの順番で、1週ずつ。同時に複数を出さない。

### ステップ0（司令塔が先にやる・画像の訂正）
- assets/content/x-zandebug.png と ig-zandebug.png の3段落目「払いが滞ると──買った人の端末が使えなくなる」は Paidy残債に当てはまらない（赤ロム混同）。「（キャリア分割の場合）」を足して作り直す。地雷G-6。

### ステップ1: LP の矛盾を消す（best-price リポ）
- index.html の item1（スマホ・タブレット）「ネットワーク利用制限『○』が条件」→「『○』または『−』が条件」。
- 受付できないもの（×・△）はそのまま。

### ステップ2: LINE の「判定」定型（line-bot リポ）
- knowledge-packs/best-price/canned/network-check.txt を新規作成（設計 C-3 の全文）。
- canned/greeting.txt の写真6枚案内の前に1行追加。
- guardrails.md に「ネットワーク利用制限の結果を受け取ったとき」の節を追加（設計 C-3(d)）。
- tools/generate-knowledge-content.mjs の matchCanned 正規表現に1行（greeting判定より前）: `/^判定$|ネットワーク利用制限|残債|分割.*(残|払)|赤ロム|Paidy|ペイディ/i → CANNED_NETWORK_CHECK`。
- `node tools/generate-knowledge-content.mjs best-price`（line-bot 直下）で再生成。生成物 apps/worker/src/services/best-price-knowledge-content.ts が更新されることを確認。
- worker をデプロイ（GitHub Actions）。実機で @477clzzf に「判定」と送り、network-check.txt の定型が返ることを確認。
- 禁句 grep（設計 G-11 の語）で全文面を確認してから再生成。

### ステップ3: 友だち追加経路 bp-x（任意・作れれば）
- OA Manager の「友だち追加経路」で bp-x を作り、そのURLを投稿4に使う。作れなければ現行 https://lin.ee/wsOMxGC のまま。

### ステップ4: X連投4本
- 設計 C-1 の投稿1〜4を1回で投稿。投稿1に修正版 x-zandebug.png を付ける。投稿1を「プロフィールに固定」。
- 投稿5（続報）は iPhone の手取りが確定してからのみ。金額を書かない。

### 2週目: Instagram カルーセル（設計 C-2）
### 3週目: LP FAQ 2問追記（設計 C-4）

## 機械的な完了判定
- LP: 本番 index.html に「『○』または『−』が条件」がある（curl で確認）。#faq に新2問が出る。
- LINE: 実機で「判定」→ network-check.txt の定型が返る。「○」と送ると写真6枚案内、「△」と送ると受付不可＋完済後案内が返る。
- X: 投稿1が固定、4本が連なっている。投稿5は未投稿（実売前のため）。
- 計測: OA Manager で経路別の週次追加数が見える。手集計スプレッドシート1枚がある。

## 地雷（設計 G の要点・着手前に必ず読む）
- 実績詐称回避: 運営者は自分の端末を「自分で宅配買取を比べて」売った。ベストプライスの成約実績のように書かない。
- 金額を全文面・全画像に書かない。実売確定まで「◯円で売れた」と書かない。
- △×には他サービスを勧めない。順序は判定→売却→振込明細→（相手が言ったら）他サービス。
- docs/service.md はボットに機械生成で届かない。判定ロジックは guardrails.md と canned に置く。
- 「判定」キーワードは Webhook側 canned のみで返す（OA Manager にキーワード応答を作らない）。
- 1週ずつ出す。同時に複数を変えない（効いた要素が分からなくなる）。

## 転記元の実在パス（裏取り済み 2026-09-09）
- best-price/index.html（#faq・item1「○が条件」を確認）
- best-price/assets/content/x-zandebug.png, ig-zandebug.png（既存）
- line-bot/knowledge-packs/best-price/{guardrails.md, persona.md, canned/{greeting,fee,photo-guide,escalation}.txt, docs/}
- line-bot/tools/generate-knowledge-content.mjs（persona/guardrails/canned を生成・docs/*.md は生成しない）
- LINE @477clzzf・友だち追加 https://lin.ee/wsOMxGC
