// --- 定数 ---
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzMLHxGK4kssFGuPWTov848_tO8UkdEhwC1DOr7HYgauTsClgDECx7UvshUyNrgm9z7dg/exec'; // GAS Web App URL
const RECAPTCHA_SITE_KEY = '6LfjFgUrAAAAAKZGVUxEgdoDr2lwh2xaDf6oj_0V'; // reCAPTCHA v3 Site Key

// --- 初期化関連 ---

/**
 * URLからクエリパラメータを解析する関数
 * @param {string} param - 取得したいパラメータ名
 * @returns {string|null} パラメータの値、存在しない場合は null
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * HTML特殊文字をエスケープする関数 (表示用)
 * @param {*} str - エスケープする値
 * @returns {string} エスケープされた文字列
 */
function escapeHTML(str) {
    if (typeof str !== 'string') {
        // 文字列でない場合は空文字にするか、そのまま文字列変換するか選択
        // return '';
         str = String(str);
    }
    return str
        .replace(/&/g, '&') // & を最初に置換
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039');
}

/**
 * 営業担当コードを取得して表示・設定する関数
 */
function initSalesCode() {
    const codeParam = getQueryParam("code");
    const salesCodeInput = document.getElementById("sales-code-input");
    const salesCodeDisplay = document.getElementById("sales-code-display");
    const salesCodeMapping = {
        "100": "郡元サービスショップ", "200": "中央サービスショップ", "300": "南部サービスショップ",
        "400": "草牟田サービスショップ", "500": "原良サービスショップ", "600": "エネフィル吉野",
        "700": "インスタッフ"
    };
    const validCodes = Object.keys(salesCodeMapping);

    if (salesCodeInput && salesCodeDisplay) {
        if (codeParam && validCodes.includes(codeParam)) {
            salesCodeInput.value = codeParam;
            salesCodeDisplay.textContent = escapeHTML(salesCodeMapping[codeParam]);
        } else {
            salesCodeInput.value = ""; // 不正値は空に
            salesCodeDisplay.textContent = "営業担当: -";
        }
    } else {
         console.error("営業担当コード関連の要素が見つかりません。");
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
    const startYear = currentYear - 110; // 110歳
    const endYear = currentYear - 18;  // 18歳

    // 西暦
    for (let year = endYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    // 月
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        monthSelect.appendChild(option);
    }
    // 日
    for (let day = 1; day <= 31; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day;
        daySelect.appendChild(option);
    }
}

/**
 * 初期表示時に最初の設問以外のセクションを非表示にする関数
 */
function hideAllSectionsExceptFirst() {
    const sectionsToHide = [
        "contractor-info", "address", "payment-method",
        "payment-gas-yes", "payment-gas-no", "notification-gas-yes", "notification-gas-no",
        "electricity-contract", "agreement-section", "application-notes-section",
        "submit-section", "gas-warning" // gas-warning があればそれも
    ];
    sectionsToHide.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = "none";
        }
    });
    // 初期表示では動的に表示される部分も非表示にしておく
    const paymentNotices = document.querySelectorAll('#payment-notice-container .payment-notice-item');
    paymentNotices.forEach(el => el.style.display = 'none');
    const notificationDetails = document.querySelectorAll('#notification-details .notification-detail-item');
    notificationDetails.forEach(el => el.style.display = 'none');
    const otherCompany = document.getElementById('other-company-input');
    if(otherCompany) otherCompany.style.display = 'none';
    const electricNameContainer = document.getElementById('electric-contract-name-container');
    if(electricNameContainer) electricNameContainer.style.display = 'none';
    const downloadMessage = document.getElementById('download-message');
    if(downloadMessage) downloadMessage.style.display = 'none';

}

// --- フォーム要素のイベントリスナー設定 ---

/**
 * ガス利用状況ボタンのクリックイベントを設定する関数
 */
