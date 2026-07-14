# 高松市議会へのご意見フォーム 実装版

## 追加した内容

- トップページのメニューに「市議会へのご意見」を追加
- 「前川こうきを応援する」欄の先頭に、横幅いっぱいの案内カードを追加
- `council.html` を新規作成し、Googleフォームをサイト内に埋め込み
- フォームが表示できない場合の「別画面で開く」リンクを追加
- `privacy.html` に、市政相談・議会質問等への利用目的を追記
- フォームURLは `config.js` で一元管理

## 設定手順

### 1. Googleフォームを作成する

`takamatsu_city_council_supporters_form.gs` をGoogle Apps Scriptへ貼り付け、`setupForm()` を1回実行してください。

実行後、次の3つが作成されます。

- 回答者用Googleフォーム
- 回答保存用スプレッドシート
- フォーム送信時に `maekawa19021@gmail.com` へ通知するトリガー

作成完了メール、実行ログ、またはスプレッドシートの「管理情報」シートから、**回答者用フォームURL**を確認します。

### 2. config.js にフォームURLを設定する

`config.js` の次の行へ、回答者用フォームURLを貼り付けます。

```js
FORM_URLS: {
  council: "ここに回答者用フォームURLを貼り付ける",
```

例：

```js
council: "https://docs.google.com/forms/d/e/xxxxxxxxxxxxxxxx/viewform",
```

`embedded=true` は自動で付与されるため、URLへ手作業で追加する必要はありません。

### 3. GitHubへ上書きする

同梱ファイルを、ホームページのリポジトリ直下へ上書き・追加してください。

特に必要なファイルは次の4つです。

- `index.html`（上書き）
- `config.js`（上書き。ただし既存のURL設定を消さないよう注意）
- `privacy.html`（上書き）
- `council.html`（新規追加）

`takamatsu_city_council_supporters_form.gs` はGitHubで動かすファイルではありません。Google Apps Scriptへ貼り付けるための保管用です。

## 表示確認

公開後、次を確認してください。

1. トップメニューの「市議会へのご意見」が開く
2. トップページの青色カードから `council.html` が開く
3. Googleフォームがページ内に表示される
4. フォーム送信後、回答がスプレッドシートへ保存される
5. `maekawa19021@gmail.com` に通知メールが届く

## 注意

- `config.js` の `APPS_SCRIPT_URL` は、既存の寄付・市政レポート用設定です。今回のGoogleフォームURLをここへ入れないでください。
- 今回のフォームURLは、必ず `FORM_URLS.council` へ設定してください。
- Googleフォームをまだ作成していない場合、`council.html` には準備中メッセージが表示されます。
