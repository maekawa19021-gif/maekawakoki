# 市議会へのご意見フォーム実装版

この一式は、2026年7月14日時点の最新 `index.html`
（build-version: `20260714-x-above-reports-latest`）を基に更新しています。

## 維持している最新機能

- 活動報告のXを市政レポートの上側に配置
- Xタイムライン再読み込み・代替表示
- 市政レポートのJSONP＋HTML代替表示
- 最新のお問い合わせフォーム
- 電話番号必須
- Google Apps Scriptへの送信機能

## 今回追加した内容

- トップメニューに「市議会へのご意見」を追加
- 市政レポート直後に案内セクションを追加
- `council.html` にGoogleフォームを埋め込み
- フッターメニューに「市議会へのご意見」を追加
- プライバシーポリシーに市政相談・議会質問等の利用目的を追加
- 修正版のGoogleフォーム作成用Apps Scriptを同梱

## 1. Googleフォームを作成する

`takamatsu_city_council_supporters_form.gs` をGoogle Apps Scriptへ貼り付け、
`setupForm()` を実行してください。

すでに作成済みの場合は、`showFormUrls()` を実行すると、
回答者用フォームURLを実行ログで再確認できます。

通知先は次のメールアドレスです。

`maekawa19021@gmail.com`

## 2. config.jsへフォームURLを設定する

`config.js` の次の箇所に、回答者用フォームURLを貼り付けます。

```javascript
FORM_URLS: {
  council: "https://docs.google.com/forms/d/e/フォームID/viewform",
  join: "..."
}
```

フォーム編集用URLではなく、回答者用の `/viewform` URLを使用してください。

## 3. GitHubへアップロードする

次の4ファイルをサイトのルートへアップロードします。

- `index.html`：上書き
- `config.js`：上書き
- `privacy.html`：上書き
- `council.html`：新規追加

`assets`フォルダやその他のページは変更不要です。

## 4. 公開後の確認

- トップメニューに「市議会へのご意見」がある
- 市政レポートの下に意見受付の案内がある
- `council.html`でGoogleフォームが表示される
- フォーム送信後、`maekawa19021@gmail.com`へ通知される
- 回答がスプレッドシートに記録される

## キャッシュについて

今回のファイルは `config.js?v=20260714-council-form` を読み込みます。
GitHub Pages反映後も古い表示が残る場合は、ページを再読み込みしてください。