function setupGasUsageButtons() {
    const gasYesBtn = document.getElementById("gas-yes");
    const gasNoBtn = document.getElementById("gas-no");
    const sections = { // 表示/非表示を制御するセクションID
        contractorInfo: document.getElementById("contractor-info"),
        address: document.getElementById("address"),
        paymentMethod: document.getElementById("payment-method"),
        paymentGasYes: document.getElementById("payment-gas-yes"),
        paymentGasNo: document.getElementById("payment-gas-no"),
        notificationGasYes: document.getElementById("notification-gas-yes"),
        notificationGasNo: document.getElementById("notification-gas-no"),
        electricityContract: document.getElementById("electricity-contract"),
        agreementSection: document.getElementById("agreement-section"),
        applicationNotesSection: document.getElementById("application-notes-section"),
        submitSection: document.getElementById("submit-section")
    };
    const paymentTypeSelect = document.getElementById('payment-type');
    const notificationTypeSelect = document.getElementById('notification-type');

    if (!gasYesBtn || !gasNoBtn || !paymentTypeSelect || !notificationTypeSelect) {
        console.error("ガス利用状況ボタンまたは関連セレクトが見つかりません。");
        return;
    }

    function showSections(isGasYes) {
        // 共通で表示するセクション
        if (sections.contractorInfo) sections.contractorInfo.style.display = "block";
        if (sections.address) sections.address.style.display = "block";
        if (sections.paymentMethod) sections.paymentMethod.style.display = "block";
        if (sections.electricityContract) sections.electricityContract.style.display = "block";
        if (sections.agreementSection) sections.agreementSection.style.display = "block";
        if (sections.applicationNotesSection) sections.applicationNotesSection.style.display = "block";
        if (sections.submitSection) sections.submitSection.style.display = "block";

        // ガス利用状況に応じて切り替えるセクション
        if (sections.paymentGasYes) sections.paymentGasYes.style.display = isGasYes ? "block" : "none";
        if (sections.paymentGasNo) sections.paymentGasNo.style.display = isGasYes ? "none" : "block";
        if (sections.notificationGasYes) sections.notificationGasYes.style.display = isGasYes ? "block" : "none";
        if (sections.notificationGasNo) sections.notificationGasNo.style.display = isGasYes ? "none" : "block";

        // 必須属性の切り替え
        if (isGasYes) {
            paymentTypeSelect.removeAttribute('required');
            paymentTypeSelect.classList.remove('error');
            notificationTypeSelect.removeAttribute('required');
            notificationTypeSelect.classList.remove('error');
        } else {
            paymentTypeSelect.setAttribute('required', '');
            notificationTypeSelect.setAttribute('required', '');
        }
    }

    gasYesBtn.addEventListener("click", function() {
        gasYesBtn.classList.add("selected");
        gasNoBtn.classList.remove("selected");
        showSections(true);
    });

    gasNoBtn.addEventListener("click", function() {
        gasNoBtn.classList.add("selected");
        gasYesBtn.classList.remove("selected");
        showSections(false);
    });
}

/**
 * 電力会社の「その他」選択時の処理を設定する関数
 */
function setupElectricCompanySelect() {
    const electricCompanySelect = document.getElementById("electric-company");
    const otherCompanyInputDiv = document.getElementById("other-company-input");
    const otherCompanyInput = document.getElementById("other-company");

    if (!electricCompanySelect || !otherCompanyInputDiv || !otherCompanyInput) {
        console.warn("電力会社関連の要素が見つかりません。");
        return;
    }

    electricCompanySelect.addEventListener("change", function() {
        const isOtherSelected = this.value === "その他";
        otherCompanyInputDiv.style.display = isOtherSelected ? "block" : "none";
        if (isOtherSelected) {
            otherCompanyInput.setAttribute("required", "");
        } else {
            otherCompanyInput.removeAttribute("required");
            otherCompanyInput.value = "";
            otherCompanyInput.classList.remove('error'); // エラー解除
        }
    });
}

/**
 * 重要事項説明ダウンロードと同意チェックボックス有効化を設定する関数
 */
