const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyRnEFUBqI8CD-V-AORCtc0d48nQJLFiixJJXsNkddOL4RAhhoxmhDXSWElKBekkHPMlQ/exec';
const RECAPTCHA_SITE_KEY = '6LfjFgUrAAAAAKZGVUxEgdoDr2lwh2xaDf6oj_0V';

// URLからクエリパラメータを解析する関数
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// HTML特殊文字をエスケープする関数
function escapeHTML(str) {
    if (typeof str !== 'string') {
        return ''; // 文字列でない場合は空文字を返す
    }
    return str
        .replace(/&/g, '&') // & を最初に置換
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039');
}

// 営業担当コードを取得して表示する関数
function initSalesCode() {
    const codeParam = getQueryParam("code");
    const salesCodeInput = document.getElementById("sales-code-input");
    const salesCodeDisplay = document.getElementById("sales-code-display");

    // 営業担当コードのマッピング
    const salesCodeMapping = {
        "100": "郡元サービスショップ",
        "200": "中央サービスショップ",
        "300": "南部サービスショップ",
        "400": "草牟田サービスショップ",
        "500": "原良サービスショップ",
        "600": "エネフィル吉野",
        "700": "インスタッフ"
    };
    const validCodes = Object.keys(salesCodeMapping); // マッピングのキーを有効コードとする

    if (codeParam && validCodes.includes(codeParam)) {
        if (salesCodeInput) {
            salesCodeInput.value = codeParam;
        }
        if (salesCodeDisplay) {
            salesCodeDisplay.textContent = escapeHTML(salesCodeMapping[codeParam]);
        }
    } else {
        // codeParamがない、または無効なコードの場合
        if (salesCodeInput) {
            salesCodeInput.value = ""; // 不正値は設定しない
        }
        if (salesCodeDisplay) {
            salesCodeDisplay.textContent = "営業担当: -";
        }
    }
}

/**
 * 生年月日のプルダウンにオプションを動的に追加する関数
 */
function populateDateSelects() {
    const yearSelect = document.getElementById('birth-year');
    const monthSelect = document.getElementById('birth-month');
    const daySelect = document.getElementById('birth-day');

    if (!yearSelect || !monthSelect || !daySelect) {
        console.error("生年月日プルダウンの要素が見つかりません。");
        return;
    }

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 110; // 範囲を少し広げる (110年前から)
    const endYear = currentYear - 18; // 例: 18歳以上を対象とする場合

    // 西暦オプション (18歳以上110歳以下を想定)
    for (let year = endYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    // 月オプション
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        monthSelect.appendChild(option);
    }

    // 日オプション
    for (let day = 1; day <= 31; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day;
        daySelect.appendChild(option);
    }
}

// 電力会社の「その他」選択時の処理
function setupElectricCompanySelect() {
    const electricCompanySelect = document.getElementById("electric-company");
    const otherCompanyInput = document.getElementById("other-company-input");
    const otherCompany = document.getElementById("other-company");

    if (!electricCompanySelect || !otherCompanyInput) return;

    electricCompanySelect.addEventListener("change", function() {
        const selectedValue = this.value;

        if (selectedValue === "その他") {
            otherCompanyInput.style.display = "block";
            if (otherCompany) {
                otherCompany.setAttribute("required", "");
            }
        } else {
            otherCompanyInput.style.display = "none";
            if (otherCompany) {
                otherCompany.removeAttribute("required");
                otherCompany.value = "";
                otherCompany.classList.remove('error'); // エラー状態も解除
            }
        }
    });
}

// 重要事項説明ダウンロードと同意チェックボックス有効化
function setupAgreementSection() {
    const downloadBtn = document.getElementById('download-btn');
    const agreementCheckbox = document.getElementById('agreement-checkbox');
    const downloadMessage = document.getElementById('download-message');
    const allowedFiles = [
        'txt/重要事項説明書.pdf'
    ];

    if (!downloadBtn || !agreementCheckbox || !downloadMessage) return;

    downloadBtn.addEventListener('click', function(event) {
        event.preventDefault();

        const filePath = this.getAttribute('href');

        // 厳密なホワイトリストによるパス検証
        if (allowedFiles.includes(filePath)) {
            window.open(filePath, '_blank');

            // ダウンロード完了のメッセージを表示
            setTimeout(function() {
                if (downloadMessage) {
                    downloadMessage.style.display = 'block';
                }
                // ダウンロード後にチェックボックスを有効化
                if (agreementCheckbox) {
                    agreementCheckbox.disabled = false;
                }
            }, 1000);
        } else {
            console.error('許可されていないファイルパスが指定されました');
            alert('指定されたファイルを開けませんでした。');
        }
    });
}

