/**
 * 前川こうき後援会公式サイト
 * お問い合わせ受付システム
 *
 * 既存のGoogleスプレッドシートへ問い合わせ内容を記録します。
 */

const CONTACT_CONFIG = {
  SPREADSHEET_ID: '1gVs48cOKQ4oIIX0eMlXWugg1BEquc92DH_VJ8MDGDLg',
  SHEET_NAME: 'お問い合わせ',
  NOTIFICATION_EMAIL: 'maekawakoki.mton@gmail.com',
  SEND_NOTIFICATION_EMAIL: true,
  TIMEZONE: 'Asia/Tokyo',
  MAX_NAME_LENGTH: 80,
  MAX_EMAIL_LENGTH: 150,
  MAX_PHONE_LENGTH: 30,
  MAX_CATEGORY_LENGTH: 100,
  MAX_MESSAGE_LENGTH: 3000
};

const CONTACT_HEADERS = [
  '受付日時',
  '受付番号',
  'お名前',
  'メールアドレス',
  '電話番号',
  'お問い合わせ種別',
  'お問い合わせ内容',
  '個人情報同意',
  '送信元ページ',
  'User-Agent',
  '処理結果'
];

/**
 * 初回設定
 * 「お問い合わせ」シートと見出しを自動作成します。
 */
function setupContactSystem() {
  const spreadsheet = SpreadsheetApp.openById(
    CONTACT_CONFIG.SPREADSHEET_ID
  );

  const sheet = getOrCreateSheet_(spreadsheet);
  ensureHeaders_(sheet);
  formatSheet_(sheet);

  const result = {
    ok: true,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    message: 'お問い合わせ受付システムの初期設定が完了しました。'
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * ウェブアプリURLをブラウザで開いた際の確認用
 */
function doGet() {
  return jsonResponse_({
    ok: true,
    service: 'maekawa-contact-form',
    spreadsheetUrl:
      'https://docs.google.com/spreadsheets/d/' +
      CONTACT_CONFIG.SPREADSHEET_ID +
      '/edit',
    message: 'お問い合わせ受付APIは正常に動作しています。',
    timestamp: new Date().toISOString()
  });
}

/**
 * お問い合わせ受付
 */
function doPost(e) {
  let lock = null;

  try {
    const request = parseRequest_(e);

    // ハニーポット
    if (String(request.website || '').trim()) {
      return jsonResponse_({
        ok: true,
        message: '送信を受け付けました。'
      });
    }

    const data = validateAndNormalize_(request);
    checkRateLimit_(data.email);

    lock = LockService.getScriptLock();
    lock.waitLock(20000);

    const spreadsheet = SpreadsheetApp.openById(
      CONTACT_CONFIG.SPREADSHEET_ID
    );

    const sheet = getOrCreateSheet_(spreadsheet);
    ensureHeaders_(sheet);

    const now = new Date();
    const receiptNumber = createReceiptNumber_(now);

    sheet.appendRow([
      now,
      receiptNumber,
      data.name,
      data.email,
      data.phone,
      data.category,
      data.message,
      data.consent ? '同意済み' : '未同意',
      data.pageUrl,
      data.userAgent,
      '受付完了'
    ]);

    const row = sheet.getLastRow();
    sheet.getRange(row, 1).setNumberFormat(
      'yyyy/MM/dd HH:mm:ss'
    );
    sheet.getRange(row, 7).setWrap(true);
    sheet.getRange(row, 9, 1, 2).setWrap(true);

    if (CONTACT_CONFIG.SEND_NOTIFICATION_EMAIL) {
      sendNotification_(
        data,
        receiptNumber,
        now,
        spreadsheet.getUrl()
      );
    }

    return jsonResponse_({
      ok: true,
      receiptNumber: receiptNumber,
      message: 'お問い合わせを受け付けました。'
    });

  } catch (error) {
    console.error(error);

    return jsonResponse_({
      ok: false,
      message: publicErrorMessage_(error)
    });

  } finally {
    if (lock) {
      try {
        lock.releaseLock();
      } catch (ignore) {}
    }
  }
}

function getOrCreateSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(
    CONTACT_CONFIG.SHEET_NAME
  );

  if (!sheet) {
    sheet = spreadsheet.insertSheet(
      CONTACT_CONFIG.SHEET_NAME
    );
  }

  return sheet;
}

function ensureHeaders_(sheet) {
  const range = sheet.getRange(
    1,
    1,
    1,
    CONTACT_HEADERS.length
  );

  const current = range.getDisplayValues()[0];

  const needsHeaders =
    current.every(function(value) {
      return !String(value).trim();
    }) ||
    current.join('|') !== CONTACT_HEADERS.join('|');

  if (needsHeaders) {
    range
      .setValues([CONTACT_HEADERS])
      .setFontWeight('bold')
      .setBackground('#0a1732')
      .setFontColor('#ffffff')
      .setHorizontalAlignment('center');

    sheet.setFrozenRows(1);
  }
}

function formatSheet_(sheet) {
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 210);
  sheet.setColumnWidth(3, 160);
  sheet.setColumnWidth(4, 240);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 190);
  sheet.setColumnWidth(7, 520);
  sheet.setColumnWidth(8, 110);
  sheet.setColumnWidth(9, 320);
  sheet.setColumnWidth(10, 320);
  sheet.setColumnWidth(11, 110);

  sheet.getRange('A:K').setVerticalAlignment('top');
}

