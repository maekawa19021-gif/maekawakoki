/**
 * 前川こうき後援会サイト
 * 申込内容をスプレッドシートに記録 → Stripe決済ボタンを表示
 *
 * 修正版：
 * - Stripeへ自動遷移しない
 * - 申込記録後に「決済ページへ進む」ボタンを表示
 * - Stripe URLには余計なパラメータを付けない
 * - 寄付ページは、寄付方法・国籍確認・電話番号・生年月日をサーバー側でも確認
 */

const SPREADSHEET_ID = '1DgdHACsadw9GUZlxY3F183xlaFtyDoCY0DFZzsZbxiA';

const STRIPE_LINKS = {
  // 寄付金 単発
  donate_once: 'https://buy.stripe.com/5kQ00lfze8cv4Q48ggbAs01',

  // 寄付金 サブスク
  donate_monthly500: 'https://donate.stripe.com/8x214pcn20K34Q4fIIbAs02',

  // 党員
  party_member_yearly: 'https://donate.stripe.com/aFa3cxgDi9gz5U8fIIbAs00',

  // サポーター
  party_supporter_yearly: 'https://buy.stripe.com/7sYbJ33QwakD2HW400bAs03'
};

const HEADERS = [
  '受付ID',
  '受付日時',
  'ステータス',
  '申込種別',
  '決済種別',
  '氏名',
  'ふりがな',
  'メール',
  '電話',
  '住所',
  '生年月日',
  '職業',
  '国籍確認等',
  '年齢確認',
  '寄付区分',
  '党員サポ区分',
  '備考',
  'Stripe Session ID',
  'Stripe Payment Status',
  'Stripe Customer Email',
  '更新日時'
];

function doPost(e) {
  const p = e && e.parameter ? e.parameter : {};

  const formType = p.form_type || '';
  const rowId = makeRowId_();
  const now = new Date();

  const validationError = validateInput_(p, formType);
  if (validationError) {
    return HtmlService.createHtmlOutput(errorHtml_(validationError));
  }

  const paymentKind = decidePaymentKind_(p);

  const record = {
    rowId,
    timestamp: now,
    status: '申込記録済み・決済待ち',
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

  // 寄付＋党サポの場合は、2つの決済ボタンを表示
  if (formType === 'full') {
    const donateKind = p.donate_kind || 'donate_once';
    const partyKind = p.party_kind || 'party_supporter_yearly';

    const donateUrl = STRIPE_LINKS[donateKind] || '';
    const partyUrl = STRIPE_LINKS[partyKind] || '';

    if (!donateUrl || !partyUrl) {
      return HtmlService.createHtmlOutput(
        errorHtml_('寄付または党員・サポーターのStripe決済URLが未設定です。Apps Scriptの STRIPE_LINKS を確認してください。')
      );
    }

    return HtmlService.createHtmlOutput(fullPaymentButtonHtml_(donateUrl, partyUrl, rowId));
  }

  // 寄付・党員サポ単体の場合
  const stripeUrl = STRIPE_LINKS[paymentKind] || '';

  if (!stripeUrl) {
    return HtmlService.createHtmlOutput(
      errorHtml_('Stripe決済URLが未設定です。Apps Scriptの STRIPE_LINKS を確認してください。')
    );
  }

  return HtmlService.createHtmlOutput(paymentButtonHtml_(stripeUrl, rowId));
}

function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<!doctype html>' +
    '<html>' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '</head>' +
    '<body style="font-family:sans-serif;background:#060d1f;color:#fff;padding:40px 18px;line-height:1.8">' +
    '<h1>前川こうき後援会 申込記録システム</h1>' +
    '<p>このURLは、申込フォームから送信された内容を記録し、Stripe決済ページをご案内するためのものです。</p>' +
    '</body>' +
    '</html>'
  );
}

function decidePaymentKind_(p) {
  if (p.form_type === 'donate') {
    return p.payment_kind || 'donate_once';
  }

  if (p.form_type === 'party') {
    return p.payment_kind || 'party_supporter_yearly';
  }

  if (p.form_type === 'full') {
    return (p.donate_kind || 'donate_once') + ' + ' + (p.party_kind || 'party_supporter_yearly');
  }

  return p.payment_kind || p.donate_kind || p.party_kind || 'donate_once';
}

function validateInput_(p, formType) {
  if (formType === 'donate') {
    if (!p.payment_kind) {
      return '寄付方法を選択してください。';
    }

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
    r.rowId,
    r.timestamp,
    r.status,
    r.formType,
    r.paymentKind,
    r.name,
    r.kana,
    r.email,
    r.phone,
    r.address,
    r.birthdate,
    r.occupation,
    r.nationalityConfirm,
    r.ageConfirm,
    r.donateKind,
    r.partyKind,
    r.memo,
    '',
    '',
    '',
    ''
  ]);
}

