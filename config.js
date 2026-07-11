/* ============================================================
   前川こうき後援会サイト 設定ファイル
   Xタイムライン直接表示修正版：2026-07-11 v3
   ============================================================ */

window.SITE_CONFIG = {
  // Apps Scriptウェブアプリの本番URL（必ず /exec で終わるURL）
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwchzlQJe4SoLjkMiw0q6u_UF1zYGfH5mAX7GtAyeJJnInvGQHnjFlT_0cWHVe46R3OiA/exec",

  FORM_URLS: {
    join:   "https://docs.google.com/forms/d/e/1FAIpQLSeNnKNgI4qroVGcVkSkW5tWOzl1apavfZZl_tQ3hisZEm9PGw/viewform",
    donate: "",
    party:  "",
    full:   ""
  },

  LINE_URL: ""
};

/* ============================================================
   X（旧Twitter）タイムライン修正
   widgets.jsによる動的生成が失敗する環境向けに、
   Xのタイムライン専用iframeを直接表示します。
   ============================================================ */
(function installDirectXTimeline() {
  "use strict";

  const ACCOUNT = "maekawa190";
  const FRAME_ID = "xDirectTimelineFrame";
  const STYLE_ID = "xDirectTimelineStyle";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .x-embed{
        max-width:680px !important;
        margin-left:auto !important;
        margin-right:auto !important;
        min-height:0 !important;
      }
      .x-timeline-mount{
        display:block !important;
        width:100% !important;
        min-height:640px !important;
        overflow:hidden !important;
        border:1px solid rgba(255,255,255,.14);
        border-radius:18px;
        background:#000;
      }
      #${FRAME_ID}{
        display:block !important;
        width:100% !important;
        height:720px !important;
        min-height:640px !important;
        border:0 !important;
        border-radius:18px;
        background:#000;
      }
      .x-embed .x-fallback{
        position:relative !important;
        inset:auto !important;
        display:flex !important;
        min-height:auto !important;
        margin:0 0 18px !important;
        padding:22px !important;
        z-index:3 !important;
      }
      .x-embed.loaded{
        min-height:0 !important;
      }
      .x-embed.loaded .x-fallback{
        display:flex !important;
      }
      @media (max-width:640px){
        .x-timeline-mount{
          min-height:600px !important;
        }
        #${FRAME_ID}{
          display:block !important;
          width:100% !important;
          height:680px !important;
          min-height:600px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function makeTimelineUrl() {
    const origin = encodeURIComponent(location.origin || "https://maekawa19021-gif.github.io");
    const query = [
      "dnt=true",
      "embedId=twitter-widget-0",
      "frame=false",
      "hideBorder=true",
      "hideFooter=false",
      "hideHeader=true",
      "hideScrollBar=false",
      "origin=" + origin,
      "showHeader=false",
      "showReplies=false",
      "transparent=false",
      "theme=dark",
      "cacheBust=" + Date.now()
    ].join("&");

    return "https://syndication.twitter.com/srv/timeline-profile/screen-name/" +
      encodeURIComponent(ACCOUNT) + "?" + query;
  }

  function setStatus(message) {
    const status = document.getElementById("xStatus");
    if (status) status.textContent = message;
  }

  function createFrame() {
    const frame = document.createElement("iframe");
    frame.id = FRAME_ID;
    frame.title = "前川こうき（@" + ACCOUNT + "）のX最新投稿";
    frame.src = makeTimelineUrl();
    frame.loading = "eager";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.setAttribute("scrolling", "yes");
    frame.setAttribute("frameborder", "0");
    frame.setAttribute("allowtransparency", "true");

    frame.addEventListener("load", function () {
      const box = document.querySelector(".x-embed");
      if (box) box.classList.add("loaded");
      setStatus("Xの最新投稿を表示しています。");
    });

    return frame;
  }

  function replaceReloadButton(loadTimeline) {
    const oldButton = document.getElementById("xReloadBtn");
    if (!oldButton) return;

    // index.html側の旧イベントを外すため、同じ見た目の新しいボタンへ交換します。
    const newButton = oldButton.cloneNode(true);
    newButton.disabled = false;
    newButton.textContent = "↻ タイムラインを再読み込み";
    oldButton.replaceWith(newButton);

    newButton.addEventListener("click", function () {
      loadTimeline();
    });
  }

  function start() {
    injectStyle();

    const box = document.querySelector(".x-embed");
    if (!box) return;

    let mount = document.getElementById("xTimelineMount");

    // 古いindex.htmlにも対応します。
    if (!mount) {
      mount = document.createElement("div");
      mount.id = "xTimelineMount";
      mount.className = "x-timeline-mount";
      box.appendChild(mount);
    } else {
      mount.classList.add("x-timeline-mount");
    }

    function loadTimeline() {
      setStatus("Xの最新投稿を読み込んでいます…");
      box.classList.add("loaded");
      mount.replaceChildren(createFrame());

      // index.html側に残っている15秒タイマーが表示状態を戻した場合の補正。
      window.setTimeout(function () {
        if (mount.querySelector("#" + FRAME_ID)) {
          box.classList.add("loaded");
          setStatus("Xの最新投稿を表示しています。");
        }
      }, 16000);
    }

    replaceReloadButton(loadTimeline);
    loadTimeline();
  }

  function boot() {
    // index.html末尾の既存スクリプトが実行された後に上書きします。
    window.setTimeout(start, 0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
