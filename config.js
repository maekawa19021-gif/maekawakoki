/* 前川こうき後援会サイト設定
   Xホワイトアウト対策・市政レポート直下配置 2026-07-12 */

window.SITE_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwchzlQJe4SoLjkMiw0q6u_UF1zYGfH5mAX7GtAyeJJnInvGQHnjFlT_0cWHVe46R3OiA/exec",
  FORM_URLS: {
    join: "https://docs.google.com/forms/d/e/1FAIpQLSeNnKNgI4qroVGcVkSkW5tWOzl1apavfZZl_tQ3hisZEm9PGw/viewform",
    donate: "",
    party: "",
    full: ""
  },
  LINE_URL: ""
};

(function () {
  "use strict";

  const X_URL = "https://x.com/maekawa190";

  function addStyles() {
    if (document.getElementById("xStableOnlyStyles")) return;

    const style = document.createElement("style");
    style.id = "xStableOnlyStyles";
    style.textContent = `
      .x-stable-card{
        max-width:760px;
        margin:0 auto;
        padding:36px 28px;
        border:1px solid rgba(255,255,255,.16);
        border-radius:20px;
        background:
          radial-gradient(circle at 85% 15%,rgba(77,163,255,.18),transparent 38%),
          rgba(255,255,255,.055);
        text-align:center;
        box-shadow:0 12px 40px rgba(0,0,0,.18);
      }
      .x-stable-icon{
        display:grid;
        place-items:center;
        width:68px;
        height:68px;
        margin:0 auto 18px;
        border-radius:50%;
        background:#fff;
        color:#050505;
        font-size:31px;
        font-weight:900;
      }
      .x-stable-card h3{
        margin:0 0 8px;
        font-size:22px;
      }
      .x-stable-handle{
        margin:0 0 16px;
        color:#ffd400!important;
        font-weight:800;
      }
      .x-stable-card p{
        max-width:580px;
        margin:0 auto 22px;
        color:#9fb0d0;
        font-size:14px;
        line-height:1.8;
      }
      .x-stable-actions{
        display:flex;
        justify-content:center;
        gap:12px;
        flex-wrap:wrap;
      }
      .x-stable-link{
        display:inline-flex;
        justify-content:center;
        align-items:center;
        min-height:48px;
        padding:11px 24px;
        border-radius:999px;
        background:linear-gradient(135deg,#ffd400,#ffaa00);
        color:#0a1732!important;
        font-weight:900;
        text-decoration:none;
        box-shadow:0 6px 24px rgba(255,212,0,.28);
      }
      .x-stable-link-secondary{
        background:rgba(255,255,255,.06);
        color:#eef3ff!important;
        border:1px solid rgba(255,255,255,.26);
        box-shadow:none;
      }
      @media(max-width:640px){
        .x-stable-card{padding:28px 20px}
        .x-stable-actions{flex-direction:column}
        .x-stable-link{width:100%}
      }
    `;
    document.head.appendChild(style);
  }

  function moveXBelowReports() {
    const reports = document.getElementById("reports");
    const news = document.getElementById("news");

    if (!reports || !news) return;

    if (reports.nextElementSibling !== news) {
      reports.insertAdjacentElement("afterend", news);
    }
  }

  function replaceXEmbed() {
    const old = document.querySelector(".x-embed");
    if (!old || old.dataset.stableLink === "true") return;

    const box = document.createElement("div");
    box.className = "x-embed reveal on";
    box.dataset.stableLink = "true";
    box.innerHTML = `
      <div class="x-stable-card">
        <div class="x-stable-icon" aria-hidden="true">𝕏</div>
        <h3>前川こうき 公式X</h3>
        <p class="x-stable-handle">@maekawa190</p>
        <p>
          X側の外部埋め込み制限により、タイムラインが白画面や黒画面になる場合があります。
          表示の安定性を優先し、公式Xへのリンクを表示しています。
        </p>
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
        </div>
      </div>
    `;

    old.replaceWith(box);

    document
      .querySelectorAll('script[data-x-fresh-loader],script[src^="https://platform.twitter.com/widgets.js"]')
      .forEach(function (script) {
        script.remove();
      });
  }

  function apply() {
    addStyles();
    moveXBelowReports();
    replaceXEmbed();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      window.setTimeout(apply, 0);
    }, { once:true });
  } else {
    window.setTimeout(apply, 0);
  }
})();
