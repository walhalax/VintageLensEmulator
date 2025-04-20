document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 要素の取得 ---
    const imageInput = document.getElementById('image-input');
    const saveButton = document.getElementById('save-button');
    const previewContainer = document.querySelector('.image-preview-container');
    const previewImage = document.getElementById('preview-image');
    const placeholderText = document.getElementById('placeholder-text');
    const loupe = document.getElementById('loupe');
    const loupeControlsContainer = document.querySelector('.loupe-controls');
    const loupeToggle = document.getElementById('loupe-toggle');
    const loupeToggleLabelOff = document.querySelector('.toggle-label-off');
    const loupeToggleLabelOn = document.querySelector('.toggle-label-on');
    // const loupeDrawerContent = document.querySelector('.loupe-drawer-content'); // .openクラスで制御
    const loupeZoomSlider = document.getElementById('loupe-zoom');
    const loupeZoomValueSpan = document.getElementById('loupe-zoom-value');
    const loupeSizeSlider = document.getElementById('loupe-size-factor');
    const loupeSizeValueSpan = document.getElementById('loupe-size-value');
    const adjustmentControls = document.querySelector('.adjustment-controls');
    const temperatureSlider = document.getElementById('temperature');
    const temperatureValueSpan = document.getElementById('temperature-value');
    const lensCategoryButtons = document.querySelectorAll('.category-button');
    const lensListContainer = document.querySelector('.lens-list');
    const lensDetailsContainer = document.getElementById('lens-details');

    // --- 状態管理 ---
    let currentImage = null;
    let currentLens = null;
    let originalImageData = null;
    let adjustments = {
        brightness: 100, contrast: 100, saturation: 100, sharpness: 0,
        exposure: 0, grain: 0, temperature: 6500, tint: 0, mist: 0,
    };
    let isLoupeEnabled = false;
    let zoomFactor = 3;
    let loupeSizeFactor = 1.3;
    let baseLoupeSize = 0;
    let loupeSize = 0;
    let loupeTimer = null;
    const LOUPE_DELAY = 1000; // 1秒
    let lastMousePos = { x: 0, y: 0 };
    let isMouseInsidePreview = false;

    // --- レンズデータ ---
    const allLenses = [ /* ... レンズデータ省略 ... */
        { id: 'elmarit-21-f28', name: 'Elmarit-M 21mm f/2.8', category: 'wide', year: 1980, description: '超広角レンズ。ダイナミックな風景写真に。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'summicron-28-f2', name: 'Summicron-M 28mm f/2 ASPH.', category: 'wide', year: 2000, description: '高性能な大口径広角レンズ。シャープな描写。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'elmarit-28-f28-v4', name: 'Elmarit-M 28mm f/2.8 (IV)', category: 'wide', year: 1993, description: 'コンパクトな広角レンズ。風景やスナップに。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'summaron-35-f28', name: 'Summaron 35mm f/2.8', category: 'wide', year: 1958, description: 'クラシックな描写が楽しめる広角レンズ。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'summicron-35-f2-v4', name: 'Summicron-M 35mm f/2 (IV "Bokeh King")', category: 'wide', year: 1979, description: '「ボケキング」として知られる人気の35mm。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'summilux-35-f14-pre', name: 'Summilux 35mm f/1.4 (Pre-ASPH)', category: 'wide', year: 1961, description: '独特のフレアとボケを持つ伝説的なレンズ。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'summicron-50-f2-rigid', name: 'Summicron 50mm f/2 (Rigid)', category: 'standard', year: 1956, description: '初期の代表的な標準レンズ。高い解像力。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'summicron-50-f2-dr', name: 'Summicron 50mm f/2 (DR)', category: 'standard', year: 1956, description: '近接撮影可能なDual Rangeモデル。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'summicron-50-f2-v5', name: 'Summicron 50mm f/2 (V)', category: 'standard', year: 1979, description: '現代的な性能を持つ標準レンズの決定版。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'summilux-50-f14-v2', name: 'Summilux-M 50mm f/1.4 (E46, Pre-ASPH)', category: 'standard', year: 1961, description: '柔らかな描写と美しいボケが特徴。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'noctilux-50-f1', name: 'Noctilux 50mm f/1.0', category: 'standard', year: 1976, description: '驚異的な明るさ。開放での独特な描写。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'elmar-50-f28', name: 'Elmar-M 50mm f/2.8', category: 'standard', year: 1994, description: '沈胴式のコンパクトな標準レンズ。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'summilux-75-f14', name: 'Summilux 75mm f/1.4', category: 'telephoto', year: 1980, description: '大口径中望遠。ポートレートに最適。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'summicron-90-f2-preapo', name: 'Summicron-M 90mm f/2 (Pre-APO)', category: 'telephoto', year: 1980, description: 'クラシックな描写の90mm F2。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'tele-elmarit-90-f28', name: 'Tele-Elmarit-M 90mm f/2.8', category: 'telephoto', year: 1964, description: '軽量コンパクトな望遠レンズ。「Fat」と「Thin」がある。', imageUrl: 'images/lens_placeholder.png' },
        { id: 'elmarit-135-f28', name: 'Elmarit-M 135mm f/2.8', category: 'telephoto', year: 1963, description: 'ビューファインダー倍率を上げるメガネ付き望遠レンズ。', imageUrl: 'images/lens_placeholder.png' },
    ];

    // --- イベントリスナー ---

    // 画像読み込み (修正) ★
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                originalImageData = e.target.result;
                previewImage.onload = () => {
                    previewImage.style.display = 'block';
                    placeholderText.style.display = 'none';
                    loupe.style.backgroundImage = `url('${originalImageData}')`;
                    // ★ requestAnimationFrame を使って、次の描画フレームで実行
                    requestAnimationFrame(() => {
                        calculateBaseLoupeSize();
                        applyLoupeSizeFactor();
                        applyPreviewAdjustments(); // ★ プレビュー更新を確実に行う
                    });
                    previewImage.onload = null;
                };
                previewImage.onerror = () => {
                    console.error('Image load error.'); // デバッグ用
                    alert('画像の表示に失敗しました。');
                    resetPreview();
                };
                previewImage.src = originalImageData;
                currentImage = file;
            }
            reader.onerror = () => {
                 console.error('File read error.'); // デバッグ用
                 alert('ファイルの読み込み処理に失敗しました。');
                 resetPreview();
            };
            reader.readAsDataURL(file);
        } else if (file) {
            alert('画像ファイルを選択してください。');
            resetPreview();
            imageInput.value = '';
        }
    });

    // 画像保存 (変更なし)
    saveButton.addEventListener('click', downloadImageWithAdjustments);

    // パラメータ調整 (スライダー) (修正) ★
    adjustmentControls.addEventListener('input', (event) => {
        const target = event.target;
        if (target.type === 'range') {
            const name = target.name;
            const value = target.value;
            // console.log(`Adjusting ${name} to ${value}`); // デバッグ用
            if (adjustments.hasOwnProperty(name)) {
                adjustments[name] = parseFloat(value);
            }
            updateAdjustmentValueDisplay(name, value);
            applyPreviewAdjustments(); // ★ プレビュー更新
        }
    });

    // 色温度スライダーのイベントリスナー (変更なし)
    temperatureSlider.addEventListener('input', (event) => {
        adjustments.temperature = parseInt(event.target.value, 10);
        updateAdjustmentValueDisplay('temperature', event.target.value);
        applyPreviewAdjustments();
    });


    // レンズカテゴリフィルター (修正) ★
    lensCategoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // console.log('Category button clicked:', button.dataset.category); // デバッグ用
            lensCategoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const category = button.dataset.category;
            displayLenses(category); // ★ レンズリスト再表示
        });
    });

    // レンズ選択 (修正) ★
    lensListContainer.addEventListener('click', (event) => {
        const lensItem = event.target.closest('.lens-item');
        // console.log('Clicked inside lens list container. Target:', event.target, 'Closest item:', lensItem); // デバッグ用
        if (lensItem && lensItem.dataset.lensId) {
            const lensId = lensItem.dataset.lensId;
            // console.log('Lens item clicked, ID:', lensId); // デバッグ用
            selectLens(lensId);
            // 選択状態の更新
            Array.from(lensListContainer.querySelectorAll('.lens-item')).forEach(item => {
                item.classList.remove('selected');
            });
            lensItem.classList.add('selected');
        }
    });

    // --- ルーペ機能イベントリスナー (修正) --- ★
    loupeToggle.addEventListener('change', (e) => {
        isLoupeEnabled = e.target.checked;
        // console.log('Loupe enabled:', isLoupeEnabled); // デバッグ用
        // ★ トグルラベルの表示切り替えを修正
        if (loupeToggleLabelOff && loupeToggleLabelOn) {
            loupeToggleLabelOff.style.fontWeight = !isLoupeEnabled ? 'bold' : 'normal';
            loupeToggleLabelOn.style.fontWeight = isLoupeEnabled ? 'bold' : 'normal';
        }
        loupeControlsContainer.classList.toggle('open', isLoupeEnabled); // ドロワー開閉

        if (isLoupeEnabled) {
            previewContainer.classList.remove('loupe-disabled');
        } else {
            previewContainer.classList.add('loupe-disabled');
            clearTimeout(loupeTimer);
            loupe.style.display = 'none'; // ★ OFF時に確実に非表示
        }
    });

    loupeSizeSlider.addEventListener('input', (e) => {
        loupeSizeFactor = parseFloat(e.target.value);
        loupeSizeValueSpan.textContent = loupeSizeFactor.toFixed(1);
        applyLoupeSizeFactor();
        if (loupe.style.display === 'block') {
            updateLoupeBackgroundSize();
            updateLoupePosition(lastMousePos);
        }
    });

    loupeZoomSlider.addEventListener('input', (e) => {
        zoomFactor = parseFloat(e.target.value);
        loupeZoomValueSpan.textContent = zoomFactor.toFixed(1);
        if (loupe.style.display === 'block') {
            updateLoupeBackgroundSize();
            updateLoupePosition(lastMousePos);
        }
    });

    previewContainer.addEventListener('mouseenter', (e) => {
        if (!isLoupeEnabled || previewImage.style.display === 'none') return;
        isMouseInsidePreview = true;
        // console.log('Mouse entered preview'); // デバッグ用
    });

    previewContainer.addEventListener('mouseleave', () => {
        // console.log('Mouse left preview'); // デバッグ用
        isMouseInsidePreview = false;
        clearTimeout(loupeTimer);
        loupe.style.display = 'none';
    });

    previewContainer.addEventListener('mousemove', (e) => {
        if (!isLoupeEnabled || previewImage.style.display === 'none') return;

        const containerRect = previewContainer.getBoundingClientRect();
        const currentX = e.clientX - containerRect.left;
        const currentY = e.clientY - containerRect.top;

        // コンテナ境界チェック
        if (currentX < 0 || currentX > containerRect.width || currentY < 0 || currentY > containerRect.height) {
            if (isMouseInsidePreview) {
                 isMouseInsidePreview = false;
                 clearTimeout(loupeTimer);
                 loupe.style.display = 'none';
                 // console.log('Mouse moved out of bounds'); // デバッグ用
            }
            return;
        }
        if (!isMouseInsidePreview) {
            isMouseInsidePreview = true;
        }

        lastMousePos = { x: currentX, y: currentY };

        // ★ ルーペが表示されていない場合のみタイマーを開始
        if (loupe.style.display !== 'block') {
            clearTimeout(loupeTimer); // 既存タイマー解除
            // console.log('Setting loupe timer'); // デバッグ用
            loupeTimer = setTimeout(() => {
                // console.log('Loupe timer fired. isMouseInsidePreview:', isMouseInsidePreview); // デバッグ用
                // タイマー発火時にマウスがまだプレビュー内にあれば表示
                if (isMouseInsidePreview) {
                    showLoupe(lastMousePos);
                }
            }, LOUPE_DELAY);
        } else {
             // 表示されている場合は位置を即時更新
             updateLoupePosition(lastMousePos);
        }
    });


    window.addEventListener('resize', () => {
        if (previewImage.style.display !== 'none') {
            calculateBaseLoupeSize();
            applyLoupeSizeFactor();
            if (loupe.style.display === 'block') {
                updateLoupeBackgroundSize();
                updateLoupePosition(lastMousePos);
            }
        }
    });


    // --- 関数 ---

    // プレビューリセット関数 (変更なし)
    function resetPreview() { /* ... */ }

    // 調整値表示更新関数 (修正) ★
    function updateAdjustmentValueDisplay(name, value) {
        const slider = document.getElementById(name);
        if (!slider) {
            // console.warn(`Slider not found for ${name}`); // デバッグ用
            return;
        }
        const valueDisplayContainer = slider.nextElementSibling;
        if (!valueDisplayContainer || !valueDisplayContainer.classList.contains('value-display')) {
            // console.warn(`Value display container not found for ${name}`); // デバッグ用
            return;
        }

        // ★ 数値表示用のspan要素を特定 (IDまたはクラス)
        const valueSpan = valueDisplayContainer.querySelector(`#${name}-value`) || valueDisplayContainer.querySelector('.value-number');
        const unit = valueDisplayContainer.textContent.replace(/[\d.-]/g, '').trim();

        let displayValue;
        if (unit === '%') {
            displayValue = Math.round(value);
        } else if (unit === 'K') {
            displayValue = parseInt(value, 10);
        } else if (unit === 'x') {
            displayValue = parseFloat(value).toFixed(1);
        } else { // 単位なし
            displayValue = parseFloat(value).toFixed(0);
        }

        // ★ 特定したspan要素のテキストを更新
        if (valueSpan) {
            valueSpan.textContent = displayValue;
        } else {
            // console.warn(`Value span not found inside container for ${name}. Updating container text.`); // デバッグ用
            valueDisplayContainer.textContent = `${displayValue}${unit || ''}`;
        }
    }


    // ルーペ表示関数 (修正) ★
    function showLoupe(mousePos) {
        // console.log('Attempting to show loupe. isLoupeEnabled:', isLoupeEnabled, 'isMouseInsidePreview:', isMouseInsidePreview); // デバッグ用
        if (!mousePos || previewImage.style.display === 'none' || !isLoupeEnabled) return;
        // ★ サイズ計算と適用をここで行う
        calculateBaseLoupeSize();
        applyLoupeSizeFactor();
        updateLoupeBackgroundSize();
        updateLoupePosition(mousePos);
        // ★ isMouseInsidePreview を再確認
        if (isMouseInsidePreview) {
            // console.log('Showing loupe'); // デバッグ用
            loupe.style.display = 'block'; // ★ ここで表示
        }
    }

    // ルーペ位置更新関数 (変更なし)
    function updateLoupePosition(mousePos) { /* ... */ }

    // 基準ルーペサイズ計算関数 (変更なし)
    function calculateBaseLoupeSize() { /* ... */ }

    // ルーペサイズ係数適用関数 (変更なし)
    function applyLoupeSizeFactor() { /* ... */ }

    // ルーペ背景サイズ更新関数 (変更なし)
    function updateLoupeBackgroundSize() { /* ... */ }


    // 調整をプレビュー画像に適用 (CSS Filterを使用) (修正) ★
    function applyPreviewAdjustments() {
        if (!previewImage || previewImage.style.display === 'none') return;

        let filters = [];
        const epsilon = 0.1;
        // ★ デフォルト値と比較し、異なる場合のみフィルターを追加
        if (Math.abs(adjustments.brightness - 100) > epsilon) filters.push(`brightness(${Math.max(0, adjustments.brightness / 100)})`);
        if (Math.abs(adjustments.contrast - 100) > epsilon) filters.push(`contrast(${Math.max(0, adjustments.contrast / 100)})`);
        if (Math.abs(adjustments.saturation - 100) > epsilon) filters.push(`saturate(${Math.max(0, adjustments.saturation / 100)})`);
        if (adjustments.tint !== 0) filters.push(`hue-rotate(${adjustments.tint}deg)`);
        // 他の効果はCSSプレビュー省略

        const filterValue = filters.length > 0 ? filters.join(' ') : 'none';
        // console.log('Applying filter:', filterValue); // デバッグ用
        previewImage.style.filter = filterValue;
    }

    // レンズリストを表示 (修正) ★
    function displayLenses(category = 'all') {
        // console.log('Displaying lenses for category:', category); // デバッグ用
        lensListContainer.innerHTML = ''; // リストをクリア
        const filteredLenses = (category === 'all')
            ? allLenses
            : allLenses.filter(lens => lens.category === category);

        if (filteredLenses.length === 0) {
            lensListContainer.innerHTML = '<p>該当するレンズはありません。</p>';
            return;
        }

        filteredLenses.forEach(lens => {
            const lensItem = document.createElement('div');
            lensItem.classList.add('lens-item');
            lensItem.dataset.lensId = lens.id;
            lensItem.innerHTML = `
                <img src="${lens.imageUrl || 'images/lens_placeholder.png'}" alt="${lens.name}" onerror="this.onerror=null;this.src='images/lens_placeholder.png';">
                <p>${lens.name}</p>
            `;
            lensListContainer.appendChild(lensItem);
        });
        // console.log(`Displayed ${filteredLenses.length} lenses.`); // デバッグ用

        // リスト表示後、選択中のレンズがあれば選択状態を復元
        if (currentLens) {
            const selectedItem = lensListContainer.querySelector(`.lens-item[data-lens-id="${currentLens.id}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected');
            }
        }
    }

    // レンズを選択し、詳細を表示 (変更なし)
    function selectLens(lensId) { /* ... */ }

    // 画像保存処理 (Canvas使用版) (変更なし)
    function downloadImageWithAdjustments() { /* ... */ }

    // Canvas処理本体 (変更なし)
    function processCanvas(img, canvas, ctx) { /* ... */ }

    // --- RGB/HSL変換ヘルパー関数 --- (変更なし)
    function rgbToHsl(r, g, b) { /* ... */ }
    function hslToRgb(h, s, l) { /* ... */ }

    // --- ケルビン -> RGB 変換 (近似) --- (変更なし)
    function kelvinToRgb(kelvin) { /* ... */ }


    // ピクセルデータに調整を適用する関数 (変更なし)
    function applyPixelAdjustments(data, width, height, adj) { /* ... */ }

    // --- 初期化 --- (修正) ★
    function init() {
        // スライダー/トグルの初期値をadjustmentsオブジェクトとUIに反映
        Object.keys(adjustments).forEach(key => {
            const slider = document.getElementById(key);
            if (slider) {
                slider.value = adjustments[key];
                updateAdjustmentValueDisplay(key, adjustments[key]);
            }
        });

        // ルーペ関連の初期化
        loupeToggle.checked = isLoupeEnabled;
        if (loupeToggleLabelOff && loupeToggleLabelOn) {
            loupeToggleLabelOff.style.fontWeight = !isLoupeEnabled ? 'bold' : 'normal';
            loupeToggleLabelOn.style.fontWeight = isLoupeEnabled ? 'bold' : 'normal';
        }
        loupeControlsContainer.classList.toggle('open', isLoupeEnabled);
        if (!isLoupeEnabled) {
            previewContainer.classList.add('loupe-disabled');
        }

        loupeZoomSlider.value = zoomFactor;
        loupeZoomValueSpan.textContent = zoomFactor.toFixed(1);
        loupeSizeSlider.value = loupeSizeFactor;
        loupeSizeValueSpan.textContent = loupeSizeFactor.toFixed(1);

        // 初期レンズリスト表示
        displayLenses();
        selectLens(null);
        // console.log('Initialization complete.'); // デバッグ用
    }

    init();
});