function setupAgreementSection() {
    const downloadBtn = document.getElementById('download-btn');
    const agreementCheckbox = document.getElementById('agreement-checkbox');
    const downloadMessage = document.getElementById('download-message');
    const allowedFiles = ['txt/重要事項説明書.pdf']; // 許可するファイルパス

    if (!downloadBtn || !agreementCheckbox || !downloadMessage) {
        console.warn("重要事項説明関連の要素が見つかりません。");
        return;
    }

    downloadBtn.addEventListener('click', function(event) {
        event.preventDefault(); // デフォルトのリンク動作をキャンセル
        const filePath = this.getAttribute('href');

        if (allowedFiles.includes(filePath)) {
            // 新しいタブでファイルを開く（ダウンロードor表示）
            window.open(filePath, '_blank');

            // 少し待ってからメッセージ表示＆チェックボックス有効化
            setTimeout(() => {
                downloadMessage.style.display = 'block';
                agreementCheckbox.disabled = false;
            }, 500); // 0.5秒後に実行
        } else {
            console.error('許可されていないファイルパスが指定されました:', filePath);
            alert('指定されたファイルを開けませんでした。');
        }
    });
}

/**
 * お支払い方法の選択に応じて補足説明を表示する関数
 */
function setupPaymentTypeSelect() {
    const paymentSelect = document.getElementById('payment-type');
    const noticeContainer = document.getElementById('payment-notice-container');

    if (!paymentSelect || !noticeContainer) {
        console.warn("支払い方法関連の要素が見つかりません。");
        return;
    }
    const noticeItems = noticeContainer.querySelectorAll('.payment-notice-item');

    paymentSelect.addEventListener('change', function() {
        const selectedValue = this.value;
        noticeItems.forEach(item => {
            // item.id が "payment-notice-{selectedValue}" と一致するかで判定
            item.style.display = item.id === `payment-notice-${selectedValue}` ? 'block' : 'none';
        });
    });
}

/**
 * 電気使用量・料金のご確認方法の選択に応じて補足説明を表示する関数
 */
function setupNotificationTypeSelect() {
    const notificationSelect = document.getElementById('notification-type');
    const detailsContainer = document.getElementById('notification-details');

    if (!notificationSelect || !detailsContainer) {
        console.warn("確認方法関連の要素が見つかりません。");
        return;
    }
    const detailItems = detailsContainer.querySelectorAll('.notification-detail-item');

    notificationSelect.addEventListener('change', function() {
        const selectedValue = this.value;
        detailItems.forEach(item => {
            item.style.display = item.id === `notification-detail-${selectedValue}` ? 'block' : 'none';
        });
    });
}

/**
 * 電気契約者名義のチェックボックスとテキストボックスを制御する関数
 */
function setupElectricContractNameField() {
    const checkbox = document.getElementById('same-contractor-name-checkbox');
    const nameContainer = document.getElementById('electric-contract-name-container');
    const nameInput = document.getElementById('electric-contract-name-input');
    const nameLabel = document.querySelector('label[for="electric-contract-name-input"]');

    if (!checkbox || !nameContainer || !nameInput || !nameLabel) {
        console.warn("電気契約者名義の要素が見つかりません。");
        return;
    }

    function updateFieldState(isChecked) {
        nameContainer.style.display = isChecked ? 'none' : 'block';
        if (isChecked) {
            nameInput.removeAttribute('required');
            nameInput.value = ''; // チェック時はクリア
            nameInput.classList.remove('error');
            nameLabel.classList.remove('required-active'); // CSSで制御するクラス
        } else {
            nameInput.setAttribute('required', '');
            nameLabel.classList.add('required-active');
        }
    }

    // 初期状態設定
    updateFieldState(checkbox.checked);

    // イベントリスナー
    checkbox.addEventListener('change', function() {
        updateFieldState(this.checked);
    });
}

/**
 * 申し込みボタンの有効/無効状態とクリックイベントを設定する関数 (ダブルクリック対策強化版)
 */