// ボタンのクリックイベントをセットする関数
function setupGasUsageButtons() {
    const gasYesBtn = document.getElementById("gas-yes");
    const gasNoBtn = document.getElementById("gas-no");
    const gasWarning = document.getElementById("gas-warning");
    const contractorInfo = document.getElementById("contractor-info");
    const address = document.getElementById("address");
    const paymentMethod = document.getElementById("payment-method");
    const paymentGasYes = document.getElementById("payment-gas-yes");
    const paymentGasNo = document.getElementById("payment-gas-no");
    const notificationGasYes = document.getElementById("notification-gas-yes");
    const notificationGasNo = document.getElementById("notification-gas-no");
    const electricityContract = document.getElementById("electricity-contract");
    const agreementSection = document.getElementById("agreement-section");
    const applicationNotesSection = document.getElementById("application-notes-section");
    const submitSection = document.getElementById("submit-section");

    // --- 必須項目の制御用要素を取得 ---
    const paymentTypeSelect = document.getElementById('payment-type');
    const notificationTypeSelect = document.getElementById('notification-type');

    // 引数チェック (追加した要素も含む)
    if (!gasYesBtn || !gasNoBtn || !notificationGasYes || !notificationGasNo || !paymentTypeSelect || !notificationTypeSelect || !applicationNotesSection) {
        console.error("必要な要素が見つかりません: setupGasUsageButtons");
        return;
    }

    // 「はい」ボタンのクリックイベント
    gasYesBtn.addEventListener("click", function() {
        gasYesBtn.classList.add("selected");
        gasNoBtn.classList.remove("selected");

        if (gasWarning) gasWarning.style.display = "none";
        if (contractorInfo) contractorInfo.style.display = "block";
        if (address) address.style.display = "block";
        if (paymentMethod) paymentMethod.style.display = "block";
        if (paymentGasYes) paymentGasYes.style.display = "block";
        if (paymentGasNo) paymentGasNo.style.display = "none";
        if (notificationGasYes) notificationGasYes.style.display = "block";
        if (notificationGasNo) notificationGasNo.style.display = "none";
        if (electricityContract) electricityContract.style.display = "block";
        if (agreementSection) agreementSection.style.display = "block";
        if (applicationNotesSection) applicationNotesSection.style.display = "block";
        if (submitSection) submitSection.style.display = "block";

        // 「はい」選択時は「いいえ」用の選択肢を非必須＆エラー解除
        paymentTypeSelect.removeAttribute('required');
        paymentTypeSelect.classList.remove('error');
        notificationTypeSelect.removeAttribute('required');
        notificationTypeSelect.classList.remove('error');
    });

    // 「いいえ」ボタンのクリックイベント
    gasNoBtn.addEventListener("click", function() {
        gasNoBtn.classList.add("selected");
        gasYesBtn.classList.remove("selected");

        if (gasWarning) gasWarning.style.display = "block";
        if (contractorInfo) contractorInfo.style.display = "block";
        if (address) address.style.display = "block";
        if (paymentMethod) paymentMethod.style.display = "block";
        if (paymentGasYes) paymentGasYes.style.display = "none";
        if (paymentGasNo) paymentGasNo.style.display = "block";
        if (notificationGasYes) notificationGasYes.style.display = "none";
        if (notificationGasNo) notificationGasNo.style.display = "block";
        if (electricityContract) electricityContract.style.display = "block";
        if (agreementSection) agreementSection.style.display = "block";
        if (applicationNotesSection) applicationNotesSection.style.display = "block";
        if (submitSection) submitSection.style.display = "block";

        // 「いいえ」選択時は「いいえ」用の選択肢を必須に
        paymentTypeSelect.setAttribute('required', '');
        notificationTypeSelect.setAttribute('required', '');
    });
}

