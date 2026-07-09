# 前川こうき後援会サイト 修正版

## 今回の修正

### 1. スマホのトップ顔写真
- 顔写真を前回より大きくしました。
- 右寄りに見えにくいよう、スマホ表示では中央寄せに近づけています。
- 配置は「国民民主党・高松市議会議員（2023年 最年少当選）」の下、「前川こうき」の上です。

### 2. PCの市政レポート表示
- PCでは、Googleドライブのレポート一覧を Apps Script の `reports_iframe` 経由で表示する方式に変更しました。
- JSONP読み込みがPCブラウザで失敗する場合でも、iframe経由で表示しやすくしています。
- Apps Script URL が `/dev` の場合は、PCでは表示されにくいため、画面に注意表示を出します。

## 上書きするファイル

GitHubには、同名ファイルを上書きしてください。

- index.html
- config.js
- join.html
- donate.html
- party.html
- full.html
- privacy.html
- README.md

Apps Scriptには、次を全上書きしてください。

- payment_redirect_webapp.gs

## 必ず行うこと

Apps Scriptを上書きした後、必ず新バージョンで再デプロイしてください。

1. Apps Scriptを開く
2. デプロイ
3. デプロイを管理
4. 鉛筆マーク
5. バージョン：新バージョン
6. デプロイ

設定は次にしてください。

- 実行するユーザー：自分
- アクセスできるユーザー：全員

## config.js の注意

`APPS_SCRIPT_URL` は必ず `/exec` で終わる本番URLを使ってください。

良い例：
`https://script.google.com/macros/s/xxxxx/exec`

避ける例：
`https://script.google.com/macros/s/xxxxx/dev`

`/dev` はテスト用URLで、PCなど別ブラウザではログイン状態や権限の影響で表示できないことがあります。