function setupSubmitButton() {
    const agreementCheckbox = document.getElementById('agreement-checkbox');
    const notesConfirmedCheckbox = document.getElementById('notes-confirmed-checkbox'); // 注意事項チェックボックスも考慮
    const submitBtn = document.getElementById('submit-btn');
    const completionModal = document.getElementById('completion-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    let isSubmitting = false; // 処理中フラグ

    if (!agreementCheckbox || !notesConfirmedCheckbox || !submitBtn || !completionModal || !modalCloseBtn) {
        console.error("申し込みボタンまたは関連要素が見つかりません。");
        return;
    }

    function updateSubmitButtonState() {
        // isSubmitting でない、かつ両方のチェックボックスが ON の場合に有効
        submitBtn.disabled = isSubmitting || !agreementCheckbox.checked || !notesConfirmedCheckbox.checked;
    }

    // 初期状態設定
    updateSubmitButtonState();

    // 各チェックボックスの状態変更時にボタン状態を更新
    agreementCheckbox.addEventListener('change', updateSubmitButtonState);
    notesConfirmedCheckbox.addEventListener('change', updateSubmitButtonState);

    // 完了モーダル閉じるボタン
    modalCloseBtn.addEventListener('click', function() {
        completionModal.style.display = 'none';
    });

    // 申し込みボタンクリックイベント
    submitBtn.addEventListener('click', async function() {
        if (isSubmitting) {
            console.log("送信処理中です。");
            return; // 処理中は何もしない
        }

        isSubmitting = true;
        updateSubmitButtonState(); // ボタンを無効化
        const originalButtonText = submitBtn.textContent;
        submitBtn.textContent = '処理中...';

        try {
            if (validateForm()) {
                const formData = collectFormData();
                await sendDataToGAS(formData); // 送信処理を待つ
                // 成功時は sendDataToGAS 内で resetForm が呼ばれる
                // resetForm 内でボタン状態は初期化されるはずだが、念のためテキストを戻す
                 submitBtn.textContent = originalButtonText; // 通常は resetForm 内で '申し込む' に戻る

            } else {
                // バリデーション失敗時
                console.log("バリデーションエラーのため送信中止");
                // エラーモーダルは validateForm 内で表示される
                 submitBtn.textContent = originalButtonText; // テキストだけ戻す
            }
        } catch (error) {
            // sendDataToGAS で reject された場合など
            console.error("申し込み処理中にエラー:", error);
            // エラーモーダルは sendDataToGAS 内で表示されるはず
             submitBtn.textContent = originalButtonText; // テキストだけ戻す
        } finally {
            // 成功・失敗に関わらず最終的にフラグを戻し、ボタン状態を再評価
            isSubmitting = false;
            updateSubmitButtonState();
        }
    });
}

// --- バリデーション ---

/**
 * フォーム全体の入力値を検証する関数
 * @returns {boolean} 検証結果 (true: OK, false: NG)
 */
function validateForm() {
    let isValid = true;
    let errorMessages = [];
    const isSameNameChecked = document.getElementById('same-contractor-name-checkbox')?.checked;
    const isGasNoSelected = document.getElementById('gas-no')?.classList.contains('selected');
    const isOtherCompanySelected = document.getElementById('electric-company')?.value === 'その他';

    const fieldsToValidate = [
        { id: 'lastname', label: '姓', type: 'text', required: true },
        { id: 'firstname', label: '名', type: 'text', required: true },
        { id: 'lastname-kana', label: 'セイ', type: 'kana', required: true },
        { id: 'firstname-kana', label: 'メイ', type: 'kana', required: true },
        { id: 'birth-year', label: '生年月日(西暦)', type: 'select', required: true },
        { id: 'birth-month', label: '生年月日(月)', type: 'select', required: true },
        { id: 'birth-day', label: '生年月日(日)', type: 'select', required: true },
        { id: 'phone', label: 'お電話番号', type: 'phone', required: true },
        { id: 'email', label: 'メールアドレス', type: 'email', required: true },
        { id: 'address-city-town-chome', label: '市・町・丁目', type: 'text', required: true },
        { id: 'address-banchi', label: '番地', type: 'text', required: true },
        // 条件付き必須フィールド
        { id: 'electric-contract-name-input', label: '電気契約者名義', type: 'text', required: !isSameNameChecked },
        { id: 'electric-company', label: '電力会社', type: 'select', required: true }, // 電力会社自体は常に必須
        { id: 'other-company', label: 'その他の電力会社名', type: 'text', required: isOtherCompanySelected },
        { id: 'customer-number', label: 'お客様番号', type: 'text', required: true },
        { id: 'supply-point-number', label: '供給地点特定番号', type: 'supplyPoint', required: true },
        { id: 'payment-type', label: 'お支払方法', type: 'select', required: isGasNoSelected },
        { id: 'notification-type', label: 'ご確認方法', type: 'select', required: isGasNoSelected },
        // 同意チェックボックス
        { id: 'agreement-checkbox', label: '重要事項説明への同意', type: 'checkbox', required: true },
        { id: 'notes-confirmed-checkbox', label: '注意事項の確認', type: 'checkbox', required: true },
    ];

    // エラークラスを一旦全削除 & エラーメッセージ表示用spanもクリア(あれば)
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    // document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

    fieldsToValidate.forEach(fieldInfo => {
        const element = document.getElementById(fieldInfo.id);

        // 要素が存在しない、または必須でない場合はスキップ
        if (!element || !fieldInfo.required) {
             // スキップ対象外なのに要素が見つからない場合は警告
             if (fieldInfo.required && !element) {
                  console.warn(`必須要素が見つかりません: ID="${fieldInfo.id}"`);
             }
            return;
        }

        let value = '';
        let isError = false;
        let specificErrorMessage = ''; // 個別のエラーメッセージ

        if (fieldInfo.type === 'checkbox') {
            if (!element.checked) {
                isError = true;
                specificErrorMessage = `${fieldInfo.label}が必要です`;
            }
        } else if (fieldInfo.type === 'select') {
            if (!element.value) {
                isError = true;
                if (fieldInfo.id.startsWith('birth')) {
                     specificErrorMessage = '生年月日を選択してください'; // 集約メッセージ
                 } else {
                    specificErrorMessage = `${fieldInfo.label}を選択してください`;
                }
            }
            // 生年月日の日付妥当性チェック (値が全て選択されている場合)
            if (fieldInfo.id === 'birth-day' && !isError) { // 日までチェック済みの場合
                 const year = document.getElementById('birth-year').value;
                 const month = document.getElementById('birth-month').value;
                 const day = element.value;
                 if (year && month && day) {
                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      if (!(date.getFullYear() === parseInt(year) && date.getMonth() === parseInt(month) - 1 && date.getDate() === parseInt(day))) {
                           isError = true;
                           specificErrorMessage = '有効な生年月日を選択してください';
                      }
                 }
            }
        } else { // text, kana, phone, email, supplyPoint など
            value = element.value.trim();
            if (!value) {
                isError = true;
                specificErrorMessage = `${fieldInfo.label}を入力してください`;
            } else {
                // 個別フォーマットチェック
                if (fieldInfo.type === 'kana' && !/^[ァ-ヶー　]+$/.test(value)) {
                    isError = true; specificErrorMessage = `${fieldInfo.label}は全角カタカナで入力してください`;
                } else if (fieldInfo.type === 'phone' && !/^\d{10,11}$/.test(value)) {
                    isError = true; specificErrorMessage = '電話番号は10桁または11桁の数字で入力してください';
                } else if (fieldInfo.type === 'email' && !/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value)) {
                    isError = true; specificErrorMessage = '有効なメールアドレスを入力してください';
                } else if (fieldInfo.type === 'supplyPoint' && !/^\d{22}$/.test(value)) {
                    isError = true; specificErrorMessage = '供給地点特定番号は22桁の数字で入力してください';
                }
            }
        }

        // エラーがあればフラグを立て、エラーメッセージを追加、要素にエラークラス付与
        if (isError) {
            isValid = false;
            // エラーメッセージの重複を避ける（特に生年月日）
             if (specificErrorMessage && !errorMessages.includes(specificErrorMessage)) {
                errorMessages.push(specificErrorMessage);
            }
            // エラー箇所のスタイル設定
            if (fieldInfo.type !== 'checkbox') {
                element.classList.add('error');
                 // 生年月日は関連要素全てにエラークラス
                 if (fieldInfo.id.startsWith('birth')) {
                     document.getElementById('birth-year')?.classList.add('error');
                     document.getElementById('birth-month')?.classList.add('error');
                     document.getElementById('birth-day')?.classList.add('error');
                 }
                 // エラーメッセージ表示用spanがあれば利用 (任意)
                 // const errorSpan = document.getElementById(`${fieldInfo.id}-error`);
                 // if(errorSpan) errorSpan.textContent = specificErrorMessage;

            } else {
                 // チェックボックス自体や親要素にスタイルを当てる場合
                 // element.closest('.checkbox-container')?.classList.add('error-highlight');
            }
        } else {
             // エラーがなければエラークラスを削除（生年月日も含む）
             if (fieldInfo.id.startsWith('birth')) {
                 // 他の生年月日フィールドでエラーが出ていないか確認してから削除
                 if (!errorMessages.includes('生年月日を選択してください') && !errorMessages.includes('有効な生年月日を選択してください')) {
                     document.getElementById('birth-year')?.classList.remove('error');
                     document.getElementById('birth-month')?.classList.remove('error');
                     document.getElementById('birth-day')?.classList.remove('error');
                 }
             } else if (fieldInfo.type !== 'checkbox') {
                 element.classList.remove('error');
                 // エラーメッセージ表示用spanがあればクリア (任意)
                 // const errorSpan = document.getElementById(`${fieldInfo.id}-error`);
                 // if(errorSpan) errorSpan.textContent = '';
             }
        }
    });

    // エラーメッセージがあればモーダル表示
    if (!isValid) {
        showErrorModal(errorMessages); // 重複はここで削除済み
    }

    return isValid;
}