// お支払い方法の選択に応じて留意点を表示
function setupPaymentTypeSelect() {
    const paymentSelect = document.getElementById('payment-type');
    const noticeContainer = document.getElementById('payment-notice-container');

    // 要素が存在しない場合は処理を中断
    if (!paymentSelect || !noticeContainer) return;

    // 留意点アイテムをすべて取得 (クラスで取得)
    const noticeItems = noticeContainer.querySelectorAll('.payment-notice-item');

    // セレクトボックスの値が変更されたときのイベントリスナー
    paymentSelect.addEventListener('change', function() {
        const selectedValue = this.value;

        noticeItems.forEach(item => {
            item.style.display = 'none';
        });

        // 選択された値に対応する留意点アイテムを表示する
        if (selectedValue) {
            const targetNotice = document.getElementById(`payment-notice-${selectedValue}`);
            if (targetNotice) {
                targetNotice.style.display = 'block'; 
            }
        }
    });
}

// 電気使用量・料金のご確認方法の選択に応じて説明を表示する関数
function setupNotificationTypeSelect() {
    const notificationSelect = document.getElementById('notification-type');
    const notificationDetailsContainer = document.getElementById('notification-details');

    // 要素が存在しない場合は処理を中断
    if (!notificationSelect || !notificationDetailsContainer) {
        // console.warn("Notification select or details container not found.");
        return;
    }

    const detailItems = notificationDetailsContainer.querySelectorAll('.notification-detail-item');

    // セレクトボックスの値が変更されたときのイベントリスナー
    notificationSelect.addEventListener('change', function() {
        const selectedValue = this.value; 

        detailItems.forEach(item => {
            item.style.display = 'none';
        });

        if (selectedValue) { 
            const targetDetail = document.getElementById(`notification-detail-${selectedValue}`);
            if (targetDetail) {
                targetDetail.style.display = 'block';
            }
        }
    });
}

