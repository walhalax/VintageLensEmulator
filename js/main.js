document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 要素の取得 ---
    const imageInput = document.getElementById('image-input');
    const saveButton = document.getElementById('save-button');
    const previewContainer = document.querySelector('.image-preview-container');
    const previewCanvas = document.getElementById('preview-canvas');
    const previewCtx = previewCanvas.getContext('2d', { willReadFrequently: true });
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

    // --- 定数 ---
    const MAX_PREVIEW_WIDTH = 1920;
    const MAX_PREVIEW_HEIGHT = 1080;
    const PREVIEW_DEBOUNCE_TIME = 150;
    const LOUPE_DELAY = 1000;
    const MIST_HIGHLIGHT_THRESHOLD = 200;

    // --- 状態管理 ---
    let currentImage = null;
    let currentLens = null;
    let originalImageData = null; // Data URL
    let originalImageObject = null; // Image オブジェクトを保持するように変更
    let previewScale = 1.0;
    let previewOffsetX = 0;
    let previewOffsetY = 0;
    let previewDisplayWidth = 0;
    let previewDisplayHeight = 0;
    let adjustments = {
        brightness: 100, contrast: 100, saturation: 100, sharpness: 0,
        exposure: 0, grain: 0, temperature: 6500, tint: 0, mist: 0,
    };
    let isLoupeEnabled = false;
    let zoomFactor = 3;
    let loupeSizeFactor = 2.0;
    let baseLoupeSize = 0;
    let loupeSize = 0;
    let loupeTimer = null;
    let lastMousePos = { x: 0, y: 0 }; // コンテナ座標を保持
    let previewUpdateTimeout = null;

    // --- レンズデータ ---
    const allLenses = [
        { id: 'elmarit-21-f28', name: 'Elmarit-M 21mm f/2.8', category: 'wide', year: 1980, description: '超広角レンズ。ダイナミックな風景写真に。', imageUrl: 'images/lenses/Elmarit-M_21mm_f2.8.jpg' },
        { id: 'summicron-28-f2', name: 'Summicron-M 28mm f/2 ASPH.', category: 'wide', year: 2000, description: '高性能な大口径広角レンズ。シャープな描写。', imageUrl: 'images/lenses/Summicron-M_28mm_f2_ASPH.jpeg' },
        { id: 'elmarit-28-f28-v4', name: 'Elmarit-M 28mm f/2.8 (IV)', category: 'wide', year: 1993, description: 'コンパクトな広角レンズ。風景やスナップに。', imageUrl: 'images/lenses/Elmarit-M_28mm_F2.8_4th.jpg' },
        { id: 'summaron-35-f28', name: 'Summaron 35mm f/2.8', category: 'wide', year: 1958, description: 'クラシックな描写が楽しめる広角レンズ。', imageUrl: 'images/lenses/Summaron_35mm_f2.8.jpg' },
        { id: 'summicron-35-f2-v4', name: 'Summicron-M 35mm f/2 (IV "Bokeh King")', category: 'wide', year: 1979, description: '「ボケキング」として知られる人気の35mm。', imageUrl: 'images/lenses/Summicron-M_35mm_f2_4th.jpg' },
        { id: 'summilux-35-f14-pre', name: 'Summilux 35mm f/1.4 (Pre-ASPH)', category: 'wide', year: 1961, description: '独特のフレアとボケを持つ伝説的なレンズ。', imageUrl: 'images/lenses/Summilux_35mm_f1.4.jpg' },
        // ★ imageUrl を修正
        { id: 'summicron-50-f2-rigid', name: 'Summicron 50mm f/2 (Rigid)', category: 'standard', year: 1956, description: '初期の代表的な標準レンズ。高い解像力。', imageUrl: 'images/lenses/Summicron_50mm_f2_Rigid.webp' },
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
    // ... (画像読み込み、保存、パラメータ調整、カテゴリフィルター、レンズ選択、ルーペ関連リスナーは変更なし) ...
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                originalImageData = e.target.result;
                currentImage = file;
                console.log("FileReader loaded."); // Debug

                const img = new Image();
                img.onload = () => {
                    console.log("Image object loaded."); // Debug
                    originalImageObject = img;

                    // --- プレビュー解像度計算 ---
                    let scaleX = 1.0;
                    let scaleY = 1.0;
                    if (img.naturalWidth > MAX_PREVIEW_WIDTH) {
                        scaleX = MAX_PREVIEW_WIDTH / img.naturalWidth;
                    }
                    if (img.naturalHeight > MAX_PREVIEW_HEIGHT) {
                        scaleY = MAX_PREVIEW_HEIGHT / img.naturalHeight;
                    }
                    previewScale = Math.min(scaleX, scaleY);

                    const previewWidth = Math.round(img.naturalWidth * previewScale);
                    const previewHeight = Math.round(img.naturalHeight * previewScale);
                    // --- ここまで ---

                    previewCanvas.width = previewWidth;
                    previewCanvas.height = previewHeight;
                    previewCtx.drawImage(originalImageObject, 0, 0, previewWidth, previewHeight);
                    console.log("Initial image drawn to canvas."); // Debug

                    previewCanvas.style.display = 'block';
                    placeholderText.style.display = 'none';
                    loupe.style.backgroundImage = `url('${originalImageData}')`;

                    requestAnimationFrame(() => {
                        console.log("Requesting initial updates after image load."); // Debug
                        updatePreviewDisplayInfo(); // ★ 表示情報計算は必要
                        calculateBaseLoupeSize();
                        applyLoupeSizeFactor();
                        applyPreviewAdjustments();
                    });
                };
                img.onerror = () => {
                    console.error('Image load error for canvas.');
                    alert('画像の表示準備に失敗しました。');
                    resetPreview();
                };
                img.src = originalImageData;
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
    saveButton.addEventListener('click', downloadImageWithAdjustments);
    adjustmentControls.addEventListener('input', (event) => {
        const target = event.target;
        if (target.type === 'range') {
            const name = target.name;
            const value = target.value;
            if (adjustments.hasOwnProperty(name)) {
                adjustments[name] = parseFloat(value);
            }
            updateAdjustmentValueDisplay(name, value);
            requestPreviewUpdate();
        }
    });
    temperatureSlider.addEventListener('input', (event) => {
        adjustments.temperature = parseInt(event.target.value, 10);
        updateAdjustmentValueDisplay('temperature', event.target.value);
        requestPreviewUpdate();
    });
    lensCategoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            lensCategoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const category = button.dataset.category;
            displayLenses(category);
        });
    });
    lensListContainer.addEventListener('click', (event) => {
        const lensItem = event.target.closest('.lens-item');
        if (lensItem && lensItem.dataset.lensId) {
            const lensId = lensItem.dataset.lensId;
            selectLens(lensId);
        }
    });
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
    previewContainer.addEventListener('mouseenter', (e) => { });
    previewContainer.addEventListener('mouseleave', () => {
        clearTimeout(loupeTimer);
        loupe.style.display = 'none';
    });
    previewContainer.addEventListener('mousemove', (e) => {
        if (!isLoupeEnabled || previewCanvas.style.display === 'none') return;

        const containerRect = previewContainer.getBoundingClientRect();
        const canvasRect = previewCanvas.getBoundingClientRect();

        const canvasMouseX = e.clientX - canvasRect.left;
        const canvasMouseY = e.clientY - canvasRect.top;

        const isInsideCanvas = canvasMouseX >= 0 && canvasMouseX < canvasRect.width &&
                               canvasMouseY >= 0 && canvasMouseY < canvasRect.height;

        if (isInsideCanvas) {
            lastMousePos = {
                x: e.clientX - containerRect.left,
                y: e.clientY - containerRect.top
            };

            if (loupe.style.display !== 'block') {
                clearTimeout(loupeTimer);
                loupeTimer = setTimeout(() => {
                    showLoupe(lastMousePos);
                }, LOUPE_DELAY);
            } else {
                 updateLoupePosition(lastMousePos);
            }
        } else {
            clearTimeout(loupeTimer);
            loupe.style.display = 'none';
        }
    });
    window.addEventListener('resize', () => {
        if (previewCanvas.style.display !== 'none') {
            updatePreviewDisplayInfo();
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
        previewCanvas.style.display = 'none';
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        placeholderText.style.display = 'block';
        loupe.style.display = 'none';
        loupe.style.backgroundImage = 'none';
        originalImageData = null;
        originalImageObject = null;
        currentImage = null;
        previewScale = 1.0;
        previewOffsetX = 0;
        previewOffsetY = 0;
        previewDisplayWidth = 0;
        previewDisplayHeight = 0;
    }

    // プレビュー表示情報更新関数
    function updatePreviewDisplayInfo() {
        if (!previewCanvas || previewCanvas.style.display === 'none') return;
        const canvasRect = previewCanvas.getBoundingClientRect();
        const canvasWidth = previewCanvas.width;
        const canvasHeight = previewCanvas.height;
        const displayWidth = canvasRect.width;
        const displayHeight = canvasRect.height;

        const displayRatio = displayWidth / displayHeight;
        const canvasRatio = canvasWidth / canvasHeight;

        if (displayRatio > canvasRatio) {
            previewDisplayHeight = displayHeight;
            previewDisplayWidth = displayHeight * canvasRatio;
            previewOffsetX = (displayWidth - previewDisplayWidth) / 2;
            previewOffsetY = 0;
        } else {
            previewDisplayWidth = displayWidth;
            previewDisplayHeight = displayWidth / canvasRatio;
            previewOffsetX = 0;
            previewOffsetY = (displayHeight - previewDisplayHeight) / 2;
        }
    }

    // 調整値表示更新関数
    function updateAdjustmentValueDisplay(name, value) {
        // ... (変更なし) ...
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

    // プレビュー更新リクエスト (デバウンス)
    function requestPreviewUpdate() {
        if (!originalImageObject) return;
        clearTimeout(previewUpdateTimeout);
        previewUpdateTimeout = setTimeout(() => {
            applyPreviewAdjustments();
        }, PREVIEW_DEBOUNCE_TIME);
    }


    // ルーペ表示関数
    function showLoupe(mousePos) { // mousePos はコンテナ座標
        if (!mousePos || previewCanvas.style.display === 'none' || !isLoupeEnabled) return;
        updatePreviewDisplayInfo(); // オフセット計算のために必要
        calculateBaseLoupeSize();
        applyLoupeSizeFactor();
        updateLoupeBackgroundSize();
        updateLoupePosition(mousePos);
        loupe.style.display = 'block';
    }

    // ルーペ位置更新関数
    function updateLoupePosition(mousePos) { // mousePos はコンテナ座標 {x, y}
        if (!previewCanvas || previewCanvas.style.display === 'none' || !loupe || !originalImageObject) return;

        const canvasRect = previewCanvas.getBoundingClientRect();
        const containerRect = previewContainer.getBoundingClientRect();

        const canvasMouseX = mousePos.x - (canvasRect.left - containerRect.left);
        const canvasMouseY = mousePos.y - (canvasRect.top - containerRect.top);

        const canvasRatioX = Math.max(0, Math.min(1, canvasMouseX / canvasRect.width));
        const canvasRatioY = Math.max(0, Math.min(1, canvasMouseY / canvasRect.height));

        const loupeLeft = mousePos.x - loupeSize / 2;
        const loupeTop = mousePos.y - loupeSize / 2;
        loupe.style.left = `${loupeLeft}px`;
        loupe.style.top = `${loupeTop}px`;

        const bgWidth = originalImageObject.naturalWidth * zoomFactor;
        const bgHeight = originalImageObject.naturalHeight * zoomFactor;
        const bgPosX = - (canvasRatioX * bgWidth - loupeSize / 2);
        const bgPosY = - (canvasRatioY * bgHeight - loupeSize / 2);
        loupe.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
    }


    // 基準ルーペサイズ計算関数
    function calculateBaseLoupeSize() {
        if (previewDisplayWidth === 0 || previewDisplayHeight === 0) {
            baseLoupeSize = 0;
            return;
        }
        baseLoupeSize = Math.min(previewDisplayWidth, previewDisplayHeight) / 4;
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
        if (!originalImageObject || !loupe) return;
        const bgWidth = originalImageObject.naturalWidth * zoomFactor;
        const bgHeight = originalImageObject.naturalHeight * zoomFactor;
        loupe.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;
    }


    // 調整をプレビュー画像に適用 (Canvas ベース)
    function applyPreviewAdjustments() {
        if (!originalImageObject || !previewCtx) return;

        console.log("Applying adjustments to preview canvas...");

        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.drawImage(originalImageObject, 0, 0, previewCanvas.width, previewCanvas.height);

        const imageData = previewCtx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
        const data = imageData.data;

        try {
            applyPixelAdjustments(data, previewCanvas.width, previewCanvas.height, adjustments);
        } catch (error) {
            console.error("Error applying pixel adjustments to preview:", error);
        }

        previewCtx.putImageData(imageData, 0, 0);
        console.log("Preview canvas updated.");
    }

    // レンズリストを表示
    function displayLenses(category = 'all') {
        // ... (変更なし) ...
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
                <img src="${lens.imageUrl}" alt="${lens.name}" onerror="this.onerror=null;this.src='images/lens_placeholder.png';">
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
        // ... (変更なし) ...
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

    // 画像保存処理 (Canvas使用版)
    function downloadImageWithAdjustments() {
        // ... (変更なし) ...
        if (!originalImageObject) {
            alert("画像を読み込んでください。");
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "処理中...";

        const saveCanvas = document.createElement('canvas');
        const saveCtx = saveCanvas.getContext('2d');

        try {
            processCanvas(originalImageObject, saveCanvas, saveCtx);

            saveCanvas.toBlob((blob) => {
                if (blob) {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    const filename = currentImage ? currentImage.name.replace(/\.[^/.]+$/, "") + "_adjusted.png" : "adjusted_image.png";
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);
                    console.log("Image downloaded successfully.");
                } else {
                    alert("画像のBlob生成に失敗しました。");
                    console.error("Failed to create blob from canvas.");
                }
                saveButton.disabled = false;
                saveButton.textContent = "画像保存";
            }, 'image/png');

        } catch (error) {
            console.error("Error processing or downloading image:", error);
            alert("画像の処理またはダウンロード中にエラーが発生しました。");
            saveButton.disabled = false;
            saveButton.textContent = "画像保存";
        }
    }

    // Canvas処理本体
    function processCanvas(imgSource, canvas, ctx) {
        // ... (変更なし) ...
        canvas.width = imgSource.naturalWidth;
        canvas.height = imgSource.naturalHeight;
        ctx.drawImage(imgSource, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        applyPixelAdjustments(data, canvas.width, canvas.height, adjustments);
        ctx.putImageData(imageData, 0, 0);
        console.log("Canvas processed.");
    }

    // --- RGB/HSL変換ヘルパー関数 ---
    function rgbToHsl(r, g, b) {
        // ... (実装済み) ...
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h, s, l };
    }

    function hslToRgb(h, s, l) {
        // ... (実装済み) ...
        let r, g, b;
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    // --- ケルビン -> RGB 変換 (近似) ---
    function kelvinToRgb(kelvin) {
        // ... (実装済み) ...
        const temp = kelvin / 100;
        let r, g, b;

        // Red
        if (temp <= 66) {
            r = 255;
        } else {
            r = temp - 60;
            r = 329.698727446 * Math.pow(r, -0.1332047592);
            r = Math.max(0, Math.min(255, r));
        }

        // Green
        if (temp <= 66) {
            g = temp;
            g = 99.4708025861 * Math.log(g) - 161.1195681661;
            g = Math.max(0, Math.min(255, g));
        } else {
            g = temp - 60;
            g = 288.1221695283 * Math.pow(g, -0.0755148492);
            g = Math.max(0, Math.min(255, g));
        }

        // Blue
        if (temp >= 66) {
            b = 255;
        } else {
            if (temp <= 19) {
                b = 0;
            } else {
                b = temp - 10;
                b = 138.5177312231 * Math.log(b) - 305.0447927307;
                b = Math.max(0, Math.min(255, b));
            }
        }
        return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
    }


    // ピクセルデータに調整を適用する関数 ★ ミスト効果修正
    function applyPixelAdjustments(data, width, height, adj) {
        console.log("Applying pixel adjustments...", adj);
        const brightnessFactor = adj.brightness / 100;
        const contrastFactor = adj.contrast / 100;
        const saturationFactor = adj.saturation / 100;
        const exposureFactor = Math.pow(2, adj.exposure / 100);
        const grainAmount = adj.grain / 100;
        const tintAmount = adj.tint / 100;
        const mistAmount = adj.mist / 100;
        const sharpnessAmount = adj.sharpness / 100;

        const targetRgb = kelvinToRgb(adj.temperature);
        const baseRgb = kelvinToRgb(6500);
        const tempFactorR = targetRgb.r / baseRgb.r;
        const tempFactorG = targetRgb.g / baseRgb.g;
        const tempFactorB = targetRgb.b / baseRgb.b;

        const srcData = sharpnessAmount > 0 ? new Uint8ClampedArray(data) : null;
        const step = 4;
        const widthStep = width * step;

        for (let i = 0; i < data.length; i += step) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // --- シャープネス (簡易版) ---
            if (sharpnessAmount > 0 && srcData) {
                const x = (i / step) % width;
                const y = Math.floor((i / step) / width);

                if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                    const centerIndex = i;
                    const topIndex = i - widthStep;
                    const bottomIndex = i + widthStep;
                    const leftIndex = i - step;
                    const rightIndex = i + step;

                    for (let j = 0; j < 3; j++) { // R, G, B
                        const centerVal = srcData[centerIndex + j];
                        const topVal = srcData[topIndex + j];
                        const bottomVal = srcData[bottomIndex + j];
                        const leftVal = srcData[leftIndex + j];
                        const rightVal = srcData[rightIndex + j];
                        const delta = centerVal * 4 - (topVal + bottomVal + leftVal + rightVal);
                        const sharpenedVal = centerVal + delta * sharpnessAmount * 0.5;

                        if (j === 0) r = sharpenedVal;
                        else if (j === 1) g = sharpenedVal;
                        else b = sharpenedVal;
                    }
                }
                else {
                    r = srcData[i];
                    g = srcData[i+1];
                    b = srcData[i+2];
                }
            }

            // --- 他の調整 ---
            r *= exposureFactor;
            g *= exposureFactor;
            b *= exposureFactor;

            r *= brightnessFactor;
            g *= brightnessFactor;
            b *= brightnessFactor;

            r = 127.5 + (r - 127.5) * contrastFactor;
            g = 127.5 + (g - 127.5) * contrastFactor;
            b = 127.5 + (b - 127.5) * contrastFactor;

            r *= tempFactorR;
            g *= tempFactorG;
            b *= tempFactorB;

            let hsl = rgbToHsl(r, g, b);
            hsl.s *= saturationFactor;
            hsl.h += tintAmount * 0.1;
            if (hsl.h < 0) hsl.h += 1;
            if (hsl.h >= 1) hsl.h -= 1;
            let rgb = hslToRgb(hsl.h, Math.max(0, Math.min(1, hsl.s)), hsl.l);
            r = rgb.r;
            g = rgb.g;
            b = rgb.b;

            // --- 粒状性 (強度を1/3に) ---
            if (grainAmount > 0) {
                const noise = (Math.random() - 0.5) * 2 * grainAmount * (128 / 3);
                r += noise;
                g += noise;
                b += noise;
            }

            // --- ミスト (ハイライトのみ) ---
            if (mistAmount > 0) {
                // 輝度を計算 (簡易)
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                if (luminance > MIST_HIGHLIGHT_THRESHOLD) {
                    // 閾値を超えた分に応じて強度を決定 (0-1)
                    const intensity = Math.min(1, (luminance - MIST_HIGHLIGHT_THRESHOLD) / (255 - MIST_HIGHLIGHT_THRESHOLD));
                    // 強度とスライダー値で白を混合
                    const mixFactor = mistAmount * intensity;
                    r = r * (1 - mixFactor) + 255 * mixFactor;
                    g = g * (1 - mixFactor) + 255 * mixFactor;
                    b = b * (1 - mixFactor) + 255 * mixFactor;
                }
            }

            // --- クリッピングして書き戻し ---
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
        }
        if (sharpnessAmount > 0) console.log("Simple sharpness applied.");
        console.log("Pixel adjustments applied.");
    }

    // --- 初期化 ---
    function init() {
        // ★ ルーペサイズ初期値を修正 (HTMLから取得)
        loupeSizeFactor = parseFloat(loupeSizeSlider.value);
        loupeSizeValueSpan.textContent = loupeSizeFactor.toFixed(1);
        zoomFactor = parseFloat(loupeZoomSlider.value);
        loupeZoomValueSpan.textContent = zoomFactor.toFixed(1);

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

        // zoomFactor, loupeSizeFactor は上で設定済み

        displayLenses();
        selectLens(null);
    }

    init();
});