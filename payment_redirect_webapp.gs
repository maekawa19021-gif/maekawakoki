/**
 * 前川こうき後援会サイト：申込記録 → Stripe決済ページへ直接転送
 *
 * できること
 * - Googleフォームの自動返信メールに依存せず、入力後すぐStripe決済へ進める。
 * - 申込内容を既存スプレッドシートへ自動記録する。
 * - 寄付・党員サポ・寄付＋党サポをタブ別に記録する。
 *
 * 既に設定済み
 * - SPREADSHEET_ID は、前に作成した回答スプレッドシートを設定済み。
 *
 * あなたが変更する必要があるもの
 * - Stripe決済URLは設定済みです。
 * - このApps Scriptをウェブアプリとしてデプロイし、発行URLを config.js の APPS_SCRIPT_URL に貼ってください。
 */

const SPREADSHEET_ID = '1DgdHACsadw9GUZlxY3F183xlaFtyDoCY0DFZzsZbxiA';

const STRIPE_LINKS = {
  // ① 寄付・今回のみ：支払者が金額を入力できるStripe Payment Link推奨
  donate_once: 'https://buy.stripe.com/5kQ00lfze8cv4Q48ggbAs01',

  // ② 寄付・毎月継続：月額500円の商品を作り、数量調整ON推奨
  donate_monthly500: 'https://donate.stripe.com/8x214pcn20K34Q4fIIbAs02',

  // ③ 党員：年額4,000円・自動更新のStripe Payment Link
  party_member_yearly: 'https://donate.stripe.com/aFa3cxgDi9gz5U8fIIbAs00',

  // ④ サポーター：年額2,000円・自動更新のStripe Payment Link
  party_supporter_yearly: 'https://buy.stripe.com/7sYbJ33QwakD2HW400bAs03'
};

const HEADERS = [
  '受付ID','受付日時','ステータス','申込種別','決済種別',
  '氏名','ふりがな','メール','電話','住所','生年月日','職業',
  '国籍確認等','年齢確認','寄付区分','党員サポ区分','備考',
  'Stripe Session ID','Stripe Payment Status','Stripe Customer Email','更新日時'
];

function doPost(e) {
  if (e && e.parameter && e.parameter.route === 'stripe_webhook') {
    return handleStripeWebhook_(e);
  }

  const p = (e && e.parameter) ? e.parameter : {};
  const rowId = makeRowId_();
  const now = new Date();
  const formType = p.form_type || '';
  const paymentKind = decidePaymentKind_(p);
  const stripeBaseUrl = STRIPE_LINKS[paymentKind] || '';

  const validationError = validateInput_(p, formType);
  if (validationError) {
    return HtmlService.createHtmlOutput(errorHtml_(validationError));
  }

  const record = {
    rowId,
    timestamp: now,
    status: formType === 'full' ? '決済案内ページへ遷移' : (stripeBaseUrl ? 'Stripe画面へ遷移' : 'Stripe URL未設定'),
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
    donateKind: p.donate_kind || (formType === 'donate' ? p.payment_kind : ''),
    partyKind: p.party_kind || (formType === 'party' ? p.payment_kind : ''),
    memo: p.memo || ''
  };

  appendRecord_(record);

  if (formType === 'full') {
    const donateKind = p.donate_kind || 'donate_once';
    const partyKind = p.party_kind || 'party_supporter_yearly';
    const donateUrl = STRIPE_LINKS[donateKind] ? addStripeParams_(STRIPE_LINKS[donateKind], rowId + '-DONATE', p.email || '') : '';
    const partyUrl = STRIPE_LINKS[partyKind] ? addStripeParams_(STRIPE_LINKS[partyKind], rowId + '-PARTY', p.email || '') : '';
    if (!donateUrl || !partyUrl) {
      return HtmlService.createHtmlOutput(errorHtml_('寄付または党員・サポーターのStripe決済URLが未設定です。Apps Scriptの STRIPE_LINKS を確認してください。'));
    }
    return HtmlService.createHtmlOutput(fullPaymentHtml_(donateUrl, partyUrl, rowId));
  }

  if (!stripeBaseUrl) {
    return HtmlService.createHtmlOutput(errorHtml_('Stripe決済URLが未設定です。Apps Scriptの STRIPE_LINKS を確認してください。'));
  }

  const stripeUrl = addStripeParams_(stripeBaseUrl, rowId, p.email || '');
  return HtmlService.createHtmlOutput(redirectHtml_(stripeUrl));
}

function doGet(e) {
  return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;background:#060d1f;color:#fff;padding:40px 18px"><h1>前川こうき後援会 申込記録システム</h1><p>このURLは申込フォームから送信された内容を記録し、Stripe決済へ転送するためのものです。</p></body></html>');
}

function decidePaymentKind_(p) {
  if (p.form_type === 'donate') return p.payment_kind || 'donate_once';
  if (p.form_type === 'party') return p.payment_kind || 'party_supporter_yearly';
  if (p.form_type === 'full') return (p.donate_kind || 'donate_once') + ' + ' + (p.party_kind || 'party_supporter_yearly');
  return p.payment_kind || p.donate_kind || p.party_kind || 'donate_once';
}

