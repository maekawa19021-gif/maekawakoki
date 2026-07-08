/* ============================================================
   サイト設定ファイル（書き換えるのは基本ここだけ）
   ------------------------------------------------------------
   FORM_URLS : Apps Script（create_forms_v2.gs）実行後のログに出る
               各フォームの「回答用URL」
               （https://docs.google.com/forms/d/e/～/viewform）を
               "" の中に貼り付けてください。
               ※「?embedded=true」は付けないでください（自動で付きます）
   LINE_URL  : 公式LINEの友だち追加URL（https://lin.ee/～）。
               未設定のあいだ、LINEカードは自動的に非表示になります。
   ============================================================ */
window.SITE_CONFIG = {
  FORM_URLS: {
    join:   "https://docs.google.com/forms/d/e/1FAIpQLSeNnKNgI4qroVGcVkSkW5tWOzl1apavfZZl_tQ3hisZEm9PGw/viewform",  // ①後援会入会
    donate: "https://docs.google.com/forms/d/e/1FAIpQLSdyDJyTaezU7b_PqQR0XcVhfqKxeFmZRfVica63v79JmROGQg/viewform",  // ②寄付
    party:  "https://docs.google.com/forms/d/e/1FAIpQLSfzzAo9KygE25iVTE4yMJdlQ1Pb_zcCGZyrTuJq28AGYSih3w/viewform",  // ③党員・サポーター
    full:   "https://docs.google.com/forms/d/e/1FAIpQLSeQaoYPuZS6UmKGlCgZ-AdvGf4NwdEdawXYFYTCGvx8PQrblg/viewform"   // ④寄付＋党員・サポーター
  },
  LINE_URL: ""
};
