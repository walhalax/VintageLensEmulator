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
    let originalImageData = null; // Data URL
    let adjustments = {
        brightness: 100, contrast: 100, saturation: 100, sharpness: 0,
        exposure: 0, grain: 0, temperature: 6500, tint: 0, mist: 0,
    };
    let isLoupeEnabled = false;
    let zoomFactor = 3;
    let loupeSizeFactor = 1.3;
    let baseLoupeSize = 0; // プレビュー画像の短辺を基準とする
    let loupeSize = 0; // 実際のルーペの直径 (px)
    let loupeTimer = null;
    const LOUPE_DELAY = 1000; // 1秒
    let lastMousePos = { x: 0, y: 0 };
    let isMouseInsidePreview = false;

    // --- レンズデータ ---
    const allLenses = [
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

    // 画像読み込み
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                originalImageData = e.target.result; // Data URL を保持
                previewImage.onload = () => {
                    previewImage.style.display = 'block';
                    placeholderText.style.display = 'none';
                    loupe.style.backgroundImage = `url('${originalImageData}')`;
                    requestAnimationFrame(() => {
                        calculateBaseLoupeSize();
                        applyLoupeSizeFactor();
                        applyPreviewAdjustments();
                    });
                    previewImage.onload = null;
                };
                previewImage.onerror = () => {
                    console.error('Image load error.');
                    alert('画像の表示に失敗しました。');
                    resetPreview();
                };
                previewImage.src = originalImageData;
                currentImage = file; // File オブジェクトも保持 (必要なら)
            }
            reader.onerror = () => {
                 console.error('File read error.');
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

    // 画像保存 ★ イベントリスナーは変更なし、downloadImageWithAdjustments を実装
    saveButton.addEventListener('click', downloadImageWithAdjustments);

    // パラメータ調整 (スライダー)
    adjustmentControls.addEventListener('input', (event) => {
        const target = event.target;
        if (target.type === 'range') {
            const name = target.name;
            const value = target.value;
            if (adjustments.hasOwnProperty(name)) {
                adjustments[name] = parseFloat(value);
            }
            updateAdjustmentValueDisplay(name, value);
            applyPreviewAdjustments();
        }
    });

    // 色温度スライダーのイベントリスナー
    temperatureSlider.addEventListener('input', (event) => {
        adjustments.temperature = parseInt(event.target.value, 10);
        updateAdjustmentValueDisplay('temperature', event.target.value);
        applyPreviewAdjustments();
    });


    // レンズカテゴリフィルター
    lensCategoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            lensCategoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const category = button.dataset.category;
            displayLenses(category);
        });
    });

    // レンズ選択
    lensListContainer.addEventListener('click', (event) => {
        const lensItem = event.target.closest('.lens-item');
        if (lensItem && lensItem.dataset.lensId) {
            const lensId = lensItem.dataset.lensId;
            selectLens(lensId);
        }
    });

    // --- ルーペ機能イベントリスナー ---
    loupeToggle.addEventListener('change', (e) => {
        isLoupeEnabled = e.target.checked;
        if (loupeToggleLabelOff && loupeToggleLabelOn) {
            loupeToggleLabelOff.style.fontWeight = !isLoupeEnabled ? 'bold' : 'normal';
            loupeToggleLabelOn.style.fontWeight = isLoupeEnabled ? 'bold' : 'normal';
        }
        loupeControlsContainer.classList.toggle('open', isLoupeEnabled);

        if (isLoupeEnabled) {
            previewContainer.classList.remove('loupe-disabled');
        } else {
            previewContainer.classList.add('loupe-disabled');
            clearTimeout(loupeTimer);
            loupe.style.display = 'none';
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
    });

    previewContainer.addEventListener('mouseleave', () => {
        isMouseInsidePreview = false;
        clearTimeout(loupeTimer);
        loupe.style.display = 'none';
    });

    previewContainer.addEventListener('mousemove', (e) => {
        if (!isLoupeEnabled || previewImage.style.display === 'none') return;

        const containerRect = previewContainer.getBoundingClientRect();
        const currentX = e.clientX - containerRect.left;
        const currentY = e.clientY - containerRect.top;

        if (currentX < 0 || currentX > containerRect.width || currentY < 0 || currentY > containerRect.height) {
            if (isMouseInsidePreview) {
                 isMouseInsidePreview = false;
                 clearTimeout(loupeTimer);
                 loupe.style.display = 'none';
            }
            return;
        }
        if (!isMouseInsidePreview) {
            isMouseInsidePreview = true;
        }

        lastMousePos = { x: currentX, y: currentY };

        if (loupe.style.display !== 'block') {
            clearTimeout(loupeTimer);
            loupeTimer = setTimeout(() => {
                if (isMouseInsidePreview) {
                    showLoupe(lastMousePos);
                }
            }, LOUPE_DELAY);
        } else {
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

    // プレビューリセット関数
    function resetPreview() {
        previewImage.style.display = 'none';
        previewImage.src = '#';
        placeholderText.style.display = 'block';
        loupe.style.display = 'none';
        loupe.style.backgroundImage = 'none';
        originalImageData = null;
        currentImage = null;
    }

    // 調整値表示更新関数
    function updateAdjustmentValueDisplay(name, value) {
        const slider = document.getElementById(name);
        if (!slider) return;
        const valueDisplayContainer = slider.nextElementSibling;
        if (!valueDisplayContainer || !valueDisplayContainer.classList.contains('value-display')) return;

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

        if (valueSpan) {
            valueSpan.textContent = displayValue;
        } else {
            valueDisplayContainer.textContent = `${displayValue}${unit || ''}`;
        }
    }


    // ルーペ表示関数
    function showLoupe(mousePos) {
        if (!mousePos || previewImage.style.display === 'none' || !isLoupeEnabled) return;
        calculateBaseLoupeSize();
        applyLoupeSizeFactor();
        updateLoupeBackgroundSize();
        updateLoupePosition(mousePos);
        if (isMouseInsidePreview) {
            loupe.style.display = 'block';
        }
    }

    // ルーペ位置更新関数
    function updateLoupePosition(mousePos) {
        if (!previewImage || previewImage.style.display === 'none' || !loupe) return;

        const imgRect = previewImage.getBoundingClientRect();
        const containerRect = previewContainer.getBoundingClientRect();

        const ratioX = mousePos.x / containerRect.width;
        const ratioY = mousePos.y / containerRect.height;

        const loupeLeft = mousePos.x - loupeSize / 2;
        const loupeTop = mousePos.y - loupeSize / 2;

        loupe.style.left = `${loupeLeft}px`;
        loupe.style.top = `${loupeTop}px`;

        const bgWidth = imgRect.width * zoomFactor;
        const bgHeight = imgRect.height * zoomFactor;
        const bgPosX = - (ratioX * bgWidth - loupeSize / 2);
        const bgPosY = - (ratioY * bgHeight - loupeSize / 2);

        loupe.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
    }

    // 基準ルーペサイズ計算関数
    function calculateBaseLoupeSize() {
        if (!previewImage || previewImage.style.display === 'none') {
            baseLoupeSize = 0;
            return;
        }
        const imgRect = previewImage.getBoundingClientRect();
        baseLoupeSize = Math.min(imgRect.width, imgRect.height) / 4;
    }

    // ルーペサイズ係数適用関数
    function applyLoupeSizeFactor() {
        if (!loupe) return;
        loupeSize = baseLoupeSize * loupeSizeFactor;
        loupe.style.width = `${loupeSize}px`;
        loupe.style.height = `${loupeSize}px`;
    }

    // ルーペ背景サイズ更新関数
    function updateLoupeBackgroundSize() {
        if (!previewImage || previewImage.style.display === 'none' || !loupe) return;
        const imgRect = previewImage.getBoundingClientRect();
        const bgWidth = imgRect.width * zoomFactor;
        const bgHeight = imgRect.height * zoomFactor;
        loupe.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;
    }


    // 調整をプレビュー画像に適用 (CSS Filterを使用)
    function applyPreviewAdjustments() {
        if (!previewImage || previewImage.style.display === 'none') return;

        let filters = [];
        const epsilon = 0.1;
        if (Math.abs(adjustments.brightness - 100) > epsilon) filters.push(`brightness(${Math.max(0, adjustments.brightness / 100)})`);
        if (Math.abs(adjustments.contrast - 100) > epsilon) filters.push(`contrast(${Math.max(0, adjustments.contrast / 100)})`);
        if (Math.abs(adjustments.saturation - 100) > epsilon) filters.push(`saturate(${Math.max(0, adjustments.saturation / 100)})`);
        if (adjustments.tint !== 0) filters.push(`hue-rotate(${adjustments.tint}deg)`);
        // 他の効果はCSSプレビュー省略

        const filterValue = filters.length > 0 ? filters.join(' ') : 'none';
        previewImage.style.filter = filterValue;
    }

    // レンズリストを表示
    function displayLenses(category = 'all') {
        lensListContainer.innerHTML = '';
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
            if (currentLens && currentLens.id === lens.id) {
                lensItem.classList.add('selected');
            }
            lensListContainer.appendChild(lensItem);
        });
    }

    // レンズを選択し、詳細を表示
    function selectLens(lensId) {
        Array.from(lensListContainer.querySelectorAll('.lens-item.selected')).forEach(item => {
            item.classList.remove('selected');
        });

        if (lensId) {
            currentLens = allLenses.find(lens => lens.id === lensId);
            if (currentLens) {
                lensDetailsContainer.innerHTML = `
                    <h3>${currentLens.name} (${currentLens.year})</h3>
                    <p>${currentLens.description}</p>
                    `;
                const selectedItem = lensListContainer.querySelector(`.lens-item[data-lens-id="${lensId}"]`);
                if (selectedItem) {
                    selectedItem.classList.add('selected');
                }
                console.log("Selected lens:", currentLens.name);
            } else {
                 lensDetailsContainer.innerHTML = '<p>レンズ情報が見つかりません。</p>';
                 currentLens = null;
            }
        } else {
            lensDetailsContainer.innerHTML = '<p>レンズを選択してください。</p>';
            currentLens = null;
            console.log("Lens selection cleared.");
        }
    }

    // 画像保存処理 (Canvas使用版) ★実装追加 (基本枠組み)
    function downloadImageWithAdjustments() {
        if (!originalImageData) {
            alert("画像を読み込んでください。");
            return;
        }

        saveButton.disabled = true; // 処理中はボタンを無効化
        saveButton.textContent = "処理中...";

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            try {
                // Canvas処理を実行
                processCanvas(img, canvas, ctx);

                // Canvasの内容をBlobとして取得 (PNG形式)
                canvas.toBlob((blob) => {
                    if (blob) {
                        // ダウンロードリンクを作成してクリック
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        const filename = currentImage ? currentImage.name.replace(/\.[^/.]+$/, "") + "_adjusted.png" : "adjusted_image.png";
                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(link.href); // オブジェクトURLを解放
                        console.log("Image downloaded successfully.");
                    } else {
                        alert("画像のBlob生成に失敗しました。");
                        console.error("Failed to create blob from canvas.");
                    }
                    // ボタンの状態を元に戻す
                    saveButton.disabled = false;
                    saveButton.textContent = "画像保存";
                }, 'image/png'); // PNG形式で保存

            } catch (error) {
                console.error("Error processing or downloading image:", error);
                alert("画像の処理またはダウンロード中にエラーが発生しました。");
                saveButton.disabled = false;
                saveButton.textContent = "画像保存";
            }
        };
        img.onerror = () => {
            console.error("Failed to load image for processing.");
            alert("画像処理のために画像の読み込みに失敗しました。");
            saveButton.disabled = false;
            saveButton.textContent = "画像保存";
        };
        img.src = originalImageData; // Data URL をソースに設定
    }

    // Canvas処理本体 ★実装追加 (基本枠組み)
    function processCanvas(img, canvas, ctx) {
        // Canvasサイズを画像の実サイズに合わせる
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // 画像をCanvasに描画
        ctx.drawImage(img, 0, 0);

        // ピクセルデータを取得
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // ピクセルデータに調整を適用
        applyPixelAdjustments(data, canvas.width, canvas.height, adjustments);

        // 調整後のピクセルデータをCanvasに戻す
        ctx.putImageData(imageData, 0, 0);

        console.log("Canvas processed.");
    }

    // --- RGB/HSL変換ヘルパー関数 --- (未実装)
    function rgbToHsl(r, g, b) {
        // TODO: 実装する (変換ロジック)
        console.warn("rgbToHsl not implemented");
        return { h: 0, s: 0, l: (r + g + b) / (3 * 255) }; // 仮: グレースケール輝度
    }
    function hslToRgb(h, s, l) {
        // TODO: 実装する (変換ロジック)
        console.warn("hslToRgb not implemented");
        const val = Math.round(l * 255);
        return { r: val, g: val, b: val }; // 仮: グレースケール
    }

    // --- ケルビン -> RGB 変換 (近似) --- (未実装)
    function kelvinToRgb(kelvin) {
        // TODO: 実装する (近似式など)
        console.warn("kelvinToRgb not implemented");
        return { r: 255, g: 255, b: 255 }; // 仮: 白
    }


    // ピクセルデータに調整を適用する関数 ★実装追加 (簡易版: 明るさ、コントラスト、彩度のみ)
    function applyPixelAdjustments(data, width, height, adj) {
        console.log("Applying pixel adjustments (simple version)...", adj);
        const brightnessFactor = adj.brightness / 100;
        const contrastFactor = adj.contrast / 100; // コントラストは中央値127からの差を増幅
        const saturationFactor = adj.saturation / 100;

        // 他の調整は未実装のため警告
        if (adj.sharpness !== 0) console.warn("Sharpness adjustment not implemented.");
        if (adj.exposure !== 0) console.warn("Exposure adjustment not implemented.");
        if (adj.grain !== 0) console.warn("Grain adjustment not implemented.");
        if (adj.temperature !== 6500) console.warn("Temperature adjustment not implemented.");
        if (adj.tint !== 0) console.warn("Tint adjustment not implemented.");
        if (adj.mist !== 0) console.warn("Mist adjustment not implemented.");


        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // --- 明るさ ---
            r *= brightnessFactor;
            g *= brightnessFactor;
            b *= brightnessFactor;

            // --- コントラスト ---
            // 中央値(127)からの差を調整
            r = 127 + (r - 127) * contrastFactor;
            g = 127 + (g - 127) * contrastFactor;
            b = 127 + (b - 127) * contrastFactor;

            // --- 彩度 (簡易版: グレースケールとの混合) ---
            // HSL変換を使うのが望ましいが、簡易的に実装
            // グレースケール値を計算 (輝度)
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            // 元の色とグレースケールを彩度係数で混合
            r = gray + (r - gray) * saturationFactor;
            g = gray + (g - gray) * saturationFactor;
            b = gray + (b - gray) * saturationFactor;


            // 値を 0-255 の範囲にクリッピング
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
            // Alpha (data[i + 3]) は変更しない
        }
        console.log("Simple pixel adjustments applied.");
    }

    // --- 初期化 ---
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
        selectLens(null); // 初期状態ではレンズ未選択
    }

    init();
});