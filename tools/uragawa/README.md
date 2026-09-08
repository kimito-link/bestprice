# /uragawa/ の作り方（パスワード付き説明ページ）

社外の人に渡す「しくみの説明」ページ。本文はパスワードから作った鍵で暗号化して HTML に埋め込むので、
サーバー上でもソースを見ても本文は読めない。正しいパスワードを入れたときだけブラウザ内で復号される。

- `shell.html` … パスワード入力画面・CSS・復号スクリプト（公開してよい部分）
- `build.mjs` … `content1.html`〜`content3.html`（本文・**このリポは public なので commit しない**。
  `.gitignore` 済み）を暗号化して `shell.html` の `__VAULT__` に埋め込む
- 出力を `<!doctype html>…<body>` で包み、`noindex` を付けて `uragawa/index.html` に置く

```bash
# 本文 content1-3.html をこのフォルダに置いてから
BP_PW="パスワード" node tools/uragawa/build.mjs tools/uragawa /tmp/out.html
```
ビルド時に「復号の往復」と「平文が最終HTMLに漏れていないか」を自動で確かめる。
パスワードを変えたいときは BP_PW を変えて作り直すだけ。
