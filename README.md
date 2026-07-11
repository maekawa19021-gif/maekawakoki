# 前川こうき後援会サイト 修正版

## 今回の修正（PCで失敗しない方式）

- 正しいApps ScriptウェブアプリURLから、市政レポートをサイト内カードとして表示します。
- 通常表示と代替表示の2経路を用意し、一方が遮断された場合は自動的に切り替えます。
- Googleドライブのフォルダ画面自体は埋め込まないため、白いGoogleドライブのエラー画面を避けられます。
- Googleドライブで一時的な取得エラーが起きた場合は、最後に正常取得した一覧を表示します。
- スマホの顔写真位置調整も維持しています。

## 上書き

GitHub側は、`index.html` と `config.js` の2ファイルを上書きしてください。
一式で上書きする場合は、ZIP内の同名ファイルをそのまま上書きして構いません。

Apps Script側も、必ず同梱の `payment_redirect_webapp.gs` に差し替えてください。
「デプロイを管理」から既存のウェブアプリを編集し、新バージョンで再デプロイします。
実行ユーザーは「自分」、アクセスできるユーザーは「全員」にしてください。
既存デプロイを更新するため、`/exec` URLは変わりません。

## config.js の注意

`APPS_SCRIPT_URL` にはGoogleドライブのURLではなく、Apps ScriptのウェブアプリURLを入れてください。
必ず `/exec` で終わる本番URLにしてください。

今回の完成版には、次のウェブアプリURLを設定済みです。

`https://script.google.com/macros/s/AKfycbwchzlQJe4SoLjkMiw0q6u_UF1zYGfH5mAX7GtAyeJJnInvGQHnjFlT_0cWHVe46R3OiA/exec`

GoogleドライブのURLやApps ScriptライブラリURLが誤って設定された場合は、
白いGoogleドライブのエラー画面を埋め込まず、設定エラーとして停止します。
