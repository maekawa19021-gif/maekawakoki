/**
 * 高松市議会で取り上げてほしいこと受付フォーム
 * ＋ 前川こうき後援会 入会申込フォーム
 *
 * 使い方：
 * 1. Apps Script にこのコードを貼り付ける
 * 2. setupForm() を1回実行する
 * 3. 権限を承認する
 * 4. 実行ログまたは「管理情報」シートでURLを確認する
 */

const CONFIG = Object.freeze({
  FORM_TITLE: '高松市議会で取り上げてほしいこと・前川こうき後援会 入会申込フォーム',
  RESPONSE_SHEET_TITLE: '高松市議会へのご意見・後援会入会申込 回答一覧',
  NOTIFICATION_EMAIL: 'maekawa19021@gmail.com',
  TIMEZONE: 'Asia/Tokyo',
  SUBMIT_HANDLER: 'handleFormSubmit',
  SENDER_NAME: '前川こうき事務所 フォーム通知',
  PROPERTY_FORM_ID: 'CITY_COUNCIL_FORM_ID',
  PROPERTY_SHEET_ID: 'CITY_COUNCIL_RESPONSE_SHEET_ID'
});

/**
 * 初回設定用。
 * フォーム、回答スプレッドシート、送信トリガーを作成します。
 */
function setupForm() {
  const properties = PropertiesService.getScriptProperties();
  const existingFormId = properties.getProperty(CONFIG.PROPERTY_FORM_ID);
  const existingSheetId = properties.getProperty(CONFIG.PROPERTY_SHEET_ID);

  // すでに作成済みの場合は、二重作成せず既存フォームを案内します。
  if (existingFormId && existingSheetId) {
    try {
      const existingForm = FormApp.openById(existingFormId);
      const existingSheet = SpreadsheetApp.openById(existingSheetId);
      ensureSubmitTrigger_(existingForm);
      writeManagementSheet_(existingSheet, existingForm);
      logUrls_(existingForm, existingSheet);
      return;
    } catch (error) {
      // ファイルが削除済み・アクセス不可の場合だけ、新しく作り直します。
      properties.deleteProperty(CONFIG.PROPERTY_FORM_ID);
      properties.deleteProperty(CONFIG.PROPERTY_SHEET_ID);
    }
  }

  const spreadsheet = SpreadsheetApp.create(CONFIG.RESPONSE_SHEET_TITLE);
  spreadsheet.setSpreadsheetTimeZone(CONFIG.TIMEZONE);

  const form = FormApp.create(CONFIG.FORM_TITLE);
  configureForm_(form);
  addQuestions_(form);

  // 回答をGoogleスプレッドシートにも保存します。
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
  publishForm_(form);

  properties.setProperties({
    [CONFIG.PROPERTY_FORM_ID]: form.getId(),
    [CONFIG.PROPERTY_SHEET_ID]: spreadsheet.getId()
  });

  ensureSubmitTrigger_(form);
  writeManagementSheet_(spreadsheet, form);
  sendSetupCompletedEmail_(form, spreadsheet);
  logUrls_(form, spreadsheet);
}

/**
 * フォーム全体の基本設定。
 */
function configureForm_(form) {
  form
    .setDescription(
      '本フォームは、高松市議会で取り上げてほしい地域課題・ご意見・ご要望を受け付けるとともに、' +
      '「前川こうき後援会」への入会申込みを受け付けるものです。\n\n' +
      '【重要】フォームの送信には、後援会への入会申込み及び個人情報の取扱いへの同意が必要です。\n\n' +
      'お寄せいただいた内容は、事実確認、関係機関への照会、市議会での質問、政策提案、地域活動等の参考として利用する場合があります。' +
      '氏名、住所、電話番号、メールアドレスなど、個人を直接特定できる情報は、本人の同意なく公表しません。' +
      'ただし、法令に基づく場合を除きます。\n\n' +
      '内容によっては、確認のためご連絡することがあります。すべてのご要望を議会で取り上げることや、個別に回答することを保証するものではありません。'
    )
    .setConfirmationMessage(
      '送信ありがとうございました。市政へのご意見・ご要望及び前川こうき後援会への入会申込みを受け付けました。' +
      '内容を確認し、必要に応じてご連絡いたします。'
    )
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    .setAllowResponseEdits(true)
    .setShowLinkToRespondAgain(true)
    .setPublishingSummary(false)
    .setProgressBar(true)
    .setShuffleQuestions(false);
}

