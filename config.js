/* 前川こうき後援会サイト設定
   最新版：市議会へのご意見フォーム追加 2026-07-14 */

window.SITE_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwchzlQJe4SoLjkMiw0q6u_UF1zYGfH5mAX7GtAyeJJnInvGQHnjFlT_0cWHVe46R3OiA/exec",

  CONTACT_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx4Jrc6xGU84bX_qfpGbiu3CjoLat6zrDAqEr4K6yt206Loqfn-qKYEWvd5mwLqLw/exec",

  // X（旧Twitter）タイムライン埋め込みを試すかどうか。
  // false にすると埋め込みをやめ、公式Xへのリンクカードのみ表示します。
  SHOW_X_TIMELINE: false,

  FORM_URLS: {
    // setupForm() 実行後に発行された「回答者用フォーム」のURLを設定してください。
    council: "https://docs.google.com/forms/d/e/1FAIpQLScJcWqntGiKKVeN32JmFS12L5zedT4GX8-a41VUy9VpHHSNMw/viewform",
    join: "https://docs.google.com/forms/d/e/1FAIpQLSeNnKNgI4qroVGcVkSkW5tWOzl1apavfZZl_tQ3hisZEm9PGw/viewform",
    donate: "",
    party: "",
    full: ""
  },
  LINE_URL: ""
};

