/* ============================================================
   前川こうき後援会サイト 設定ファイル
   ------------------------------------------------------------
   APPS_SCRIPT_URL : Apps Script を「ウェブアプリ」としてデプロイした後に
                     発行されるURLを貼り付けてください。

   FORM_URLS.join  : 後援会入会のみ、従来のGoogleフォームを使用します。
                     寄付・党員サポ・寄付＋党サポは独自フォームから
                     スプレッドシート記録後、Stripe決済へ進みます。

   LINE_URL        : 公式LINE URL。未設定ならLINEカードは非表示です。
   ============================================================ */
window.SITE_CONFIG = {
  // ★ここだけ、Apps Scriptをデプロイした後に必ず貼り付けてください。
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwchzlQJe4SoLjkMiw0q6u_UF1zYGfH5mAX7GtAyeJJnInvGQHnjFlT_0cWHVe46R3OiA/exec",

  FORM_URLS: {
    join:   "https://docs.google.com/forms/d/e/1FAIpQLSeNnKNgI4qroVGcVkSkW5tWOzl1apavfZZl_tQ3hisZEm9PGw/viewform",
    donate: "",
    party:  "",
    full:   ""
  },

  LINE_URL: ""
};