// --- データ収集 ---

/**
 * 現在のフォーム入力内容を収集してオブジェクトとして返す関数
 * @returns {Object} フォームデータのキーと値を持つオブジェクト
 */
function collectFormData() {
    const isSameNameChecked = document.getElementById('same-contractor-name-checkbox')?.checked;
    const contractorLastName = document.getElementById('lastname')?.value.trim() || '';
    const contractorFirstName = document.getElementById('firstname')?.value.trim() || '';
    const isGasYesSelected = document.getElementById('gas-yes')?.classList.contains('selected');

    const formData = {
        gasUsage: isGasYesSelected ? 'はい、都市ガスを利用しています' : 'いいえ、都市ガスを利用していません',
        salesCode: document.getElementById('sales-code-input')?.value || '-',
        lastName: contractorLastName,
        firstName: contractorFirstName,
        lastNameKana: document.getElementById('lastname-kana')?.value.trim() || '',
        firstNameKana: document.getElementById('firstname-kana')?.value.trim() || '',
        birthYear: document.getElementById('birth-year')?.value || '',
        birthMonth: document.getElementById('birth-month')?.value || '',
        birthDay: document.getElementById('birth-day')?.value || '',
        phone: document.getElementById('phone')?.value.trim() || '',
        email: document.getElementById('email')?.value.trim() || '',
        fixedAddress: document.querySelector('.fixed-address')?.textContent || '鹿児島県',
        addressCityTownChome: document.getElementById('address-city-town-chome')?.value.trim() || '',
        addressBanchi: document.getElementById('address-banchi')?.value.trim() || '',
        buildingName: document.getElementById('building-name')?.value.trim() || '',
        paymentType: '', // 後で設定
        notificationType: '', // 後で設定
        // ★ electricContractName: チェック状態に応じて設定
        electricContractName: isSameNameChecked
                                ? `${contractorLastName} ${contractorFirstName}`.trim() // チェックONなら契約者氏名 (空白トリム追加)
                                : (document.getElementById('electric-contract-name-input')?.value.trim() || ''), // チェックOFFなら入力値
        electricCompanyRaw: document.getElementById('electric-company')?.value || '', // 送信用一時キー
        otherElectricCompany: document.getElementById('other-company')?.value.trim() || '',
        electricCompany: '', // メール・GAS側で使用する最終的な会社名
        customerNumber: document.getElementById('customer-number')?.value.trim() || '',
        supplyPointNumber: document.getElementById('supply-point-number')?.value.trim() || '',
        agreement: document.getElementById('agreement-checkbox')?.checked || false,
        notesConfirmed: document.getElementById('notes-confirmed-checkbox')?.checked || false
    };

    // 支払い方法と確認方法を設定
    if (isGasYesSelected) {
        formData.paymentType = '口座引き落とし (ガス利用あり)';
        formData.notificationType = '紙面（ガス検針票と同時発行）';
    } else {
        const paymentSelect = document.getElementById('payment-type');
        formData.paymentType = paymentSelect ? (paymentSelect.options[paymentSelect.selectedIndex]?.text || '') : '';
        const notificationSelect = document.getElementById('notification-type');
        formData.notificationType = notificationSelect ? (notificationSelect.options[notificationSelect.selectedIndex]?.text || '') : '';
    }

    // 電力会社名の最終的な値を設定
    const companySelect = document.getElementById('electric-company');
    if (formData.electricCompanyRaw === 'その他') {
        formData.electricCompany = `その他 (${formData.otherElectricCompany || '未入力'})`;
    } else if (companySelect) {
         formData.electricCompany = companySelect.options[companySelect.selectedIndex]?.text || '';
    }

    // 不要になった一時キーを削除
    delete formData.electricCompanyRaw;
    // otherElectricCompany は GAS側で使うかもしれないので残しても良い（今回は electricCompany に含めた）
    // delete formData.otherElectricCompany;

    return formData;
}