function validateInput_(p, formType) {
  if (formType === 'donate') {
    if (p.nationality_confirm !== '日本国籍を有する個人です') {
      return '寄付のお申し込みには、日本国籍を有する個人であることの確認が必要です。';
    }
    if (!p.birthdate) {
      return '生年月日は必須です。';
    }
    const phone = String(p.phone || '').trim();
    if (!/^[0-9]{10,11}$/.test(phone)) {
      return '電話番号はハイフンなしの半角数字10〜11桁で入力してください。';
    }
  }
  return '';
}

function sheetNameFor_(formType) {
  if (formType === 'donate') return '②寄付';
  if (formType === 'party') return '③党員・サポーター';
  if (formType === 'full') return '④寄付＋党サポ';
  return '申込記録';
}

function appendRecord_(r) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getWritableSheet_(ss, sheetNameFor_(r.formType));
  sheet.appendRow([
    r.rowId, r.timestamp, r.status, r.formType, r.paymentKind,
    r.name, r.kana, r.email, r.phone, r.address, r.birthdate, r.occupation,
    r.nationalityConfirm, r.ageConfirm, r.donateKind, r.partyKind, r.memo,
    '', '', '', ''
  ]);
}

function getWritableSheet_(ss, baseName) {
  let sheet = ss.getSheetByName(baseName);

  // 既存のGoogleフォーム回答タブと列が違う場合は、壊さないように「_直接決済」タブへ記録する。
  if (sheet && sheet.getLastRow() > 0) {
    const firstCell = String(sheet.getRange(1, 1).getValue() || '');
    if (firstCell !== HEADERS[0]) {
      const directName = baseName + '_直接決済';
      sheet = ss.getSheetByName(directName) || ss.insertSheet(directName);
    }
  }

  if (!sheet) sheet = ss.insertSheet(baseName);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function addStripeParams_(baseUrl, refId, email) {
  const sep = baseUrl.indexOf('?') >= 0 ? '&' : '?';
  const params = ['client_reference_id=' + encodeURIComponent(refId)];
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

function fullPaymentHtml_(donateUrl, partyUrl, rowId) {
  const d = String(donateUrl).replace(/"/g, '&quot;');
  const p = String(partyUrl).replace(/"/g, '&quot;');
  const id = String(rowId).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>決済ページのご案内</title></head><body style="font-family:sans-serif;background:#060d1f;color:#fff;text-align:center;padding:48px 18px;line-height:1.8">' +
    '<div style="max-width:760px;margin:0 auto;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:30px">' +
    '<h1>申込内容を記録しました</h1><p>受付ID：<b>' + id + '</b></p>' +
    '<p>寄付と党員・サポーターは、決済種別が異なるため、下の2つのボタンからそれぞれ決済してください。</p>' +
    '<p><a style="display:inline-block;min-width:260px;background:#ffd400;color:#0a1732;padding:14px 24px;border-radius:999px;font-weight:bold;text-decoration:none;margin:8px" href="' + d + '" target="_blank" rel="noopener">① 寄付の決済へ進む</a></p>' +
    '<p><a style="display:inline-block;min-width:260px;background:#fff;color:#0a1732;padding:14px 24px;border-radius:999px;font-weight:bold;text-decoration:none;margin:8px" href="' + p + '" target="_blank" rel="noopener">② 党員・サポーター会費の決済へ進む</a></p>' +
    '<p style="color:#b9c7e6;font-size:13px">2つとも完了すると、申込と決済の確認がしやすくなります。カード情報はStripeが直接取り扱います。</p>' +
    '</div></body></html>';
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
 * 注意：本番で厳密に運用する場合は、Stripe署名検証を追加してください。
 */
function handleStripeWebhook_(e) {
  const payload = e.postData && e.postData.contents ? e.postData.contents : '{}';
  const event = JSON.parse(payload);
  if (event.type !== 'checkout.session.completed') {
    return ContentService.createTextOutput('ignored');
  }

  const session = event.data.object;
  const ref = session.client_reference_id || '';
  if (!ref) return ContentService.createTextOutput('no client_reference_id');

  const rowId = ref.replace(/-(DONATE|PARTY)$/, '');
  const label = ref.endsWith('-DONATE') ? '寄付決済完了' : (ref.endsWith('-PARTY') ? '党員サポ決済完了' : '決済完了');

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetNames = ['②寄付','②寄付_直接決済','③党員・サポーター','③党員・サポーター_直接決済','④寄付＋党サポ','④寄付＋党サポ_直接決済','申込記録'];

  for (const name of sheetNames) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) continue;
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === rowId) {
        const row = i + 1;
        const currentStatus = String(sheet.getRange(row, 3).getValue() || '');
        const currentSessionIds = String(sheet.getRange(row, 18).getValue() || '');
        const currentPaymentStatus = String(sheet.getRange(row, 19).getValue() || '');
        sheet.getRange(row, 3).setValue(currentStatus ? currentStatus + '／' + label : label);
        sheet.getRange(row, 18).setValue(currentSessionIds ? currentSessionIds + ' / ' + (session.id || '') : (session.id || ''));
        sheet.getRange(row, 19).setValue(currentPaymentStatus ? currentPaymentStatus + ' / ' + (session.payment_status || '') : (session.payment_status || ''));
        sheet.getRange(row, 20).setValue(session.customer_details && session.customer_details.email ? session.customer_details.email : '');
        sheet.getRange(row, 21).setValue(new Date());
        return ContentService.createTextOutput('ok');
      }
    }
  }
  return ContentService.createTextOutput('row not found');
}