/**
 * 質問項目を追加します。
 */
function addQuestions_(form) {
  const emailValidation = FormApp.createTextValidation()
    .requireTextIsEmail()
    .setHelpText('正しいメールアドレスを入力してください。')
    .build();

  const postalCodeValidation = FormApp.createTextValidation()
    .requireTextMatchesPattern('^\\d{3}-?\\d{4}$')
    .setHelpText('例：760-8571 または 7608571')
    .build();

  const phoneValidation = FormApp.createTextValidation()
    .requireTextMatchesPattern('^0\\d{9,10}$')
    .setHelpText('携帯電話・固定電話ともに、ハイフンなしで入力してください。例：09012345678')
    .build();

  // ParagraphTextItem（段落形式）専用の検証を作成します。
  // createTextValidation() は1行テキスト用のため、段落形式には使用できません。
  const detailValidation = FormApp.createParagraphTextValidation()
    .requireTextLengthGreaterThanOrEqualTo(20)
    .setHelpText('状況が分かるよう、20文字以上で入力してください。')
    .build();

  form.addSectionHeaderItem()
    .setTitle('1．高松市議会で取り上げてほしいこと')
    .setHelpText('市政や地域の課題について、できるだけ具体的にご記入ください。');

  form.addCheckboxItem()
    .setTitle('ご意見・ご要望の分野')
    .setChoiceValues([
      '道路・交通・公共交通',
      '子育て・教育',
      '福祉・介護・医療',
      '防災・消防・防犯',
      'ごみ・環境・生活衛生',
      '農林水産業・産業・観光',
      '地域コミュニティ・自治会',
      '行政手続・市役所サービス',
      'まちづくり・公共施設',
      '税・財政・行財政改革',
      'その他'
    ])
    .setRequired(true);

  form.addTextItem()
    .setTitle('件名・テーマ')
    .setHelpText('例：○○交差点の安全対策、保育所の待機児童対策、公共施設の改善など')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('具体的な内容')
    .setHelpText('現在の状況、困っていること、改善してほしいこと、関係者、発生時期などを具体的にご記入ください。')
    .setValidation(detailValidation)
    .setRequired(true);

  form.addTextItem()
    .setTitle('場所・施設名・路線名など')
    .setHelpText('住所、目印、施設名、道路名、学校名など。特定の場所がない場合は「なし」と入力してください。')
    .setRequired(true);

  form.addTextItem()
    .setTitle('いつ頃からの問題ですか')
    .setHelpText('例：2026年4月頃から、数年前から、今回初めて、など')
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('緊急度')
    .setChoiceValues([
      '生命・身体・財産に関わるため、早急な確認が必要',
      'できるだけ早く改善してほしい',
      '中長期的な政策課題として検討してほしい',
      '情報提供・提案として伝えたい'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('これまでに相談した窓口・担当課と、その回答')
    .setHelpText('市役所、警察、学校、自治会などへ相談済みの場合は、相談先・時期・回答内容をご記入ください。')
    .setRequired(false);

  form.addTextItem()
    .setTitle('写真・資料・関連ページの共有URL')
    .setHelpText('Googleドライブ等の共有リンクがある場合に入力してください。閲覧権限の設定をご確認ください。')
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('ご意見の利用方法について')
    .setChoiceValues([
      '個人が特定されない形で、市議会質問・行政照会・政策提案等に利用してよい',
      '利用する前に、私へ連絡して確認してほしい',
      '個別相談としてのみ取り扱ってほしい'
    ])
    .setRequired(true);

  form.addPageBreakItem()
    .setTitle('2．申込者情報・後援会会員情報')
    .setHelpText('後援会名簿の作成、本人確認、ご連絡及びご意見への対応に必要な項目です。');

  form.addTextItem()
    .setTitle('お名前')
    .setRequired(true);

  form.addTextItem()
    .setTitle('ふりがな')
    .setRequired(true);

  form.addTextItem()
    .setTitle('郵便番号')
    .setHelpText('例：760-8571')
    .setValidation(postalCodeValidation)
    .setRequired(true);

  form.addTextItem()
    .setTitle('住所')
    .setHelpText('都道府県から、番地・建物名・部屋番号まで入力してください。')
    .setRequired(true);

  form.addTextItem()
    .setTitle('電話番号')
    .setHelpText('ハイフンなしで入力してください。')
    .setValidation(phoneValidation)
    .setRequired(true);

  form.addTextItem()
    .setTitle('メールアドレス')
    .setValidation(emailValidation)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('高松市との関係')
    .setChoiceValues([
      '高松市内に居住',
      '高松市内に通勤・通学',
      '高松市内で事業・活動をしている',
      '高松市外に居住しているが、高松市に関係がある',
      'その他'
    ])
    .setRequired(true);

  form.addTextItem()
    .setTitle('職業・勤務先・所属団体など')
    .setHelpText('差し支えない範囲で入力してください。')
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('希望する連絡方法')
    .setChoiceValues([
      'メール',
      '電話',
      '郵送',
      '特に希望なし',
      '原則として連絡不要'
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('後援会から受け取りたいご案内（複数選択可）')
    .setChoiceValues([
      '市政報告・活動報告',
      '市政報告会・タウンミーティング等の案内',
      '後援会活動・ボランティア活動の案内',
      '案内は不要'
    ])
    .setRequired(true);

  form.addTextItem()
    .setTitle('紹介者のお名前')
    .setHelpText('紹介者がいる場合のみ入力してください。')
    .setRequired(false);

  form.addPageBreakItem()
    .setTitle('3．入会申込み・個人情報の取扱いへの同意')
    .setHelpText('以下の内容を確認し、同意欄にチェックしてください。');

  form.addSectionHeaderItem()
    .setTitle('前川こうき後援会への入会について')
    .setHelpText(
      '私は、前川幸輝の政治活動及び地域活動の趣旨に賛同し、本フォームの送信をもって「前川こうき後援会」への入会を申し込みます。' +
      '退会を希望する場合は、後援会事務所へ申し出ることができます。'
    );

  form.addCheckboxItem()
    .setTitle('後援会への入会申込み')
    .setChoiceValues([
      '上記内容を確認し、前川こうき後援会への入会を申し込みます。'
    ])
    .setRequired(true);

  form.addSectionHeaderItem()
    .setTitle('個人情報の取扱いについて')
    .setHelpText(
      '入力された個人情報は、市政相談への対応、事実確認、関係機関への照会、後援会名簿の作成、' +
      '市政報告・活動案内等の連絡及び後援会活動の運営に利用します。' +
      '法令に基づく場合を除き、本人の同意なく目的外利用又は第三者提供を行いません。'
    );

  form.addCheckboxItem()
    .setTitle('個人情報の取扱いへの同意')
    .setChoiceValues([
      '上記の個人情報の利用目的を確認し、同意します。'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('その他の連絡事項')
    .setHelpText('補足事項があれば入力してください。')
    .setRequired(false);
}

/**
 * フォームを回答可能な状態にします。
 */
function publishForm_(form) {
  try {
    if (form.supportsAdvancedResponderPermissions()) {
      form.setPublished(true);
    } else {
      form.setAcceptingResponses(true);
    }
  } catch (error) {
    form.setAcceptingResponses(true);
  }
}

/**
 * フォーム送信時トリガーを1つだけ設定します。
 */
function ensureSubmitTrigger_(form) {
  const triggers = ScriptApp.getProjectTriggers();

  // 同じ処理を行う古い・重複したトリガーを削除します。
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === CONFIG.SUBMIT_HANDLER) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger(CONFIG.SUBMIT_HANDLER)
    .forForm(form)
    .onFormSubmit()
    .create();
}

/**
 * フォームが送信されたときに自動実行されます。
 * この関数をエディタ上から直接実行しないでください。
 */
function handleFormSubmit(e) {
  if (!e || !e.response) {
    throw new Error('フォーム送信イベントから実行してください。handleFormSubmit() を直接実行することはできません。');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const formResponse = e.response;
    const responseId = formResponse.getId() || '';
    const cache = CacheService.getScriptCache();
    const cacheKey = responseId ? 'MAIL_SENT_' + responseId : '';

    // 万一トリガーが重複した場合の二重送信を抑止します。
    if (cacheKey && cache.get(cacheKey)) {
      return;
    }

    const itemResponses = formResponse.getItemResponses();
    const answers = {};
    const orderedAnswers = [];

    itemResponses.forEach(function(itemResponse) {
      const title = itemResponse.getItem().getTitle();
      const value = normalizeResponseValue_(itemResponse.getResponse());
      answers[title] = value;
      orderedAnswers.push({ title: title, value: value });
    });

    const submittedAt = Utilities.formatDate(
      formResponse.getTimestamp(),
      CONFIG.TIMEZONE,
      'yyyy年M月d日 HH:mm:ss'
    );

    const name = answers['お名前'] || '氏名未取得';
    const category = answers['ご意見・ご要望の分野'] || '分野未取得';
    const topic = answers['件名・テーマ'] || '件名未取得';
    const respondentEmail = answers['メールアドレス'] || '';
    const spreadsheetUrl = getResponseSpreadsheetUrl_();

    const subject = truncate_(
      '【市議会へのご意見・後援会入会】' + name + '様／' + topic,
      180
    );

    const plainBody = buildPlainTextBody_(
      submittedAt,
      responseId,
      category,
      orderedAnswers,
      spreadsheetUrl
    );

    const htmlBody = buildHtmlBody_(
      submittedAt,
      responseId,
      category,
      orderedAnswers,
      spreadsheetUrl
    );

    const message = {
      to: CONFIG.NOTIFICATION_EMAIL,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody,
      name: CONFIG.SENDER_NAME
    };

    // 通知メールへ返信すると、入力者へ返信できるようにします。
    if (respondentEmail) {
      message.replyTo = respondentEmail;
    }

    MailApp.sendEmail(message);

    if (cacheKey) {
      cache.put(cacheKey, '1', 21600); // 6時間
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * 回答値をメール表示用の文字列に変換します。
 */
function normalizeResponseValue_(value) {
  if (Array.isArray(value)) {
    return value.join('、');
  }
  if (value instanceof Date) {
    return Utilities.formatDate(value, CONFIG.TIMEZONE, 'yyyy/MM/dd');
  }
  if (value === null || typeof value === 'undefined' || value === '') {
    return '（未入力）';
  }
  return String(value);
}

function buildPlainTextBody_(submittedAt, responseId, category, orderedAnswers, spreadsheetUrl) {
  const lines = [
    '高松市議会へのご意見・ご要望及び後援会入会申込みが送信されました。',
    '',
    '回答日時：' + submittedAt,
    '分野：' + category,
    '回答ID：' + (responseId || '取得できませんでした'),
    '',
    '────────────────────────'
  ];

  orderedAnswers.forEach(function(answer) {
    lines.push('■ ' + answer.title);
    lines.push(answer.value);
    lines.push('');
  });

  lines.push('────────────────────────');
  lines.push('回答スプレッドシート：' + spreadsheetUrl);

  return lines.join('\n');
}

function buildHtmlBody_(submittedAt, responseId, category, orderedAnswers, spreadsheetUrl) {
  const rows = orderedAnswers.map(function(answer) {
    return '<tr>' +
      '<th style="width:32%;padding:10px;border:1px solid #d9d9d9;background:#f5f5f5;text-align:left;vertical-align:top;">' +
      escapeHtml_(answer.title) +
      '</th>' +
      '<td style="padding:10px;border:1px solid #d9d9d9;vertical-align:top;white-space:pre-wrap;">' +
      escapeHtml_(answer.value).replace(/\n/g, '<br>') +
      '</td>' +
      '</tr>';
  }).join('');

  return '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#222;line-height:1.6;">' +
    '<h2 style="margin:0 0 16px;">新しいフォーム送信がありました</h2>' +
    '<p>' +
    '<strong>回答日時：</strong>' + escapeHtml_(submittedAt) + '<br>' +
    '<strong>分野：</strong>' + escapeHtml_(category) + '<br>' +
    '<strong>回答ID：</strong>' + escapeHtml_(responseId || '取得できませんでした') +
    '</p>' +
    '<table style="border-collapse:collapse;width:100%;max-width:900px;">' + rows + '</table>' +
    '<p style="margin-top:20px;"><a href="' + escapeHtml_(spreadsheetUrl) + '">回答スプレッドシートを開く</a></p>' +
    '</div>';
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate_(text, maxLength) {
  const value = String(text);
  return value.length <= maxLength ? value : value.substring(0, maxLength - 1) + '…';
}

function getResponseSpreadsheetUrl_() {
  const spreadsheetId = PropertiesService.getScriptProperties()
    .getProperty(CONFIG.PROPERTY_SHEET_ID);
  return spreadsheetId
    ? 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/edit'
    : '回答先スプレッドシートのURLを取得できませんでした。';
}

/**
 * 作成したフォーム等のURLを「管理情報」シートに保存します。
 */
function writeManagementSheet_(spreadsheet, form) {
  const sheetName = '管理情報';
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName, 0);
  }

  sheet.clear();
  sheet.getRange(1, 1, 6, 2).setValues([
    ['項目', 'URL・内容'],
    ['回答者用フォーム', form.getPublishedUrl()],
    ['フォーム編集画面', form.getEditUrl()],
    ['回答スプレッドシート', spreadsheet.getUrl()],
    ['通知先メール', CONFIG.NOTIFICATION_EMAIL],
    ['最終設定日時', Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy年M月d日 HH:mm:ss')]
  ]);

  sheet.getRange('A1:B1').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 650);
}

function sendSetupCompletedEmail_(form, spreadsheet) {
  const subject = '【設定完了】高松市議会へのご意見・後援会入会フォーム';
  const body = [
    'フォームの作成と、送信時メール通知の設定が完了しました。',
    '',
    '回答者用フォーム：',
    form.getPublishedUrl(),
    '',
    'フォーム編集画面：',
    form.getEditUrl(),
    '',
    '回答スプレッドシート：',
    spreadsheet.getUrl(),
    '',
    'このメールアドレスに、フォーム送信時の通知が届きます。'
  ].join('\n');

  MailApp.sendEmail({
    to: CONFIG.NOTIFICATION_EMAIL,
    subject: subject,
    body: body,
    name: CONFIG.SENDER_NAME
  });
}

/**
 * 現在のフォームURLを実行ログに表示します。
 */
function showFormUrls() {
  const properties = PropertiesService.getScriptProperties();
  const formId = properties.getProperty(CONFIG.PROPERTY_FORM_ID);
  const sheetId = properties.getProperty(CONFIG.PROPERTY_SHEET_ID);

  if (!formId || !sheetId) {
    throw new Error('まだフォームが作成されていません。先に setupForm() を実行してください。');
  }

  const form = FormApp.openById(formId);
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  logUrls_(form, spreadsheet);
}

function logUrls_(form, spreadsheet) {
  console.log('回答者用フォーム：' + form.getPublishedUrl());
  console.log('フォーム編集画面：' + form.getEditUrl());
  console.log('回答スプレッドシート：' + spreadsheet.getUrl());
}

/**
 * メール送信だけを確認するテストです。
 */
function sendTestNotification() {
  MailApp.sendEmail({
    to: CONFIG.NOTIFICATION_EMAIL,
    subject: '【テスト】フォーム通知メール',
    body: 'Apps Scriptからの通知メール送信テストです。受信できていれば設定は正常です。',
    name: CONFIG.SENDER_NAME
  });
}