// --- データ送信・処理 ---

/**
 * 収集したフォームデータをGASに非同期で送信する関数 (Promise版)
 * @param {Object} data - collectFormData() で収集したデータ
 * @returns {Promise} GAS処理結果を含むPromiseオブジェクト
 */
function sendDataToGAS(data) {
    const submitBtn = document.getElementById('submit-btn'); // ボタン取得はここでも良い

    return new Promise((resolve, reject) => {
        submitBtn.textContent = '検証中...'; // ボタンテキスト変更

        grecaptcha.ready(async () => {
            try {
                const recaptchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' });
                submitBtn.textContent = '送信中...';

                const dataToSend = { ...data, recaptchaToken }; // トークンを追加

                const response = await fetch(GAS_WEB_APP_URL, {
                    method: 'POST',
                    mode: 'cors',
                    cache: 'no-cache',
                    headers: { 'Content-Type': 'text/plain' }, // GAS側がJSON.parseするのでtext/plainで送る
                    redirect: 'follow',
                    body: JSON.stringify(dataToSend) // JSON文字列にして送信
                });

                // HTTPステータスコードが 200 OK でない場合のエラーハンドリング
                if (!response.ok) {
                    const errorText = await response.text(); // エラーレスポンス本文を取得試行
                    console.error(`GAS HTTP Error Status: ${response.status}, Response: ${errorText}`);
                    // ユーザーに見せるメッセージを検討
                     let userMessage = `サーバーからの応答エラー (${response.status})。`;
                     if (response.status === 500) userMessage = 'サーバー内部でエラーが発生しました。';
                     else if (response.status === 404) userMessage = '送信先が見つかりません。';
                     // 必要に応じて他のステータスコード対応を追加
                    throw new Error(userMessage); // エラーとして処理を進める
                }

                // レスポンスボディをJSONとして解析
                const result = await response.json();

                // GAS側からの処理結果を確認
                if (result.status === 'success') {
                    const completionModal = document.getElementById('completion-modal');
                    if (completionModal) completionModal.style.display = 'block';
                    resetForm(); // 成功時にフォームをリセット
                    resolve(result); // Promiseを解決
                } else {
                    // GAS側で 'error' ステータスが返された場合
                    console.error('GAS Logic Error:', result.message);
                    showErrorModal([result.message || 'サーバー処理中に不明なエラーが発生しました。']);
                    reject(new Error(result.message || 'GAS Logic Error')); // Promiseを拒否
                }

            } catch (error) { // fetch自体、JSON解析、reCAPTCHA、GAS処理エラーなど
                console.error('sendDataToGAS内のエラー:', error);
                let errorMessage = 'サーバーへの送信または応答の処理中にエラーが発生しました。';
                 if (error.message.includes('reCAPTCHA')) {
                    errorMessage = 'reCAPTCHAの読み込みまたは実行に失敗しました。';
                 } else if (error.message.includes('サーバーからの応答エラー') || error.message.includes('サーバー内部でエラー')) {
                     errorMessage = error.message; // HTTPエラー時のメッセージを使用
                 } else if (navigator.onLine === false) {
                     errorMessage = 'ネットワーク接続がありません。接続を確認してください。';
                 }
                showErrorModal([errorMessage]);
                reject(error); // Promiseを拒否
            }
        }); // grecaptcha.ready
    }); // new Promise
}