function parseRequest_(e) {
  if (!e) {
    throw new Error('EMPTY_REQUEST');
  }

  const contentType = String(
    e.postData && e.postData.type
      ? e.postData.type
      : ''
  ).toLowerCase();

  if (
    contentType.indexOf('application/json') !== -1 &&
    e.postData &&
    e.postData.contents
  ) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      throw new Error('INVALID_JSON');
    }
  }

  return Object.assign({}, e.parameter || {});
}

function validateAndNormalize_(request) {
  const data = {
    name: cleanText_(
      request.name,
      CONTACT_CONFIG.MAX_NAME_LENGTH
    ),
    email: cleanText_(
      request.email,
      CONTACT_CONFIG.MAX_EMAIL_LENGTH
    ),
    phone: cleanText_(
      request.phone,
      CONTACT_CONFIG.MAX_PHONE_LENGTH
    ),
    category: cleanText_(
      request.category,
      CONTACT_CONFIG.MAX_CATEGORY_LENGTH
    ),
    message: cleanMultilineText_(
      request.message,
      CONTACT_CONFIG.MAX_MESSAGE_LENGTH
    ),
    consent: parseBoolean_(request.consent),
    pageUrl: cleanText_(request.pageUrl, 500),
    userAgent: cleanText_(request.userAgent, 500)
  };

  if (!data.name) throw new Error('NAME_REQUIRED');
  if (!data.email) throw new Error('EMAIL_REQUIRED');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('EMAIL_INVALID');
  }

  if (!data.phone) throw new Error('PHONE_REQUIRED');
  if (!data.category) throw new Error('CATEGORY_REQUIRED');
  if (!data.message) throw new Error('MESSAGE_REQUIRED');
  if (!data.consent) throw new Error('CONSENT_REQUIRED');

  return data;
}

function checkRateLimit_(email) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    email.toLowerCase()
  );

  const key = 'contact_' + digest.map(function(byte) {
    const value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('').slice(0, 32);

  const cache = CacheService.getScriptCache();

  if (cache.get(key)) {
    throw new Error('RATE_LIMIT');
  }

  cache.put(key, '1', 30);
}

function sendNotification_(
  data,
  receiptNumber,
  receivedAt,
  spreadsheetUrl
) {
  const subject =
    '【HPお問い合わせ】' +
    data.category +
    '／' +
    data.name +
    ' 様';

  const body = [
    '公式サイトからお問い合わせが届きました。',
    '',
    '受付番号：' + receiptNumber,
    '受付日時：' + Utilities.formatDate(
      receivedAt,
      CONTACT_CONFIG.TIMEZONE,
      'yyyy/MM/dd HH:mm:ss'
    ),
    '',
    '■ お名前',
    data.name,
    '',
    '■ メールアドレス',
    data.email,
    '',
    '■ 電話番号',
    data.phone || '未入力',
    '',
    '■ お問い合わせ種別',
    data.category,
    '',
    '■ お問い合わせ内容',
    data.message,
    '',
    '■ 送信元ページ',
    data.pageUrl || '不明',
    '',
    '■ 記録先スプレッドシート',
    spreadsheetUrl,
    '',
    'このメールは公式サイトから自動送信されました。'
  ].join('\n');

  GmailApp.sendEmail(
    CONTACT_CONFIG.NOTIFICATION_EMAIL,
    subject,
    body,
    {
      name: '前川こうき後援会 公式サイト',
      replyTo: data.email
    }
  );
}

function createReceiptNumber_(date) {
  const datePart = Utilities.formatDate(
    date,
    CONTACT_CONFIG.TIMEZONE,
    'yyyyMMdd-HHmmss'
  );

  const randomPart = Math.floor(
    1000 + Math.random() * 9000
  );

  return 'CONTACT-' + datePart + '-' + randomPart;
}

function cleanText_(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanMultilineText_(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      ''
    )
    .trim()
    .slice(0, maxLength);
}

function parseBoolean_(value) {
  const text = String(value == null ? '' : value)
    .toLowerCase()
    .trim();

  return [
    'true',
    '1',
    'yes',
    'on',
    '同意',
    '同意済み'
  ].indexOf(text) !== -1;
}

function publicErrorMessage_(error) {
  const code = String(
    error && error.message
      ? error.message
      : ''
  );

  const messages = {
    EMPTY_REQUEST:
      '送信内容を確認できませんでした。',
    INVALID_JSON:
      '送信データの形式が正しくありません。',
    NAME_REQUIRED:
      'お名前を入力してください。',
    EMAIL_REQUIRED:
      'メールアドレスを入力してください。',
    EMAIL_INVALID:
      'メールアドレスの形式を確認してください。',
    PHONE_REQUIRED:
      '電話番号を入力してください。',
    CATEGORY_REQUIRED:
      'お問い合わせ種別を選択してください。',
    MESSAGE_REQUIRED:
      'お問い合わせ内容を入力してください。',
    CONSENT_REQUIRED:
      '個人情報の取扱いへの同意が必要です。',
    RATE_LIMIT:
      '短時間に複数回送信されています。少し待ってから再度お試しください。'
  };

  return messages[code] ||
    '送信処理中にエラーが発生しました。時間をおいて再度お試しください。';
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
