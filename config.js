/* ============================================================
   前川こうき後援会サイト 設定ファイル
   市政レポート・X安定表示修正版：2026-07-11 v4
   ============================================================ */

window.SITE_CONFIG = {
  // Apps Scriptウェブアプリの本番URL
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwchzlQJe4SoLjkMiw0q6u_UF1zYGfH5mAX7GtAyeJJnInvGQHnjFlT_0cWHVe46R3OiA/exec",

  FORM_URLS: {
    join: "https://docs.google.com/forms/d/e/1FAIpQLSeNnKNgI4qroVGcVkSkW5tWOzl1apavfZZl_tQ3hisZEm9PGw/viewform",
    donate: "",
    party: "",
    full: ""
  },

  LINE_URL: ""
};

/* ============================================================
   安定表示処理
   ・市政レポート：Google Driveの埋め込み専用フォルダ表示
   ・X：レート制限が出るサイト内タイムラインを停止し、直接リンクへ
   ============================================================ */
(function () {
  "use strict";

  const DRIVE_FOLDER_ID = "1nhtLr-Fio5yn04aBJ-9JVLm90AHFnfeb";
  const DRIVE_FOLDER_URL =
    "https://drive.google.com/drive/folders/" +
    DRIVE_FOLDER_ID +
    "?usp=sharing";

  const X_URL = "https://x.com/maekawa190";

  function addStableStyles() {
    if (document.getElementById("stableEmbedFixStyles")) return;

    const style = document.createElement("style");
    style.id = "stableEmbedFixStyles";
    style.textContent = `
      /* 市政レポート */
      .report-stable-wrap{
        width:100%;
        border:1px solid rgba(255,255,255,.14);
        border-radius:18px;
        overflow:hidden;
        background:#fff;
        box-shadow:0 10px 35px rgba(0,0,0,.18);
      }
      .report-stable-frame{
        display:block;
        width:100%;
        height:760px;
        border:0;
        background:#fff;
      }
      .report-stable-actions{
        display:flex;
        justify-content:center;
        align-items:center;
        gap:12px;
        flex-wrap:wrap;
        padding:18px;
        background:#0a1732;
        border-top:1px solid rgba(255,255,255,.14);
      }
      .report-stable-note{
        width:100%;
        margin:0 0 4px;
        color:#9fb0d0;
        text-align:center;
        font-size:13px;
      }

      /* X */
      .x-stable-card{
        max-width:680px;
        margin:0 auto;
        padding:34px 28px;
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
        color:#ffd400;
        font-weight:800;
      }
      .x-stable-card p{
        max-width:560px;
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
        color:#0a1732 !important;
        font-weight:900;
        text-decoration:none;
        box-shadow:0 6px 24px rgba(255,212,0,.28);
      }
      .x-stable-link-secondary{
        background:rgba(255,255,255,.06);
        color:#eef3ff !important;
        border:1px solid rgba(255,255,255,.26);
        box-shadow:none;
      }

      @media(max-width:640px){
        .report-stable-frame{
          height:640px;
        }
        .report-stable-actions{
          padding:16px 12px;
        }
        .x-stable-card{
          padding:28px 20px;
        }
        .x-stable-actions{
          flex-direction:column;
        }
        .x-stable-link{
          width:100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function replaceReportsSection() {
    const oldGrid = document.getElementById("reportsGrid");
    if (!oldGrid || oldGrid.dataset.stableReplaced === "true") return;

    /*
      index.html内の古い処理はoldGridへの参照を保持しています。
      新しい要素へ丸ごと交換することで、古いJSONPや壊れたiframeが
      公開画面を後から上書きできないようにします。
    */
    const newGrid = document.createElement("div");
    newGrid.id = "reportsGrid";
    newGrid.className = oldGrid.className;
    newGrid.dataset.stableReplaced = "true";

    const embedUrl =
      "https://drive.google.com/embeddedfolderview?id=" +
      encodeURIComponent(DRIVE_FOLDER_ID) +
      "#grid";

    newGrid.innerHTML = `
      <div class="report-stable-wrap">
        <iframe
          class="report-stable-frame"
          title="議会・市政レポート一覧"
          src="${embedUrl}"
          loading="eager"
          referrerpolicy="strict-origin-when-cross-origin"
          scrolling="auto">
        </iframe>
        <div class="report-stable-actions">
          <p class="report-stable-note">
            フォルダに追加したPDFは、この一覧へ自動的に反映されます。
          </p>
          <a class="btn btn-gold"
             href="${DRIVE_FOLDER_URL}"
             target="_blank"
             rel="noopener">
             Googleドライブで一覧を見る →
          </a>
        </div>
      </div>
    `;

    oldGrid.replaceWith(newGrid);
  }

  function replaceXSection() {
    const oldBox = document.querySelector(".x-embed");
    if (!oldBox || oldBox.dataset.stableReplaced === "true") return;

    /*
      古いX処理が保持しているDOMを丸ごと切り離します。
      これにより、widgets.jsや15秒タイマーが後から
      Rate limit exceeded表示へ戻すことを防ぎます。
    */
    const newBox = document.createElement("div");
    newBox.className = "x-embed reveal on";
    newBox.dataset.stableReplaced = "true";

    newBox.innerHTML = `
      <div class="x-stable-card">
        <div class="x-stable-icon" aria-hidden="true">𝕏</div>
        <h3>前川こうき 公式X</h3>
        <p class="x-stable-handle">@maekawa190</p>
        <p>
          X側のアクセス制限により、外部サイト内のタイムラインが
          「Rate limit exceeded」または空白になることがあります。
          最新の活動報告は、公式Xで確実にご覧いただけます。
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

    oldBox.replaceWith(newBox);

    // 旧処理が追加したXスクリプトを除去
    document
      .querySelectorAll('script[data-x-fresh-loader]')
      .forEach(function (script) {
        script.remove();
      });
  }

  function applyStableFix() {
    addStableStyles();
    replaceReportsSection();
    replaceXSection();
  }

  /*
    config.jsは<head>内で読み込まれるため、
    index.html末尾の既存処理が一度実行された後に置き換えます。
  */
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        window.setTimeout(applyStableFix, 0);
      },
      { once: true }
    );
  } else {
    window.setTimeout(applyStableFix, 0);
  }
})();