/**
 * エラーモーダルを表示する関数
 * @param {string[]} messages - 表示するエラーメッセージの配列
 */
function showErrorModal(messages) {
    const errorModal = document.getElementById('error-modal');
    const errorMessageList = document.getElementById('error-message-list');
    const closeBtn = document.getElementById('error-modal-close-btn');

    if (!errorModal || !errorMessageList || !closeBtn) {
        console.error("エラーモーダル関連の要素が見つかりません。");
        // alert(messages.join('\n')); // モーダルがない場合の代替
        return;
    }

    errorMessageList.innerHTML = ''; // 内容をクリア
    messages.forEach(msg => {
        const p = document.createElement('p');
        p.textContent = escapeHTML(msg); // メッセージもエスケープ推奨
        errorMessageList.appendChild(p);
    });
    errorModal.style.display = 'block';

    // 閉じるボタンのイベントリスナー（重複登録防止）
    if (!closeBtn.dataset.listenerAttached) {
         closeBtn.addEventListener('click', () => {
             errorModal.style.display = 'none';
         });
         closeBtn.dataset.listenerAttached = 'true';
    }
}

/**
 * フォームを初期状態にリセットする関数
 */
function resetForm() {
    // 全入力フィールド、セレクトボックスをクリア
    document.querySelectorAll('input, select').forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') {
            // 電気契約名義チェックボックスは初期値(true)に戻す
            el.checked = (el.id === 'same-contractor-name-checkbox');
        } else if (el.tagName === 'SELECT') {
            el.selectedIndex = 0;
        } else if (el.type !== 'hidden') {
            el.value = '';
        }
        el.classList.remove('error'); // エラー表示解除
    });

    // 選択状態のボタンをリセット
    document.querySelectorAll('.choice-btn.selected').forEach(btn => {
        btn.classList.remove('selected');
    });

    // 動的に表示/非表示されるセクションを初期状態に戻す
    hideAllSectionsExceptFirst(); // 最初の設問以外を非表示

    // setupElectricContractNameField を呼び出して表示/必須状態を整合
    setupElectricContractNameField();

    // ダウンロードメッセージ非表示 & 同意チェックボックス初期化
    const downloadMessage = document.getElementById('download-message');
    if (downloadMessage) downloadMessage.style.display = 'none';
    const agreementCheckbox = document.getElementById('agreement-checkbox');
    if (agreementCheckbox) {
        agreementCheckbox.checked = false;
        agreementCheckbox.disabled = true;
    }
    // 注意事項チェックボックスもリセット (checked = false)
    const notesConfirmedCheckbox = document.getElementById('notes-confirmed-checkbox');
    if (notesConfirmedCheckbox) {
        notesConfirmedCheckbox.checked = false;
    }

    // 申し込みボタンを初期状態（通常は無効）に戻す
    const submitBtn = document.getElementById('submit-btn');
     if (submitBtn && agreementCheckbox && notesConfirmedCheckbox) {
         submitBtn.disabled = true; // agreementCheckbox, notesConfirmedCheckbox が false のはずなので無効
         submitBtn.textContent = '申し込む';
     }
}


// --- ページ読み込み時の処理 ---
document.addEventListener("DOMContentLoaded", function () {
    try {
        hideAllSectionsExceptFirst();
        initSalesCode();
        populateDateSelects();
        setupGasUsageButtons();
        setupElectricCompanySelect();
        setupAgreementSection();
        setupPaymentTypeSelect();
        setupNotificationTypeSelect();
        setupElectricContractNameField();
        setupSubmitButton();
    } catch (e) {
        console.error("初期化中にエラーが発生しました:", e);
        alert("ページの読み込み中にエラーが発生しました。ページを再読み込みしてください。");
    }
});