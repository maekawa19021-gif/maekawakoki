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

// 議会・市政レポートを置くGoogleドライブのフォルダID
const REPORTS_FOLDER_ID = '1nhtLr-Fio5yn04aBJ-9JVLm90AHFnfeb';

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
  const params = e && e.parameter ? e.parameter : {};

  // トップページの「議会・市政レポート」自動表示用
  if (params.route === 'reports') {
    return handleReportsRequest_(params);
  }

  // PCブラウザ向けの安定表示用。JSONPがブロック・失敗する場合でも iframe として読み込めるHTMLを返す。
  if (params.route === 'reports_iframe') {
    return handleReportsIframe_(params);
  }

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
    '<p>また、Googleドライブ内の議会・市政レポート一覧をサイトへ配信します。</p>' +
    '</body>' +
    '</html>'
  );
}

function handleReportsRequest_(params) {
  const callback = String(params.callback || '').trim();
  const refresh = String(params.refresh || '') === '1';
  const payload = getReportsPayload_(refresh);

  // GitHub Pagesから安定して読み込むためJSONPで返す
  if (callback) {
    const safeCallback = callback.replace(/[^a-zA-Z0-9_$\.]/g, '');
    return ContentService
      .createTextOutput(safeCallback + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleReportsIframe_(params) {
  const refresh = String(params.refresh || '') === '1';
  const payload = getReportsPayload_(refresh);
  const folderUrl = (payload && payload.folderUrl) || ('https://drive.google.com/drive/folders/' + REPORTS_FOLDER_ID + '?usp=sharing');
  const reports = (payload && payload.reports) || [];

  let cards = '';
  if (!payload || !payload.ok) {
    cards = '<div class="report-status">市政レポートを読み込めませんでした。フォルダ共有設定、Apps Scriptの実行アカウント、Drive権限を確認してください。<p><a class="btn" href="' + escapeHtmlAttr_(folderUrl) + '" target="_blank" rel="noopener">Googleドライブで開く →</a></p></div>';
  } else if (!reports.length) {
    cards = '<div class="report-status">現在公開中の市政レポートはありません。<p><a class="btn" href="' + escapeHtmlAttr_(folderUrl) + '" target="_blank" rel="noopener">Googleドライブで開く →</a></p></div>';
  } else {
    cards = reports.map(function(r) {
      const title = escapeHtmlText_(r.title || '市政レポート');
      const date = escapeHtmlText_(r.dateLabel || r.updatedLabel || '');
      const pdf = escapeHtmlAttr_(r.viewUrl || folderUrl);
      const thumb = escapeHtmlAttr_(r.thumbnailUrl || '');
      const desc = escapeHtmlText_(r.description || 'PDFで市政レポートをご覧いただけます。');
      return '<article class="report-card">' +
        '<a class="report-thumb" href="' + pdf + '" target="_blank" rel="noopener">' +
          '<span class="fallback-label">CITY REPORT<br>PDF</span>' +
          (thumb ? '<img src="' + thumb + '" alt="' + title + 'の表紙" loading="lazy" onerror="this.style.display=\'none\'">' : '') +
        '</a>' +
        '<div class="report-body">' +
          (date ? '<p class="report-date">' + date + '</p>' : '') +
          '<h3>' + title + '</h3>' +
          '<p>' + desc + '</p>' +
          '<a class="btn" href="' + pdf + '" target="_blank" rel="noopener">PDFを見る →</a>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  const html = '<!doctype html>' +
    '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>' +
    '*{box-sizing:border-box}body{margin:0;background:transparent;color:#eef3ff;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans JP",sans-serif;line-height:1.8;overflow:hidden}' +
    '.report-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;padding:2px}' +
    '.report-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;min-width:0}' +
    '.report-thumb{aspect-ratio:3/4;background:linear-gradient(135deg,#132a55,#0a1732);position:relative;display:grid;place-items:center;color:#9fb0d0;font-size:12px;letter-spacing:.12em;overflow:hidden;text-decoration:none}' +
    '.report-thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.fallback-label{position:relative;z-index:1;text-align:center;padding:20px}' +
    '.report-body{padding:22px 24px 26px;display:flex;flex-direction:column;flex:1}.report-date{color:#ffd400;font-size:12px;letter-spacing:.12em;margin:0 0 8px}' +
    'h3{font-size:17px;font-weight:900;margin:0 0 8px}p{color:#9fb0d0;font-size:13px;line-height:1.7;flex:1;margin:0 0 14px}.btn{display:inline-flex;justify-content:center;align-items:center;background:linear-gradient(135deg,#ffd400,#ffaa00);color:#0a1732!important;padding:12px 22px;border-radius:999px;font-weight:800;text-decoration:none;font-size:14px}' +
    '.report-status{grid-column:1/-1;background:rgba(255,255,255,.05);border:1px dashed rgba(255,255,255,.3);border-radius:18px;padding:30px;text-align:center;color:#cdd7ee}' +
    '@media(max-width:900px){.report-grid{grid-template-columns:1fr 1fr}}@media(max-width:640px){.report-grid{grid-template-columns:1fr}}' +
    '</style></head><body><div class="report-grid">' + cards + '</div>' +
    '<script>function h(){try{parent.postMessage({type:"maekawaReportsHeight",height:document.documentElement.scrollHeight||document.body.scrollHeight},"*");}catch(e){}}window.addEventListener("load",function(){h();setTimeout(h,500);setTimeout(h,1500);});window.addEventListener("resize",h);</script>' +
    '</body></html>';

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


function getReportsPayload_(refresh) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = 'city_reports_v2_' + REPORTS_FOLDER_ID;
    if (!refresh) {
      const cached = cache.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const folder = DriveApp.getFolderById(REPORTS_FOLDER_ID);
    const files = folder.getFiles();
    const reports = [];

    while (files.hasNext()) {
      const file = files.next();
      const mime = file.getMimeType();
      const name = file.getName();

      // 基本はPDFを掲載。必要に応じてGoogleドキュメントもPDF表示リンクとして掲載。
      const allowed =
        mime === MimeType.PDF ||
        mime === MimeType.GOOGLE_DOCS ||
        mime === MimeType.GOOGLE_SLIDES;

      if (!allowed) continue;

      const id = file.getId();
      const updated = file.getLastUpdated();
      const created = file.getDateCreated();
      const title = makeReportTitle_(name);

      reports.push({
        id: id,
        title: title,
        fileName: name,
        mimeType: mime,
        viewUrl: 'https://drive.google.com/file/d/' + id + '/view?usp=sharing',
        thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w900',
        updated: updated ? updated.toISOString() : '',
        created: created ? created.toISOString() : '',
        updatedLabel: updated ? Utilities.formatDate(updated, 'Asia/Tokyo', 'yyyy.MM.dd') : '',
        dateLabel: makeDateLabelFromName_(name, updated),
        sortKey: makeSortKeyFromName_(name, updated),
        description: '議会での質問、市政課題への取組、地域活動などをまとめたレポートです。'
      });
    }

    // 最新順。ファイル名に年月日・年月がある場合は発行日として優先し、
    // ない場合はDriveの更新日時で並べ替える。
    reports.sort(function(a, b) {
      return String(b.sortKey || b.updated || b.created || '').localeCompare(String(a.sortKey || a.updated || a.created || ''));
    });

    const payload = {
      ok: true,
      folderId: REPORTS_FOLDER_ID,
      folderUrl: 'https://drive.google.com/drive/folders/' + REPORTS_FOLDER_ID + '?usp=sharing',
      count: reports.length,
      generatedAt: new Date().toISOString(),
      reports: reports
    };

    // PCで初回読み込みが遅くならないよう、一覧データを短時間キャッシュする。
    cache.put(cacheKey, JSON.stringify(payload), 600);
    return payload;
  } catch (err) {
    return {
      ok: false,
      message: 'Googleドライブの市政レポートフォルダを読み込めませんでした。フォルダ共有設定、Apps Scriptの実行アカウント、Drive権限を確認してください。詳細：' + err.message,
      folderId: REPORTS_FOLDER_ID,
      folderUrl: 'https://drive.google.com/drive/folders/' + REPORTS_FOLDER_ID + '?usp=sharing',
      reports: []
    };
  }
}

function makeSortKeyFromName_(name, fallbackDate) {
  const text = String(name || '');

  // 例：2026-07-09 / 2026_07_09 / 2026年7月9日
  let m = text.match(/(20[0-9]{2})[-_.年]?([0-9]{1,2})[-_.月]?([0-9]{1,2})/);
  if (m) {
    return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  }

  // 例：2026-07 / 2026_07 / 2026年7月
  m = text.match(/(20[0-9]{2})[-_.年]?([0-9]{1,2})/);
  if (m) {
    return m[1] + '-' + ('0' + m[2]).slice(-2) + '-01';
  }

  return fallbackDate ? fallbackDate.toISOString() : '';
}

function makeReportTitle_(name) {
  return String(name || '')
    .replace(/\.[^.]+$/, '')
    .replace(/^[0-9]{4}[-_.年]?[0-9]{1,2}[-_.月]?[0-9]{0,2}[日]?[_\s-]*/g, '')
    .replace(/_/g, ' ')
    .trim() || '市政レポート';
}

function makeDateLabelFromName_(name, fallbackDate) {
  const text = String(name || '');
  const m = text.match(/(20[0-9]{2})[-_.年]?([0-9]{1,2})/);
  if (m) {
    return m[1] + '.' + ('0' + m[2]).slice(-2);
  }
  return fallbackDate ? Utilities.formatDate(fallbackDate, 'Asia/Tokyo', 'yyyy.MM.dd') : '';
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