function getWritableSheet_(ss, baseName) {
  let sheet = ss.getSheetByName(baseName);

  // 既存のGoogleフォーム回答タブを壊さないようにする
  if (sheet && sheet.getLastRow() > 0) {
    const firstCell = String(sheet.getRange(1, 1).getValue() || '');

    if (firstCell !== HEADERS[0]) {
      const directName = baseName + '_直接決済';
      sheet = ss.getSheetByName(directName) || ss.insertSheet(directName);
    }
  }

  if (!sheet) {
    sheet = ss.insertSheet(baseName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function makeRowId_() {
  return 'MK-' +
    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd-HHmmss') +
    '-' +
    Math.random().toString(36).slice(2, 8).toUpperCase();
}

function paymentButtonHtml_(url, rowId) {
  const safe = escapeHtmlAttr_(url);
  const id = escapeHtmlText_(rowId);

  return '<!doctype html>' +
    '<html>' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>決済ページへ進む</title>' +
    '</head>' +
    '<body style="font-family:sans-serif;background:#060d1f;color:#fff;text-align:center;padding:48px 18px;line-height:1.8">' +
    '<div style="max-width:720px;margin:0 auto;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:30px">' +
    '<h1>申込内容を記録しました</h1>' +
    '<p>受付ID：<b>' + id + '</b></p>' +
    '<p>下のボタンからStripe決済ページへお進みください。</p>' +
    '<p style="margin-top:26px">' +
    '<a style="display:inline-block;background:#ffd400;color:#0a1732;padding:15px 30px;border-radius:999px;font-weight:bold;text-decoration:none" href="' + safe + '" target="_blank" rel="noopener">' +
    '決済ページへ進む' +
    '</a>' +
    '</p>' +
    '<p style="color:#b9c7e6;font-size:13px;margin-top:22px">カード情報はStripeが直接取り扱います。</p>' +
    '</div>' +
    '</body>' +
    '</html>';
}

function fullPaymentButtonHtml_(donateUrl, partyUrl, rowId) {
  const d = escapeHtmlAttr_(donateUrl);
  const p = escapeHtmlAttr_(partyUrl);
  const id = escapeHtmlText_(rowId);

  return '<!doctype html>' +
    '<html>' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>決済ページへ進む</title>' +
    '</head>' +
    '<body style="font-family:sans-serif;background:#060d1f;color:#fff;text-align:center;padding:48px 18px;line-height:1.8">' +
    '<div style="max-width:760px;margin:0 auto;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:30px">' +
    '<h1>申込内容を記録しました</h1>' +
    '<p>受付ID：<b>' + id + '</b></p>' +
    '<p>寄付と党員・サポーターは、決済種別が異なるため、下の2つのボタンからそれぞれ決済してください。</p>' +
    '<p style="margin-top:26px">' +
    '<a style="display:inline-block;min-width:260px;background:#ffd400;color:#0a1732;padding:14px 24px;border-radius:999px;font-weight:bold;text-decoration:none;margin:8px" href="' + d + '" target="_blank" rel="noopener">' +
    '① 寄付の決済へ進む' +
    '</a>' +
    '</p>' +
    '<p>' +
    '<a style="display:inline-block;min-width:260px;background:#fff;color:#0a1732;padding:14px 24px;border-radius:999px;font-weight:bold;text-decoration:none;margin:8px" href="' + p + '" target="_blank" rel="noopener">' +
    '② 党員・サポーター会費の決済へ進む' +
    '</a>' +
    '</p>' +
    '<p style="color:#b9c7e6;font-size:13px;margin-top:22px">カード情報はStripeが直接取り扱います。</p>' +
    '</div>' +
    '</body>' +
    '</html>';
}

function errorHtml_(message) {
  const msg = escapeHtmlText_(message);

  return '<!doctype html>' +
    '<html>' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>エラー</title>' +
    '</head>' +
    '<body style="font-family:sans-serif;background:#060d1f;color:#fff;padding:40px 18px;line-height:1.8">' +
    '<div style="max-width:720px;margin:0 auto;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:30px">' +
    '<h1>入力内容をご確認ください</h1>' +
    '<p>' + msg + '</p>' +
    '<p><a href="javascript:history.back()" style="color:#ffd400">入力画面に戻る</a></p>' +
    '</div>' +
    '</body>' +
    '</html>';
}

function escapeHtmlAttr_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
