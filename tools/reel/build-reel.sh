#!/usr/bin/env bash
# 汎用リール生成: スライド画像フォルダ → 9:16 縦型mp4
#
# 使い方:
#   bash tools/reel/build-reel.sh <画像フォルダ> <出力mp4> [秒数リスト]
#   秒数リストは枚数ぶんをカンマ区切り（例 3.5,2.5,3,2.5,3,3.5）。
#   省略すると1枚3秒。画像は 01.png,02.png... の順に並ぶ前提。
#
# ★なぜキャラを出さないか（2026-09-10）
#   line-bot/knowledge-packs/best-price/guardrails.md が正本で、
#   「お金・契約・真贋の話ではキャラの口調を引っ込める」と定めている。
#   残債・買取・判定は「お金と契約」の実務説明なので、
#   ouenmovie の3キャラ掛け合いは使わず、素のスライド動画にする。
#
# ★地雷（実際に踏んだもの）
#   1. concat の list.txt に Windows の日本語パスを書くと ffmpeg が開けない。
#      → 中間ファイルは ASCII の一時ディレクトリに置き、list.txt には
#        ファイル名だけを書いて、その場所を作業ディレクトリにして呼ぶ。
#   2. 画像ごとに尺が違うので -t を1つに決め打ちできない。
#      → 枚ごとに秒数を渡せるようにした。
set -euo pipefail

SRC="${1:?画像フォルダを指定}"
OUT="${2:?出力mp4を指定}"
DURLIST="${3:-}"

BG="0x0A2138"; W=1080; H=1920; FPS=30

# ★ASCIIパスの作業場所（日本語パスを ffmpeg の concat に渡さない）
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 画像を番号順に集める
mapfile -t IMGS < <(ls "$SRC"/*.png 2>/dev/null | sort)
[ "${#IMGS[@]}" -gt 0 ] || { echo "★画像が見つかりません: $SRC" >&2; exit 1; }

# 秒数リストを配列に（省略時は全部3秒）
if [ -n "$DURLIST" ]; then
  IFS=',' read -r -a DURS <<< "$DURLIST"
else
  DURS=(); for _ in "${IMGS[@]}"; do DURS+=("3"); done
fi
if [ "${#DURS[@]}" -ne "${#IMGS[@]}" ]; then
  echo "★秒数の個数(${#DURS[@]})と画像の枚数(${#IMGS[@]})が合いません" >&2; exit 1
fi

total=0
i=0
for f in "${IMGS[@]}"; do
  d="${DURS[$i]}"
  i=$((i+1))
  seg="$(printf '%03d' "$i").mp4"
  # 9:16キャンバスに中央配置（はみ出さないよう縮小）、背景は紺
  ffmpeg -y -hide_banner -loglevel error \
    -loop 1 -t "$d" -i "$f" \
    -filter_complex "color=c=${BG}:s=${W}x${H}:d=${d}[bg];[0:v]scale=${W}:-1:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p[v]" \
    -map "[v]" -r "$FPS" "$TMP/$seg"
  echo "  $(basename "$f") → ${d}秒"
  total=$(python -c "print(round($total + $d, 2))")
done

# ★list.txt にはファイル名だけを書き、$TMP を作業ディレクトリにして呼ぶ
: > "$TMP/list.txt"
for m in "$TMP"/[0-9][0-9][0-9].mp4; do echo "file '$(basename "$m")'" >> "$TMP/list.txt"; done

( cd "$TMP" && ffmpeg -y -hide_banner -loglevel error \
    -f concat -safe 0 -i list.txt -c copy concat.mp4 )

mkdir -p "$(dirname "$OUT")"
cp "$TMP/concat.mp4" "$OUT"
echo "★作成: $OUT （${#IMGS[@]}枚 / 合計${total}秒）"
