# 前川こうき後援会サイト 修正版一式

## 今回の主な変更

- トップページの「プロフィール」より上に「議会・市政レポート」セクションを追加
- Googleドライブの指定フォルダから、PDF等を自動取得して表示
- 表紙サムネイルはGoogleドライブのサムネイルURLから自動表示
- 表示順は最新順
  - ファイル名に `2026-07`、`2026_07_09`、`2026年7月` などの日付がある場合は、その日付を優先
  - ファイル名に日付がない場合は、Googleドライブの更新日時で並び替え
- 寄付ページの「寄付方法」は、初期値なしの選択式を維持
- Stripeへ自動遷移せず、申込記録後に「決済ページへ進む」ボタンを表示する方式を維持
- トップページの顔写真補正は自然な状態を維持
- 「お申し込みの流れ」は各申込ページから削除済み

## Googleドライブの対象フォルダ

Apps Script内に、次のフォルダIDを設定済みです。

```js
const REPORTS_FOLDER_ID = '1qbjNrZAWsahY55UfFuyR3Rm5oIrKzfQ-';
```

元の共有URL：

```text
https://drive.google.com/drive/folders/1qbjNrZAWsahY55UfFuyR3Rm5oIrKzfQ-?usp=drive_link
```

## レポートの追加方法

Googleドライブの対象フォルダにPDFを入れるだけです。
サイト側はApps Script経由で自動取得します。

推奨ファイル名：

```text
2026-07_市政レポート_Vol1.pdf
2026-09_市政レポート_Vol2.pdf
2026年12月_議会レポート.pdf
```

このように年月を入れておくと、発行日順で最新から表示されます。

## 表紙サムネイルについて

PDFの表紙は、Googleドライブのサムネイル機能を使って自動表示します。
ただし、Google側の仕様や共有設定によって、サムネイルが表示されない場合があります。
その場合は、サイト上では代替表示として `CITY REPORT PDF` と表示されます。

## Googleドライブ共有設定

対象フォルダまたはPDFファイルは、原則として次の共有設定にしてください。

```text
リンクを知っている全員が閲覧可
```

Apps Scriptを実行するGoogleアカウントでも、対象フォルダを開ける必要があります。

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

ここが空欄のままだと、寄付・党員サポ・寄付＋党サポの送信ボタンだけでなく、市政レポートの自動表示も動きません。

### 2. payment_redirect_webapp.gs の再デプロイ

今回、Googleドライブから市政レポート一覧を取得する処理を追加しています。
そのため、`payment_redirect_webapp.gs` を更新した場合は再デプロイが必要です。

初回実行時には、Googleドライブへのアクセス許可を求められる場合があります。

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