function setupSubmitButton() {
    const agreementCheckbox = document.getElementById('agreement-checkbox');
    const submitBtn = document.getElementById('submit-btn');
    const completionModal = document.getElementById('completion-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    if (!agreementCheckbox || !submitBtn || !completionModal || !modalCloseBtn) return;

    submitBtn.disabled = true;

    agreementCheckbox.addEventListener('change', function() {
        submitBtn.disabled = !this.checked;
    });

    // 完了モーダルの閉じるボタン
    modalCloseBtn.addEventListener('click', function() {
        completionModal.style.display = 'none';
    });

    // 申し込みボタンクリック時の処理
    submitBtn.addEventListener('click', function() {
        if (validateForm()) {
            const formData = collectFormData();
            sendDataToGAS(formData);
        }
    });
}

// フォームバリデーション関数
function validateForm() {
    let isValid = true;
    let errorMessages = [];
    const fieldsToValidate = [ // バリデーション対象フィールドの定義
        { id: 'lastname', label: '姓', type: 'text', required: true },
        { id: 'firstname', label: '名', type: 'text', required: true },
        { id: 'lastname-kana', label: 'セイ', type: 'kana', required: true },
        { id: 'firstname-kana', label: 'メイ', type: 'kana', required: true },
        { id: 'birth-year', label: '生年月日(西暦)', type: 'select', required: true },
        { id: 'birth-month', label: '生年月日(月)', type: 'select', required: true },
        { id: 'birth-day', label: '生年月日(日)', type: 'select', required: true },
        { id: 'phone', label: 'お電話番号', type: 'phone', required: true },
        { id: 'email', label: 'メールアドレス', type: 'email', required: true },
        { id: 'street-address', label: '市町・丁名番地', type: 'text', required: true },
        { id: 'electric-company', label: '電力会社', type: 'select', required: true },
        { id: 'other-company', label: 'その他の電力会社名', type: 'text', required: document.getElementById('electric-company')?.value === 'その他' }, 
        { id: 'customer-number', label: 'お客様番号', type: 'text', required: true },
        { id: 'supply-point-number', label: '供給地点特定番号', type: 'supplyPoint', required: true },
        { id: 'payment-type', label: 'お支払方法', type: 'select', required: document.getElementById('gas-no')?.classList.contains('selected') }, 
        { id: 'notification-type', label: 'ご確認方法', type: 'select', required: document.getElementById('gas-no')?.classList.contains('selected') }, 
        { id: 'agreement-checkbox', label: '重要事項説明への同意', type: 'checkbox', required: true },
        { id: 'notes-confirmed-checkbox', label: '注意事項の確認', type: 'checkbox', required: true },
    ];

     // エラークラスを一旦全削除
     document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    fieldsToValidate.forEach(fieldInfo => {
        const element = document.getElementById(fieldInfo.id);
        if (!element || !fieldInfo.required) return; // 要素がないか必須でない場合はスキップ

        let value = '';
        let isError = false;

        if (fieldInfo.type === 'checkbox') {
            if (!element.checked) {
                isError = true;
                errorMessages.push(`${fieldInfo.label}が必要です`);
            }
        } else if (fieldInfo.type === 'select') {
            if (!element.value) {
                isError = true;
                // 生年月日のエラーメッセージは集約
                if (fieldInfo.id.startsWith('birth')) {
                     if (!errorMessages.includes('生年月日を選択してください')) {
                         errorMessages.push('生年月日を選択してください');
                     }
                } else {
                    errorMessages.push(`${fieldInfo.label}を選択してください`);
                }
            }
        } else { // text, kana, phone, email, supplyPoint など
            value = element.value ? element.value.trim() : '';
            if (!value) {
                isError = true;
                errorMessages.push(`${fieldInfo.label}を入力してください`);
            } else {
                // 個別フォーマットチェック
                let formatError = null;
                if (fieldInfo.type === 'kana' && !/^[ァ-ヶー　]+$/.test(value)) {
                    formatError = `${fieldInfo.label}は全角カタカナで入力してください`;
                } else if (fieldInfo.type === 'phone' && !/^\d{10,11}$/.test(value)) {
                    formatError = '電話番号は10桁または11桁の数字で入力してください';
                } else if (fieldInfo.type === 'email' && !/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value)) {
                    formatError = '有効なメールアドレスを入力してください';
                } else if (fieldInfo.type === 'supplyPoint' && !/^\d{22}$/.test(value)) {
                    formatError = '供給地点特定番号は22桁の数字で入力してください';
                }
                // 他のフォーマットチェックが必要ならここに追加

                if (formatError) {
                    isError = true;
                    errorMessages.push(formatError);
                }
            }
        }

        if (isError) {
            isValid = false;
            if (fieldInfo.type !== 'checkbox') { // チェックボックス以外にエラークラス付与
                element.classList.add('error');
            } else {
                // チェックボックスの場合はラベルなどにスタイルを適用することを検討
                // element.closest('.checkbox-container')?.classList.add('error-checkbox');
            }
        }
    });

    // エラーメッセージがあれば表示
    if (!isValid) {
        showErrorModal([...new Set(errorMessages)]); // 重複削除して表示
    }

    return isValid;
}

// 初期表示時に①以外のセクションを非表示にする関数
function hideAllSectionsExceptFirst() {
    const sectionsToHide = [
        "contractor-info",
        "address",
        "payment-method",
        "payment-gas-yes",
        "payment-gas-no",
        "electricity-contract",
        "agreement-section",
        "application-notes-section",
        "submit-section",
        "gas-warning"
    ];
    sectionsToHide.forEach(function(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = "none";
        }
    });
}

// ページ読み込み時の処理
document.addEventListener("DOMContentLoaded", function () {
    try {
        hideAllSectionsExceptFirst();
        initSalesCode();
        setupGasUsageButtons();
        populateDateSelects(); 
        setupElectricCompanySelect();
        setupAgreementSection();
        setupSubmitButton();
        setupPaymentTypeSelect(); 
        setupNotificationTypeSelect(); 
    } catch (e) {
        console.error("初期化エラー:", e);
    }
});

/**
 * 収集したフォームデータをGASに非同期で送信する関数
 * @param {Object} data - collectFormData() で収集したデータ
 */
