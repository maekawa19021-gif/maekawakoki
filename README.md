# 前川こうき後援会 公式サイト（運用手順書）

3D背景（Three.js）付きの静的サイト一式です。**このフォルダの中身をそのままGitHub Pagesに置けば公開できます。**

## フォルダ構成

| ファイル | 役割 |
|---|---|
| index.html | トップページ（3D背景・全セクション） |
| join.html / donate.html / party.html / full.html | ①入会 ②寄付 ③党員・サポーター ④まとめて申込 の各フォームページ |
| **config.js** | ★フォームURL・LINE URLの設定ファイル（通常の更新はここだけ） |
| privacy.html | プライバシーポリシー（公開前に内容をご確認ください） |
| assets/ | 写真（webp）・favicon・OGP画像・three.min.js |
| .nojekyll | GitHub Pages用のおまじない（削除しない） |

## 1. 公開手順（GitHub Pages・約10分）

1. https://github.com にログイン
2. 右上の「＋」→「New repository」→ Repository name に `maekawa-kouki-site` → **Public** のまま →「Create repository」
3. 「uploading an existing file」（または Add file → Upload files）→ **このフォルダの中身を全部**ドラッグ＆ドロップ →「Commit changes」
4. リポジトリの Settings → 左メニュー Pages → Build and deployment の Source を「**Deploy from a branch**」、Branch を「**main / (root)**」にして Save
5. 1〜3分待つと同じ画面の上部に公開URLが表示されます  
   例：`https://ユーザー名.github.io/maekawa-kouki-site/`

※ Publicリポジトリ＝HTMLのソースは誰でも閲覧できますが、サイト自体が公開物なので問題ありません。メールアドレス等の秘密情報は含まれていません。

## 2. フォームURLの設定（config.js）

1. Apps Script（create_forms_v2.gs）の `createAllForms` 実行後、ログに出る各フォームの「**回答用URL**」（`https://docs.google.com/forms/d/e/～/viewform`）をコピー
2. `config.js` を開き、①→join、②→donate、③→party、④→full の `""` の中に貼り付け
3. GitHub上で編集する場合：リポジトリで config.js を開く → 鉛筆アイコン → 編集 → Commit changes（数分で反映）

URLが空のあいだ、各ページには「フォームは現在準備中です」と表示されます（サイト自体は先に公開してOK）。

## 3. 公式LINEの設定

`config.js` の `LINE_URL` に友だち追加URL（https://lin.ee/～）を貼ると、トップのLINEカードが有効になります。未設定のあいだは自動で非表示です。

## 4. 更新方法

- 文章・写真の変更：該当ファイルを編集して再アップロード（同名で上書き）
- 活動報告（NEWS）：index.html 内の news-card 3件のテキストと assets/news1〜3.webp を差し替え
- 反映まで数分かかります。変わらない場合はスーパーリロード（Ctrl+Shift+R）

## 5. よくある調整

- **フォームの下に余白が出る／途中で切れる**：各フォームページ末尾のスクリプト内 `H=3000` などの数値（iframeの高さpx）を調整
- **OGP画像**：公開URL確定後、index.html の `og:image` を `https://～/assets/ogp.jpg` のフルURLに書き換えるとSNSシェア時に画像が確実に出ます

## 6. 独自ドメイン（任意・後日）

お名前.com等で取得 → DNSでCNAMEを `ユーザー名.github.io` に向ける → リポジトリの Settings → Pages → Custom domain に入力。詳細は必要になったタイミングでご相談ください。