(function () {
  "use strict";

  const DRIVE_URL = "https://drive.google.com/drive/folders/1nhtLr-Fio5yn04aBJ-9JVLm90AHFnfeb?usp=sharing";
  const X_URL = "https://x.com/maekawa190";
  const GAS_URL = String(window.SITE_CONFIG.APPS_SCRIPT_URL || "").trim();

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function addStyles() {
    if (document.getElementById("maekawa-v5-style")) return;
    const s = document.createElement("style");
    s.id = "maekawa-v5-style";
    s.textContent = `
      .report-v5-state{grid-column:1/-1;width:100%;padding:42px 24px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:rgba(255,255,255,.045);text-align:center}
      .report-v5-state h3{margin:0 0 10px;font-size:19px}
      .report-v5-state p{margin:0;color:#9fb0d0;font-size:14px;line-height:1.8}
      .report-v5-spinner{width:38px;height:38px;margin:0 auto 18px;border:3px solid rgba(255,255,255,.16);border-top-color:#ffd400;border-radius:50%;animation:rv5spin .8s linear infinite}
      @keyframes rv5spin{to{transform:rotate(360deg)}}
      .report-v5-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:20px}
      .report-v5-retry{appearance:none;min-height:48px;padding:11px 24px;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(255,255,255,.06);color:#eef3ff;font:inherit;font-weight:800;cursor:pointer}
      .report-v5-retry:hover{color:#ffd400;border-color:#ffd400}

      .x-stable-card{max-width:680px;margin:0 auto;padding:34px 28px;border:1px solid rgba(255,255,255,.16);border-radius:20px;background:radial-gradient(circle at 85% 15%,rgba(77,163,255,.18),transparent 38%),rgba(255,255,255,.055);text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.18)}
      .x-stable-icon{display:grid;place-items:center;width:68px;height:68px;margin:0 auto 18px;border-radius:50%;background:#fff;color:#050505;font-size:31px;font-weight:900}
      .x-stable-card h3{margin:0 0 8px;font-size:22px}
      .x-stable-handle{margin:0 0 16px;color:#ffd400!important;font-weight:800}
      .x-stable-card p{max-width:560px;margin:0 auto 22px;color:#9fb0d0;font-size:14px;line-height:1.8}
      .x-stable-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}
      .x-stable-link{display:inline-flex;justify-content:center;align-items:center;min-height:48px;padding:11px 24px;border-radius:999px;background:linear-gradient(135deg,#ffd400,#ffaa00);color:#0a1732!important;font-weight:900;text-decoration:none;box-shadow:0 6px 24px rgba(255,212,0,.28)}
      .x-stable-link-secondary{background:rgba(255,255,255,.06);color:#eef3ff!important;border:1px solid rgba(255,255,255,.26);box-shadow:none}


      .x-desktop-shell{max-width:760px;margin:0 auto}
      .x-desktop-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:240px;padding:30px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:rgba(255,255,255,.045);text-align:center}
      .x-desktop-loading p{margin:0;color:#9fb0d0;font-size:14px}
      .x-desktop-spinner{width:38px;height:38px;margin:0 auto 16px;border:3px solid rgba(255,255,255,.16);border-top-color:#ffd400;border-radius:50%;animation:xDeskSpin .8s linear infinite}
      @keyframes xDeskSpin{to{transform:rotate(360deg)}}
      .x-desktop-mount{display:none;width:100%;min-height:640px;overflow:hidden;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:#000}
      .x-desktop-mount iframe{display:block!important;width:100%!important;max-width:100%!important;min-height:640px!important;border-radius:18px!important}


      .x-v6-wrapper{
        max-width:760px;
        margin:0 auto;
      }
      .x-stable-card-compact{
        max-width:760px;
        margin-bottom:18px;
        padding:24px 22px;
      }
      .x-stable-card-compact .x-stable-icon{
        width:54px;
        height:54px;
        margin-bottom:12px;
        font-size:25px;
      }
      .x-stable-card-compact p{
        margin-bottom:16px;
      }
      .x-v6-timeline-area{
        width:100%;
        min-height:220px;
        overflow:hidden;
        border:1px solid rgba(255,255,255,.14);
        border-radius:18px;
        background:#fff;
      }
      .x-v6-loading{
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        min-height:220px;
        padding:28px;
        color:#56647c;
        background:#fff;
        text-align:center;
      }
      .x-v6-loading p{
        margin:0;
        color:#56647c;
        font-size:14px;
        line-height:1.8;
      }
      .x-v6-mount{
        display:none;
        width:100%;
        min-height:640px;
        background:#fff;
      }
      .x-v6-mount iframe{
        display:block!important;
        width:100%!important;
        max-width:100%!important;
        min-height:640px!important;
        background:#fff!important;
        color-scheme:light!important;
      }


      .x-v8-wrapper{
        max-width:760px;
        margin:0 auto;
      }
      .x-v8-guide{
        max-width:760px;
        margin-bottom:18px;
        padding:24px 22px;
      }
      .x-v8-guide .x-stable-icon{
        width:54px;
        height:54px;
        margin-bottom:12px;
        font-size:25px;
      }
      .x-v8-guide p{
        margin-bottom:16px;
      }
      .x-v8-loading{
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        min-height:220px;
        padding:28px;
        border:1px solid rgba(255,255,255,.14);
        border-radius:18px;
        background:rgba(255,255,255,.045);
        text-align:center;
      }
      .x-v8-loading p{
        margin:0;
        color:#9fb0d0;
        font-size:14px;
        line-height:1.8;
      }
      .x-v8-unavailable{
        min-height:120px;
      }
      .x-v8-mount{
        width:100%;
        height:0;
        overflow:hidden;
        border-radius:18px;
      }
      .x-v8-mount.is-visible{
        height:auto;
        overflow:hidden;
        border:1px solid rgba(255,255,255,.14);
        background:#060d1f;
      }
      .x-v8-mount iframe{
        display:block!important;
        width:100%!important;
        max-width:100%!important;
        border-radius:18px!important;
        color-scheme:dark;
      }

      @media(max-width:640px){
        .report-v5-state{padding:32px 18px}
        .report-v5-actions,.x-stable-actions{flex-direction:column}
        .report-v5-actions .btn,.report-v5-retry,.x-stable-link{width:100%}
        .x-stable-card{padding:28px 20px}
      }
    `;
    document.head.appendChild(s);
  }

  function installReports() {
    const oldGrid = document.getElementById("reportsGrid");
    if (!oldGrid || oldGrid.dataset.v5 === "true") return;

    const grid = document.createElement("div");
    grid.id = "reportsGrid";
    grid.className = oldGrid.className || "report-grid";
    grid.dataset.v5 = "true";
    oldGrid.replaceWith(grid);

    let runId = 0;

    function loading(attempt) {
      grid.innerHTML = `
        <div class="report-v5-state">
          <div class="report-v5-spinner" aria-hidden="true"></div>
          <p>${attempt > 1 ? "市政レポートを再取得しています（" + attempt + "回目）…" : "市政レポートを取得しています…"}</p>
        </div>`;
    }

    function error(message) {
      grid.innerHTML = `
        <div class="report-v5-state">
          <h3>市政レポートを読み込めませんでした</h3>
          <p>${esc(message)}</p>
          <div class="report-v5-actions">
            <button id="report-v5-retry" class="report-v5-retry" type="button">↻ もう一度読み込む</button>
            <a class="btn btn-gold" href="${DRIVE_URL}" target="_blank" rel="noopener">Googleドライブで一覧を見る →</a>
          </div>
        </div>`;
      const b = document.getElementById("report-v5-retry");
      if (b) b.addEventListener("click", load);
    }

    function thumb(r) {
      if (r.thumbnailUrl) return String(r.thumbnailUrl);
      const u = String(r.viewUrl || "");
      const m = u.match(/\/d\/([A-Za-z0-9_-]+)/) || u.match(/[?&]id=([A-Za-z0-9_-]+)/);
      return m ? "https://drive.google.com/thumbnail?id=" + encodeURIComponent(m[1]) + "&sz=w900" : "";
    }

    function render(payload) {
      if (!payload || payload.ok !== true) {
        throw new Error((payload && payload.message) || "Apps Scriptから正常なデータが返りませんでした。");
      }
      const reports = Array.isArray(payload.reports) ? payload.reports : [];
      if (!reports.length) {
        grid.innerHTML = `
          <div class="report-v5-state">
            <h3>現在公開中の市政レポートはありません</h3>
            <p>Google Driveの指定フォルダにPDFを追加すると、自動反映されます。</p>
            <div class="report-v5-actions"><a class="btn btn-gold" href="${DRIVE_URL}" target="_blank" rel="noopener">Googleドライブを開く →</a></div>
          </div>`;
        return;
      }

      grid.innerHTML = reports.map(r => {
        const title = esc(r.title || "市政レポート");
        const date = esc(r.dateLabel || r.updatedLabel || "");
        const view = esc(r.viewUrl || DRIVE_URL);
        const image = esc(thumb(r));
        const desc = esc(r.description || "PDFで市政レポートをご覧いただけます。");
        return `
          <article class="report-card reveal on">
            <a class="report-thumb" href="${view}" target="_blank" rel="noopener">
              <span class="fallback-label">CITY REPORT<br>PDF</span>
              ${image ? `<img src="${image}" alt="${title}の表紙" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : ""}
            </a>
            <div class="report-body">
              ${date ? `<p class="report-date en">${date}</p>` : ""}
              <h3>${title}</h3>
              <p>${desc}</p>
              <a class="btn btn-gold" href="${view}" target="_blank" rel="noopener">PDFを見る →</a>
            </div>
          </article>`;
      }).join("");
    }

    function jsonp(id) {
      return new Promise((resolve, reject) => {
        const cb = "maekawaReportsV5_" + Date.now() + "_" + Math.random().toString(36).slice(2);
        const script = document.createElement("script");
        let done = false;

        function clean() {
          if (script.parentNode) script.parentNode.removeChild(script);
          try { delete window[cb]; } catch (_) { window[cb] = undefined; }
        }

        const timer = setTimeout(() => {
          if (done) return;
          done = true;
          clean();
          reject(new Error("Apps Scriptの応答がタイムアウトしました。"));
        }, 15000);

        window[cb] = data => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          clean();
          if (id !== runId) return reject(new Error("stale"));
          resolve(data);
        };

        script.async = true;
        script.referrerPolicy = "no-referrer-when-downgrade";
        script.src = GAS_URL + (GAS_URL.includes("?") ? "&" : "?") +
          "route=reports&callback=" + encodeURIComponent(cb) + "&t=" + Date.now();
        script.onerror = () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          clean();
          reject(new Error("Apps Scriptを読み込めませんでした。"));
        };
        document.head.appendChild(script);
      });
    }

    async function fetchJson(id) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const url = GAS_URL + (GAS_URL.includes("?") ? "&" : "?") +
          "route=reports&format=json&t=" + Date.now();
        const res = await fetch(url, {
          cache: "no-store",
          credentials: "omit",
          redirect: "follow",
          signal: controller.signal
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const text = (await res.text()).trim();
        if (id !== runId) throw new Error("stale");
        try { return JSON.parse(text); } catch (_) {}
        const a = text.indexOf("("), b = text.lastIndexOf(")");
        if (a > 0 && b > a) return JSON.parse(text.slice(a + 1, b));
        throw new Error("受信データを解析できませんでした。");
      } finally {
        clearTimeout(timer);
      }
    }

    async function request(id) {
      try {
        return await fetchJson(id);
      } catch (e) {
        if (String(e && e.message) === "stale") throw e;
        return jsonp(id);
      }
    }

    async function load() {
      runId += 1;
      const id = runId;

      if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:[?#].*)?$/.test(GAS_URL)) {
        error("Apps Scriptの本番URLが正しく設定されていません。");
        return;
      }

      let last = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        if (id !== runId) return;
        loading(attempt);
        try {
          const data = await request(id);
          if (id !== runId) return;
          render(data);
          return;
        } catch (e) {
          if (String(e && e.message) === "stale") return;
          last = e;
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, attempt * 1800));
          }
        }
      }
      error((last && last.message) || "Apps Scriptから応答がありませんでした。");
    }

    load();
  }



  function installX() {
    const old = document.querySelector(".x-embed");
    if (!old || old.dataset.xV8 === "true") return;

    const box = document.createElement("div");
    box.className = "x-embed reveal on";
    box.dataset.xV8 = "true";
    old.replaceWith(box);

    document.querySelectorAll("script[data-x-fresh-loader]").forEach(s => s.remove());

    function createLinkCard(message, compact) {
      const card = document.createElement("div");
      card.className = "x-stable-card" + (compact ? " x-stable-card-compact" : "");
      card.innerHTML = `
        <div class="x-stable-icon" aria-hidden="true">𝕏</div>
        <h3>前川こうき 公式X</h3>
        <p class="x-stable-handle">@maekawa190</p>
        <p>${message}</p>
        <div class="x-stable-actions">
          <a class="x-stable-link"
             href="${X_URL}"
             target="_blank"
             rel="noopener">
             𝕏 最新投稿を見る
          </a>
          <a class="x-stable-link x-stable-link-secondary"
             href="${X_URL}"
             target="_blank"
             rel="noopener noreferrer">
             ブラウザで公式Xを開く
          </a>
        </div>`;
      return card;
    }

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const showTimeline = window.SITE_CONFIG.SHOW_X_TIMELINE !== false;

    if (isMobile || !showTimeline) {
      box.replaceChildren(
        createLinkCard(
          isMobile
            ? "スマートフォンでは表示の安定性を優先し、公式Xへのリンクを表示しています。"
            : "最新の投稿は、上のボタンから公式Xでご覧いただけます。",
          false
        )
      );
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "x-v8-wrapper";

    // タイムラインの上に常時リンクカードを表示（埋め込みが出ない場合の導線）
    const controlCard = createLinkCard(
      "下にXの最新投稿を表示します。表示されない場合も、上のボタンから公式Xを開けます。",
      true
    );

    const loading = document.createElement("div");
    loading.className = "x-v8-loading";
    loading.innerHTML = `
      <div class="x-desktop-spinner" aria-hidden="true"></div>
      <p>Xの最新投稿を読み込んでいます…</p>`;

    const mount = document.createElement("div");
    mount.className = "x-v8-mount";

    const timeline = document.createElement("a");
    timeline.className = "twitter-timeline";
    timeline.href = "https://twitter.com/maekawa190";
    timeline.textContent = "前川こうき（@maekawa190）の投稿";
    timeline.setAttribute("data-height", "720");
    timeline.setAttribute("data-theme", "dark");
    timeline.setAttribute("data-lang", "ja");
    timeline.setAttribute("data-dnt", "true");
    timeline.setAttribute("data-chrome", "noheader nofooter noborders transparent");
    timeline.setAttribute("data-tweet-limit", "5");
    mount.appendChild(timeline);

    wrapper.appendChild(controlCard);
    wrapper.appendChild(loading);
    wrapper.appendChild(mount);
    box.replaceChildren(wrapper);

    let settled = false;
    let pollTimer = 0;

    // widgets.jsは、タイムラインの中身を描画できたときにiframeを可視化し、
    // 実際の高さを設定する。X側の制限で中身が空のままの場合は
    // visibility:hidden・高さほぼ0のままなので、
    // 「実際に描画できたことを確認できた場合のみ」表示エリアを開く。
    function isRendered() {
      const iframe = mount.querySelector("iframe");
      if (!iframe) return false;
      if (iframe.style.visibility === "hidden") return false;
      const inline = parseFloat(iframe.style.height || "0") || 0;
      const rect = iframe.getBoundingClientRect().height || 0;
      return Math.max(inline, rect) >= 150;
    }

    function succeed() {
      if (settled) return;
      settled = true;
      window.clearInterval(pollTimer);
      loading.style.display = "none";
      mount.classList.add("is-visible");
    }

    function fail() {
      if (settled) return;
      settled = true;
      window.clearInterval(pollTimer);
      mount.remove();
      loading.classList.add("x-v8-unavailable");
      loading.innerHTML = `
        <p>
          X側の制限により、タイムラインを表示できませんでした。<br>
          上の「最新投稿を見る」ボタンから公式Xをご覧ください。
        </p>`;
    }

    function check() {
      if (settled) return;
      if (isRendered()) succeed();
    }

    function loadWidget() {
      try {
        if (window.twttr && window.twttr.widgets && window.twttr.widgets.load) {
          if (window.twttr.events && window.twttr.events.bind) {
            window.twttr.events.bind("rendered", function () {
              window.setTimeout(check, 80);
            });
          }
          window.twttr.widgets.load(mount);
        } else {
          fail();
        }
      } catch (_) {
        fail();
      }
    }

    if (window.twttr && window.twttr.widgets) {
      loadWidget();
    } else {
      const existing = document.querySelector(
        'script[src^="https://platform.twitter.com/widgets.js"]'
      );

      if (existing) {
        existing.addEventListener("load", loadWidget, { once: true });
        existing.addEventListener("error", fail, { once: true });
      } else {
        const script = document.createElement("script");
        script.async = true;
        script.charset = "utf-8";
        script.src = "https://platform.twitter.com/widgets.js";
        script.onload = loadWidget;
        script.onerror = fail;
        document.head.appendChild(script);
      }
    }

    // 描画完了を定期チェックし、15秒以内に確認できなければ案内文に切り替える
    pollTimer = window.setInterval(check, 600);

    window.setTimeout(function () {
      if (!settled) fail();
    }, 15000);
  }


  function moveXBelowReports() {
    const reports = document.getElementById("reports");
    const news = document.getElementById("news");

    if (!reports || !news) return;

    if (reports.nextElementSibling !== news) {
      reports.insertAdjacentElement("afterend", news);
    }
  }

  function apply() {
    addStyles();
    moveXBelowReports();
    installReports();
    installX();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        window.setTimeout(apply, 0);
      },
      { once: true }
    );
  } else {
    window.setTimeout(apply, 0);
  }
})();
