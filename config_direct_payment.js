/* ============================================================
   サイト設定ファイル
   ------------------------------------------------------------
   APPS_SCRIPT_URL : 「支払い前の申込情報をスプレッドシートへ記録し、
                     Stripe決済ページへ転送する」Apps Script WebアプリURL
   STRIPE_LINKS    : Stripe Payment Links のURL
                     ※ test_ ではなく本番URLに差し替えてください。
   LINE_URL        : 公式LINE URL
   ============================================================ */
window.SITE_CONFIG = {
  APPS_SCRIPT_URL: "", // 例: https://script.google.com/macros/s/XXXXXXXX/exec

  STRIPE_LINKS: {
    // 寄付：Stripe Payment Linksで作成
    // once: 「Customers choose what to pay / 支払者が金額を入力」形式推奨
    // monthly500: 月額500円の商品を作り、数量調整ONにする形式推奨
    donate_once: "",
    donate_monthly500: "",

    // 党員・サポーター：年額・自動更新の商品として作成
    party_member_yearly: "",     // 党員 年額4,000円
    party_supporter_yearly: ""   // サポーター 年額2,000円
  },

  FORM_URLS: {
    join:   "https://docs.google.com/forms/d/e/1FAIpQLSeNnKNgI4qroVGcVkSkW5tWOzl1apavfZZl_tQ3hisZEm9PGw/viewform",
    donate: "",
    party:  "",
    full:   ""
  },
  LINE_URL: ""
};
