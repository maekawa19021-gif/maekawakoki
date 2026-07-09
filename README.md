# 前川こうき後援会サイト 修正版一式

## 今回の主な変更

- 寄付ページの「寄付方法」を、国籍確認と同じく初期値なしの選択式に変更
  - 初期表示：選択してください
  - 選択肢：今回のみ（金額自由）／毎月継続（500円×口数）
- 寄付方法が未選択の場合、送信できないように変更
- Apps Script側でも、寄付方法未選択を拒否するチェックを追加
- Stripeへ自動遷移せず、申込記録後に「決済ページへ進む」ボタンを表示する方式を維持
- トップページの顔写真補正は自然な状態に戻した版を使用
- 「お申し込みの流れ」は各申込ページから削除済み

## GitHubに上書きするファイル

以下のファイルを、GitHub上の同名ファイルに上書きしてください。

- index.html
- config.js
- join.html
- donate.html
- party.html
- full.html
- privacy.html
- README.md

## Apps Scriptに上書きするファイル

- payment_redirect_webapp.gs

上書き後、Apps Scriptで必ず再デプロイしてください。

手順：

1. Apps Scriptを開く
2. `payment_redirect_webapp.gs` の内容を全上書き
3. デプロイ
4. デプロイを管理
5. 鉛筆マーク
6. バージョン：新バージョン
7. デプロイ

## 前川さん側で変更が必要なもの

### 1. config.js の APPS_SCRIPT_URL

このZIPでは、Apps ScriptのURLは空欄です。
既に発行済みのウェブアプリURLを、以下に貼ってください。

```js
APPS_SCRIPT_URL: "ここにApps ScriptのウェブアプリURL",
```

ここが空欄のままだと、寄付・党員サポ・寄付＋党サポの送信ボタンは動きません。

### 2. payment_redirect_webapp.gs の再デプロイ

今回、Apps Script側に「寄付方法が未選択の場合は拒否する」チェックを追加しています。
そのため、`payment_redirect_webapp.gs` を更新した場合は再デプロイが必要です。

## 設定済みの内容

### スプレッドシートID

```js
const SPREADSHEET_ID = '1DgdHACsadw9GUZlxY3F183xlaFtyDoCY0DFZzsZbxiA';
```

### Stripe URL

```js
// 寄付金 単発
https://buy.stripe.com/5kQ00lfze8cv4Q48ggbAs01

// 寄付金 サブスク
https://donate.stripe.com/8x214pcn20K34Q4fIIbAs02

// 党員
https://donate.stripe.com/aFa3cxgDi9gz5U8fIIbAs00

// サポーター
https://buy.stripe.com/7sYbJ33QwakD2HW400bAs03
```

## 動作確認

公開後、寄付ページで以下を確認してください。

1. 寄付方法が初期状態で「選択してください」になっている
2. 寄付方法を選ばず送信するとエラーになる
3. 国籍確認も初期状態で「選択してください」になっている
4. 生年月日が必須になっている
5. 電話番号がハイフンなし10〜11桁でチェックされる
6. 送信後、スプレッドシートに記録される
7. 「決済ページへ進む」ボタンが表示される
8. ボタンからStripe決済ページへ進める
