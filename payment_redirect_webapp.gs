/**
 * 前川こうき後援会サイト：申込記録 → Stripe決済ページへ直接転送
 *
 * 使い方
 * 1. Googleスプレッドシートを作成
 * 2. 拡張機能 > Apps Script にこのコードを貼り付け
 * 3. 下の SPREADSHEET_ID と STRIPE_LINKS を設定
 * 4. デプロイ > 新しいデプロイ > ウェブアプリ
 *    - 実行ユーザー：自分
 *    - アクセスできるユーザー：全員
 * 5. 発行された WebアプリURL を config.js の APPS_SCRIPT_URL に貼る
 */

const SPREADSHEET_ID = 'ここにスプレッドシートIDを貼り付け';
const SHEET_NAME = '申込記録';

const STRIPE_LINKS = {
  donate_once: 'ここにStripe寄付_今回のみ_URL',
  donate_monthly500: 'ここにStripe寄付_毎月500円_URL',
  party_member_yearly: 'ここにStripe党員_年額4000円_URL',
  party_supporter_yearly: 'ここにStripeサポーター_年額2000円_URL'
};

function doPost(e) {
  // Stripe Webhook用。必要な場合のみ利用。
  if (e && e.parameter && e.parameter.route === 'stripe_webhook') {
    return handleStripeWebhook_(e);
  }

  const p = (e && e.parameter) ? e.parameter : {};
  const rowId = makeRowId_();
  const now = new Date();
  const formType = p.form_type || '';

  const paymentKind = decidePaymentKind_(p);
  const stripeBaseUrl = STRIPE_LINKS[paymentKind] || '';

  const record = {
    rowId,
    timestamp: now,
    status: stripeBaseUrl ? 'Stripe画面へ遷移' : 'Stripe URL未設定',
    formType,
    paymentKind,
    name: p.name || '',
    kana: p.kana || '',
    email: p.email || '',
    phone: p.phone || '',
    address: p.address || '',
    birthdate: p.birthdate || '',
    occupation: p.occupation || '',
    nationalityConfirm: p.nationality_confirm || p.party_nationality_confirm || p.full_confirm || '',
    ageConfirm: p.age_confirm || '',
    donateKind: p.donate_kind || '',
    partyKind: p.party_kind || '',
    memo: p.memo || '',
    userAgent: (e && e.postData && e.postData.name) ? e.postData.name : ''
  };

  appendRecord_(record);

  if (!stripeBaseUrl) {
    return HtmlService.createHtmlOutput(errorHtml_('Stripe決済URLが未設定です。管理者が config.js と Apps Script の STRIPE_LINKS を設定してください。'));
  }

  const stripeUrl = addStripeParams_(stripeBaseUrl, rowId, p.email || '');
  return HtmlService.createHtmlOutput(redirectHtml_(stripeUrl));
}

function decidePaymentKind_(p) {
  if (p.form_type === 'donate') return p.payment_kind || 'donate_once';
  if (p.form_type === 'party') return p.payment_kind || 'party_supporter_yearly';
  if (p.form_type === 'full') return p.donate_kind || 'donate_once';
  return p.payment_kind || p.donate_kind || p.party_kind || 'donate_once';
}

function appendRecord_(r) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  const headers = [
    '受付ID','受付日時','ステータス','申込種別','決済種別',
    '氏名','ふりがな','メール','電話','住所','生年月日','職業',
    '国籍確認等','年齢確認','寄付区分','党員サポ区分','備考','Stripe Session ID','Stripe Payment Status','Stripe Customer Email','更新日時'
  ];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    r.rowId, r.timestamp, r.status, r.formType, r.paymentKind,
    r.name, r.kana, r.email, r.phone, r.address, r.birthdate, r.occupation,
    r.nationalityConfirm, r.ageConfirm, r.donateKind, r.partyKind, r.memo,
    '', '', '', ''
  ]);
}

function addStripeParams_(baseUrl, rowId, email) {
  const sep = baseUrl.indexOf('?') >= 0 ? '&' : '?';
  const params = [
    'client_reference_id=' + encodeURIComponent(rowId)
  ];
  if (email) params.push('prefilled_email=' + encodeURIComponent(email));
  return baseUrl + sep + params.join('&');
}

function makeRowId_() {
  return 'MK-' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd-HHmmss') + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function redirectHtml_(url) {
  const safe = String(url).replace(/"/g, '&quot;');
  return '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Stripe決済へ移動中</title></head><body style="font-family:sans-serif;background:#060d1f;color:#fff;text-align:center;padding:48px 18px">' +
    '<h1>Stripe決済ページへ移動します</h1><p>自動で移動しない場合は下のボタンを押してください。</p>' +
    '<p><a style="display:inline-block;background:#ffd400;color:#0a1732;padding:14px 24px;border-radius:999px;font-weight:bold;text-decoration:none" href="' + safe + '">決済ページへ進む</a></p>' +
    '<script>location.replace("' + safe + '");</' + 'script></body></html>';
}

function errorHtml_(message) {
  return '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;background:#060d1f;color:#fff;padding:40px 18px"><h1>設定エラー</h1><p>' + message + '</p><p><a href="javascript:history.back()" style="color:#ffd400">戻る</a></p></body></html>';
}

/**
 * 任意：Stripe Webhookで支払い完了をスプレッドシートに反映する場合。
 * Stripe Dashboard > Developers > Webhooks に
 * https://script.google.com/macros/s/xxxxx/exec?route=stripe_webhook
 * を登録し、checkout.session.completed を送る。
 *
 * 本番では署名検証を入れることを推奨します。
 */
function handleStripeWebhook_(e) {
  const payload = e.postData && e.postData.contents ? e.postData.contents : '{}';
  const event = JSON.parse(payload);
  if (event.type !== 'checkout.session.completed') {
    return ContentService.createTextOutput('ignored');
  }

  const session = event.data.object;
  const rowId = session.client_reference_id || '';
  if (!rowId) return ContentService.createTextOutput('no client_reference_id');

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return ContentService.createTextOutput('sheet not found');

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === rowId) {
      const row = i + 1;
      sheet.getRange(row, 3).setValue('決済完了');
      sheet.getRange(row, 18).setValue(session.id || '');
      sheet.getRange(row, 19).setValue(session.payment_status || '');
      sheet.getRange(row, 20).setValue(session.customer_details && session.customer_details.email ? session.customer_details.email : '');
      sheet.getRange(row, 21).setValue(new Date());
      break;
    }
  }
  return ContentService.createTextOutput('ok');
}
