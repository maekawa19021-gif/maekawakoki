# メールを使わず、入力後すぐStripe決済へ進む方式

## 仕組み

1. サイト上の独自フォームに入力
2. Apps Script WebアプリにPOST
3. Apps Scriptがスプレッドシートへ1行追加
4. 受付IDを `client_reference_id` としてStripe Payment Linkへ付与
5. そのままStripe決済ページへ自動転送

これにより、自動返信メールが迷惑メールに入る問題を回避できます。

## アップロードするファイル

- `config_direct_payment.js` → `config.js` にリネームして上書き
- `donate_direct.html` → `donate.html` にリネームして上書き
- `party_direct.html` → `party.html` にリネームして上書き
- `full_direct.html` → `full.html` にリネームして上書き
- `payment_redirect_webapp.gs` → Google Apps Scriptに貼り付け

## Stripe側で作るPayment Links

### 寄付・今回のみ
Stripe Payment Linksで「Customers choose what to pay（支払者が金額を入力）」を選ぶ。

### 寄付・毎月継続
月額500円の商品を作り、Payment Linkで数量調整を許可する。

### 党員・サポーター
- 党員：年額4,000円の定期支払い商品
- サポーター：年額2,000円の定期支払い商品

## Apps Script設定

1. Googleスプレッドシートを作成
2. 拡張機能 > Apps Script
3. `payment_redirect_webapp.gs` の内容を貼り付け
4. `SPREADSHEET_ID` を設定
5. `STRIPE_LINKS` にStripe Payment Link URLを設定
6. デプロイ > 新しいデプロイ > ウェブアプリ
7. 実行ユーザー：自分
8. アクセスできるユーザー：全員
9. 発行URLを `config.js` の `APPS_SCRIPT_URL` に貼る

## 支払い完了まで自動反映したい場合

Stripe Webhookを使います。

Webhook URL：
`https://script.google.com/macros/s/xxxxx/exec?route=stripe_webhook`

イベント：
`checkout.session.completed`

Payment LinkにはApps Scriptが自動で `client_reference_id=受付ID` を付与するため、Webhookで該当行を探して「決済完了」に更新できます。