async function sendDataToGAS(data) {
   const submitBtn = document.getElementById('submit-btn');
   const originalButtonText = submitBtn.textContent;
   submitBtn.disabled = true;
   submitBtn.textContent = '検証中...';

   grecaptcha.ready(async () => {
       let recaptchaToken = null;
       try {
           // 1. reCAPTCHAトークン取得
           recaptchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' });

           submitBtn.textContent = '送信中...';

           // 2. 送信データ準備 (トークン含む)
           const dataToSend = {
               ...data,
               recaptchaToken: recaptchaToken
           };

           // 3. GASへFetchリクエスト送信
           try {
               const response = await fetch(GAS_WEB_APP_URL, {
                   method: 'POST',
                   mode: 'cors',
                   cache: 'no-cache',
                   headers: {
                       'Content-Type': 'text/plain'
                   },
                   redirect: 'follow',
                   body: JSON.stringify(dataToSend)
               });

               const result = await response.json(); 

               // 4. GASからのレスポンス処理
               if (result.status === 'success') {
                   // 成功時の処理 (完了モーダル表示)
                   const completionModal = document.getElementById('completion-modal');
                   if (completionModal) {
                       completionModal.style.display = 'block';
                   }
                   resetForm(); // フォームリセット
               } else {
                   // GASからエラーが返ってきた場合の処理
                   console.error('STEP 4: GAS Error:', result.message); // GASのエラーは残す
                   // エラーメッセージを解析してエラーモーダルに表示
                   let errorMessages = [];
                   if (result.message) {
                       if (result.message.startsWith('Input validation failed: ')) {
                           errorMessages = result.message.replace('Input validation failed: ', '').split(', ');
                       } else if (result.message.includes('reCAPTCHA verification failed:')) {
                           errorMessages = [result.message];
                        } else {
                           errorMessages = [`サーバー処理中にエラーが発生しました: ${result.message}`];
                        }
                   } else {
                       errorMessages = ['不明なサーバーエラーが発生しました。'];
                   }
                   showErrorModal(errorMessages);

                   // 申し込みボタンを元に戻す
                   submitBtn.disabled = false;
                   submitBtn.textContent = originalButtonText;
               }

           } catch (fetchError) {
               // Fetch自体が失敗した場合の処理
               console.error('STEP 4: Fetch Error:', fetchError); // 通信エラーは残す
               showErrorModal(['サーバーへの送信中に通信エラーが発生しました。ネットワーク接続を確認してください。']);

               // 申し込みボタンを元に戻す
               submitBtn.disabled = false;
               submitBtn.textContent = originalButtonText;
           }

       } catch (recaptchaError) {
           // reCAPTCHA取得エラーの処理
           console.error('STEP 4: reCAPTCHA execution error:', recaptchaError); // reCAPTCHAエラーは残す
           showErrorModal(['reCAPTCHAの読み込みまたは実行に失敗しました。ページを再読み込みするか、時間をおいてお試しください。']);

            // 申し込みボタンを元に戻す
           submitBtn.disabled = false;
           submitBtn.textContent = originalButtonText;
       }
   });
}

/**
 * エラーモーダルを表示する関数
 * @param {string[]} messages - 表示するエラーメッセージの配列
 */
function showErrorModal(messages) {
    const errorModal = document.getElementById('error-modal');
    const errorMessageList = document.getElementById('error-message-list');
    if (!errorModal || !errorMessageList) return;

    errorMessageList.innerHTML = ''; // 内容をクリア
    messages.forEach(msg => {
        const p = document.createElement('p');
        p.textContent = msg;
        errorMessageList.appendChild(p);
    });
    errorModal.style.display = 'block';

    // 閉じるボタンのイベント（一度だけ設定）
    const closeBtn = document.getElementById('error-modal-close-btn');
    if (closeBtn && !closeBtn.dataset.listenerAttached) {
         closeBtn.addEventListener('click', () => {
             errorModal.style.display = 'none';
         });
         closeBtn.dataset.listenerAttached = 'true'; // リスナー重複防止
    }
}

/**
 * フォームを初期状態にリセットする関数
 */
