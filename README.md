# 前川こうき後援会 公式サイト（直接決済方式・更新版）

この一式は、寄付・党員サポ・寄付＋党サポについて、Googleフォームの自動返信メールを使わず、サイト内フォームからスプレッドシートへ記録し、そのままStripe決済へ進む方式です。

## 1. GitHubに上書きするファイル

ZIP内の次のファイルを、現在のサイトに同名で上書きしてください。

- index.html
- config.js
- join.html
- donate.html
- party.html
- full.html
- privacy.html
- README.md

画像や assets フォルダは、今のものをそのまま使います。

## 2. Apps Scriptに貼るファイル

- payment_redirect_webapp.gs

このファイルを、Googleスプレッドシートの「拡張機能 → Apps Script」に貼り付けてください。

スプレッドシートIDは設定済みです。

```js
const SPREADSHEET_ID = '1DgdHACsadw9GUZlxY3F183xlaFtyDoCY0DFZzsZbxiA';
```

## 3. あなたが変更する必要があるもの

### A. payment_redirect_webapp.gs 内のStripe URL 4つ

下の4つだけ、Stripeで作ったPayment Linkに差し替えてください。

```js
donate_once: 'ここにStripe寄付_今回のみ_URL',
donate_monthly500: 'ここにStripe寄付_毎月500円_URL',
party_member_yearly: 'ここにStripe党員_年額4000円_URL',
party_supporter_yearly: 'ここにStripeサポーター_年額2000円_URL'
```

### B. config.js 内の APPS_SCRIPT_URL

Apps Scriptをウェブアプリとしてデプロイした後、発行されたURLを貼ります。

```js
APPS_SCRIPT_URL: "ここにApps ScriptのウェブアプリURL"
```

## 4. Apps Scriptのデプロイ方法

1. Apps Script画面右上の「デプロイ」
2. 「新しいデプロイ」
3. 種類を「ウェブアプリ」
4. 実行ユーザー：自分
5. アクセスできるユーザー：全員
6. デプロイ
7. 発行されたURLを config.js の APPS_SCRIPT_URL に貼る

## 5. スプレッドシートへの記録先

既存のGoogleフォーム回答タブを壊さないため、列形式が違う場合は自動的に次のタブへ記録します。

- ②寄付_直接決済
- ③党員・サポーター_直接決済
- ④寄付＋党サポ_直接決済

既存タブが直接決済用のヘッダー形式なら、そのまま ②寄付 / ③党員・サポーター / ④寄付＋党サポ に記録します。

## 6. 後援会入会だけは従来通り

後援会入会だけは無料で決済がないため、従来のGoogleフォームを使います。



## Stripe支払いURL（設定済み）

`payment_redirect_webapp.gs` には、以下のStripe支払いURLを設定済みです。

- サポーター: https://buy.stripe.com/7sYbJ33QwakD2HW400bAs03
- 党員: https://donate.stripe.com/aFa3cxgDi9gz5U8fIIbAs00
- 寄付金 サブスク: https://donate.stripe.com/8x214pcn20K34Q4fIIbAs02
- 寄付金 単発: https://buy.stripe.com/5kQ00lfze8cv4Q48ggbAs01

## まだ必要な作業

1. `payment_redirect_webapp.gs` をGoogle Apps Scriptに貼り付ける
2. Apps Scriptをウェブアプリとしてデプロイする
3. 発行されたウェブアプリURLを `config.js` の `APPS_SCRIPT_URL` に貼り付ける
4. GitHubに `config.js` を上書きする
