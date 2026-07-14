/* ============================================================
   前川こうき後援会サイト 設定ファイル
   ------------------------------------------------------------
   APPS_SCRIPT_URL : Apps Script を「ウェブアプリ」としてデプロイした後に
                     発行されるURLを貼り付けてください。

   FORM_URLS.council : 市議会へのご意見・後援会入会フォームです。
   FORM_URLS.join    : 後援会入会のみ、従来のGoogleフォームを使用します。
                     寄付・党員サポ・寄付＋党サポは独自フォームから
                     スプレッドシート記録後、Stripe決済へ進みます。

   LINE_URL        : 公式LINE URL。未設定ならLINEカードは非表示です。
   ============================================================ */
window.SITE_CONFIG = {
  // ★ここだけ、Apps Scriptをデプロイした後に必ず貼り付けてください。
  APPS_SCRIPT_URL: "",

  FORM_URLS: {
    // setupForm() 実行後に発行される「回答者用フォーム」のURLを貼り付けます。
    council: "",

    join:   "https://docs.google.com/forms/d/e/1FAIpQLSeNnKNgI4qroVGcVkSkW5tWOzl1apavfZZl_tQ3hisZEm9PGw/viewform",
    donate: "",
    party:  "",
    full:   ""
  },

  LINE_URL: ""
};