function resetForm() {
    // 全入力フィールド、セレクトボックスをクリア
    document.querySelectorAll('input, select').forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') {
            el.checked = false;
        } else if (el.tagName === 'SELECT') {
            el.selectedIndex = 0; // 最初のオプションを選択
        } else if (el.type !== 'hidden') { // hiddenはリセットしない
            el.value = '';
        }
        el.classList.remove('error'); // エラー表示も解除
    });

    // 選択状態のボタンをリセット
    document.querySelectorAll('.choice-btn.selected').forEach(btn => {
        btn.classList.remove('selected');
    });

    // 動的に表示/非表示されるセクションを初期状態に戻す
    hideAllSectionsExceptFirst();

    // 「その他」入力欄を非表示に
    const otherCompanyInput = document.getElementById("other-company-input");
    if (otherCompanyInput) otherCompanyInput.style.display = "none";

    // ダウンロードメッセージを非表示に
    const downloadMessage = document.getElementById('download-message');
    if (downloadMessage) downloadMessage.style.display = 'none';

    // 同意チェックボックスを無効化 & 未チェックに
    const agreementCheckbox = document.getElementById('agreement-checkbox');
    if (agreementCheckbox) {
        agreementCheckbox.checked = false;
        agreementCheckbox.disabled = true;
    }
    // ★ 注意事項確認チェックボックスを未チェックに
    const notesConfirmedCheckbox = document.getElementById('notes-confirmed-checkbox');
    if (notesConfirmedCheckbox) {
        notesConfirmedCheckbox.checked = false;
    }

    // 申し込みボタンを無効化
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '申し込む';
    }
}

/**
 * 現在のフォーム入力内容を収集してオブジェクトとして返す関数
 * @return {Object} フォームデータのキーと値を持つオブジェクト
 */
function collectFormData() {
    const formData = {
        gasUsage: document.querySelector('.choice-btn.selected')?.id === 'gas-yes' ? 'はい、都市ガスを利用しています' : 'いいえ、都市ガスを利用していません',
        salesCode: document.getElementById('sales-code-input')?.value || '-',
        lastName: document.getElementById('lastname')?.value.trim() || '',
        firstName: document.getElementById('firstname')?.value.trim() || '',
        lastNameKana: document.getElementById('lastname-kana')?.value.trim() || '',
        firstNameKana: document.getElementById('firstname-kana')?.value.trim() || '',
        birthYear: document.getElementById('birth-year')?.value || '',
        birthMonth: document.getElementById('birth-month')?.value || '',
        birthDay: document.getElementById('birth-day')?.value || '',
        phone: document.getElementById('phone')?.value.trim() || '',
        email: document.getElementById('email')?.value.trim() || '',
        fixedAddress: document.querySelector('.fixed-address')?.textContent || '鹿児島県',
        streetAddress: document.getElementById('street-address')?.value.trim() || '',
        buildingName: document.getElementById('building-name')?.value.trim() || '',
        paymentType: '', // 後で条件に応じて設定
        notificationType: '', // 後で条件に応じて設定
        electricCompanyRaw: document.getElementById('electric-company')?.value || '',
        otherElectricCompany: document.getElementById('other-company')?.value.trim() || '',
        customerNumber: document.getElementById('customer-number')?.value.trim() || '',
        supplyPointNumber: document.getElementById('supply-point-number')?.value.trim() || '',
        agreement: document.getElementById('agreement-checkbox')?.checked || false,
        notesConfirmed: document.getElementById('notes-confirmed-checkbox')?.checked || false
    };

    // 支払い方法と確認方法をガス利用状況に応じて設定
    if (document.getElementById('gas-yes')?.classList.contains('selected')) {
        formData.paymentType = '口座引き落とし (ガス利用あり)';
        formData.notificationType = '-'; // ガス利用時は選択肢なし
    } else if (document.getElementById('gas-no')?.classList.contains('selected')) {
        const paymentSelect = document.getElementById('payment-type');
        formData.paymentType = paymentSelect ? (paymentSelect.options[paymentSelect.selectedIndex]?.text || '') : ''; // 選択肢のテキスト
        const notificationSelect = document.getElementById('notification-type');
        formData.notificationType = notificationSelect ? (notificationSelect.options[notificationSelect.selectedIndex]?.text || '') : ''; // 選択肢のテキスト
    }

    // 電力会社名の処理
    const companySelect = document.getElementById('electric-company');
    if (formData.electricCompanyRaw === 'その他') {
        formData.electricCompany = `その他 (${formData.otherElectricCompany || '未入力'})`; // 他の会社名
    } else if (companySelect) {
         formData.electricCompany = companySelect.options[companySelect.selectedIndex]?.text || ''; // 選択肢のテキスト
    } else {
         formData.electricCompany = '';
    }

    // 不要になったプロパティを削除
    delete formData.electricCompanyRaw;
    delete formData.otherElectricCompany;

    return formData;
}