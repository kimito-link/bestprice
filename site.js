// index.html / legal.html 共通。config.js の値を画面へ流し込むだけ（ロジックは持たない）。
(function () {
  var C = window.BP_CONFIG || {};
  var isTodo = function (v) { return typeof v === "string" && /^\[.*\]$/.test(v.trim()); };
  var isBlank = function (v) { return v == null || String(v).trim() === ""; };
  var yen = function (n) { return Math.round(n).toLocaleString("ja-JP") + "円"; };

  // 1) data-cfg="KEY" の要素にテキストを流し込む。未記入は黄色で見せる。
  document.querySelectorAll("[data-cfg]").forEach(function (el) {
    var key = el.getAttribute("data-cfg");
    var v = C[key];
    if (isBlank(v)) { el.textContent = "[" + key + " 未記入]"; el.classList.add("todo"); return; }
    el.textContent = String(v);
    if (isTodo(v)) el.classList.add("todo");
  });
  document.querySelectorAll("[data-cfg-pct]").forEach(function (el) {
    var v = C[el.getAttribute("data-cfg-pct")];
    el.textContent = typeof v === "number" ? Math.round(v * 100) + "%" : "[未設定]";
  });
  document.querySelectorAll("[data-cfg-yen]").forEach(function (el) {
    var v = C[el.getAttribute("data-cfg-yen")];
    el.textContent = typeof v === "number" ? yen(v) : "[未設定]";
  });

  // 2) CTA: LINE_URL があれば LINE、無ければメール、どちらも無ければ「準備中」を隠さず出す。
  var hasLine = !isBlank(C.LINE_URL);
  var hasMail = !isBlank(C.CONTACT_EMAIL) && !isTodo(C.CONTACT_EMAIL);
  var mailBody = [
    "【写真査定の依頼】",
    "■ 品物（品目・ブランド・型番）: ",
    "■ 付属品（箱・保証書・ケーブル等）: ",
    "■ 気になる傷・不具合: ",
    "■ 最低希望額（あれば）: ",
    "",
    "写真6枚を添付してください:",
    "1. 正面全体  2. 背面全体  3. 側面・底面",
    "4. 傷や汚れのアップ  5. 型番・シリアル・刻印  6. 付属品を全部並べたもの"
  ].join("\n");
  document.querySelectorAll("[data-cta]").forEach(function (a) {
    if (hasLine) {
      a.href = C.LINE_URL; a.target = "_blank"; a.rel = "noopener";
      a.textContent = a.getAttribute("data-line-label") || "LINEで写真を送る（無料）";
      a.classList.add("is-line");
    } else if (hasMail) {
      a.href = "mailto:" + C.CONTACT_EMAIL + "?subject=" + encodeURIComponent("写真査定の依頼") + "&body=" + encodeURIComponent(mailBody);
      a.textContent = a.getAttribute("data-mail-label") || "メールで写真を送る（無料）";
    } else {
      a.href = "#contact"; a.classList.add("todo");
      a.textContent = "受付窓口 準備中";
      a.title = "config.js に LINE_URL か CONTACT_EMAIL を入れると有効になります";
    }
  });
  // 2b) お店向けの相談CTA（在庫・備品の処分／応援ページ／診断）。窓口の切替は写真査定と同じ
  var shopBody = [
    "【お店の相談】",
    "■ 店名: ",
    "■ 相談したいこと（在庫・備品の処分／応援ページ／口コミ・サイトの診断）: ",
    "■ 場所（市町村）: ",
    "■ 連絡のつきやすい時間帯: "
  ].join("\n");
  document.querySelectorAll("[data-cta-shop]").forEach(function (a) {
    if (hasLine) { a.href = C.LINE_URL; a.target = "_blank"; a.rel = "noopener"; a.classList.add("is-line"); }
    else if (hasMail) { a.href = "mailto:" + C.CONTACT_EMAIL + "?subject=" + encodeURIComponent("お店の相談") + "&body=" + encodeURIComponent(shopBody); }
    else { a.href = "#contact"; a.classList.add("todo"); a.textContent = "受付窓口 準備中"; }
  });

  // 2c) 画面下に固定のLINEバー（LINE_URL があるときだけ）。最後の窓口 #contact が見えている間は引っ込める
  var bar = document.querySelector("[data-line-bar]");
  if (bar) {
    bar.hidden = !hasLine;
    document.body.classList.toggle("has-line-bar", hasLine);
    var contact = document.getElementById("contact");
    if (hasLine && contact && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { bar.classList.toggle("is-away", es[0].isIntersecting); }, { threshold: 0.15 }).observe(contact);
    }
  }

  var note = document.getElementById("channel-note");
  if (note) note.textContent = hasLine
    ? "LINEで写真を6枚送り、最後に「以上」と送ってください。"
    : "メールに写真を添付して送るだけ。LINEでの受付は準備中です。";

  // 3) 振込目安の計算（1か所だけ。シミュレーターと report.html の両方がこれを呼ぶ）
  //    落札額 x から手数料 rate を引き、BONUS_THRESHOLD 以上なら送料分 BONUS_AMOUNT を足す。
  window.BP_calc = function (x, rate) {
    var bonus = x >= (C.BONUS_THRESHOLD || Infinity) ? (C.BONUS_AMOUNT || 0) : 0;
    return x - x * (rate || 0) + bonus;
  };

  // 3a) 振込シミュレーター（落札額 → 手数料 → 振込目安）
  var inp = document.getElementById("sim-input");
  if (inp) {
    var render = function () {
      var x = Number(String(inp.value).replace(/[^0-9]/g, "")) || 0;
      var fee = x * (C.FEE_RATE || 0);
      var bonus = x >= (C.BONUS_THRESHOLD || Infinity) ? (C.BONUS_AMOUNT || 0) : 0;
      document.getElementById("sim-fee").textContent = yen(fee);
      document.getElementById("sim-bonus").textContent = bonus ? "+" + yen(bonus) : "なし（" + yen(C.BONUS_THRESHOLD) + "以上で+" + yen(C.BONUS_AMOUNT) + "）";
      document.getElementById("sim-net").textContent = yen(window.BP_calc(x, C.FEE_RATE));
      document.getElementById("sim-repeat").textContent = yen(window.BP_calc(x, C.REPEAT_FEE_RATE));
      var sm = document.getElementById("sim-monitor"); if (sm) sm.textContent = yen(window.BP_calc(x, C.MONITOR_FEE_RATE));
    };
    inp.addEventListener("input", render);
    render();
  }

  // 3b) モニター枠の表示（config で ON/OFF）
  var mon = C.MONITOR_ENABLED && (C.MONITOR_SLOTS || 0) - (C.MONITOR_FILLED || 0) > 0;
  document.querySelectorAll("[data-monitor]").forEach(function (el) { el.hidden = !mon; });
  document.querySelectorAll("[data-monitor-left]").forEach(function (el) { el.textContent = String((C.MONITOR_SLOTS || 0) - (C.MONITOR_FILLED || 0)); });
  var simMon = document.getElementById("sim-monitor-row");
  if (simMon) simMon.hidden = !mon;

  // 3c) 「返事の見本を見る」リンク（config で ON/OFF。送付済みのレポートURLには影響しない）
  document.querySelectorAll("[data-sample-report]").forEach(function (el) { el.hidden = !C.SAMPLE_REPORT_ENABLED; });

  // 3d) X の公式アカウントへの導線（config に X_URL があるときだけ出す）
  document.querySelectorAll("[data-x-link]").forEach(function (a) {
    if (isBlank(C.X_URL) || isTodo(C.X_URL)) { a.hidden = true; return; }
    a.href = C.X_URL; a.hidden = false;
  });

  // 4) 電話番号は任意表示
  document.querySelectorAll("[data-optional='PHONE']").forEach(function (el) {
    if (isBlank(C.PHONE)) el.hidden = true;
  });
  var y = document.getElementById("year"); if (y) y.textContent = String(new Date().getFullYear());
})();
