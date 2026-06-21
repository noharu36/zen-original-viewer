// 翻訳前の原文を保存するマップ
const originalTextMap = new Map();
let elementIdCounter = 0;

// ページ内の全要素をスキャンして原文を記憶する関数
function cacheOriginalTexts() {
	const elements = document.querySelectorAll(
		"p, span, h1, h2, h3, h4, h5, h6, li, a",
	);

	elements.forEach((el) => {
		if (el.dataset.zenOriginalId) return;

		const text = el.innerText?.trim();
		if (text && text.length > 0) {
			const id = `zen-text-${elementIdCounter++}`;
			el.dataset.zenOriginalId = id;
			originalTextMap.set(id, text);
		}
	});
}

// 初期実行
cacheOriginalTexts();

// 確実にDOMが存在することを確認してからObserverを開始
if (document.documentElement) {
	const observer = new MutationObserver(() => {
		cacheOriginalTexts();
	});
	observer.observe(document.documentElement, {
		childList: true,
		subtree: true,
	});
}

// 最後に選択/クリックされた要素と、その時のマウス位置を記録
let lastSelectedElement = null;
let mouseX = 0;
let mouseY = 0;

// テキスト選択が完了した瞬間（マウスを離した時）のイベント
document.addEventListener("mouseup", (e) => {
	// 既存のボタンやポップアップ自体をクリックした場合は無視する
	if (e.target.closest("#zen-trigger-button, #zen-original-popup")) return;

	const selection = window.getSelection();
	const selectionText = selection.toString().trim();

	// テキストが選択されている場合、トリガーボタンを表示
	if (selectionText.length > 0 && selection.rangeCount > 0) {
		lastSelectedElement = e.target;
		mouseX = e.pageX;
		mouseY = e.pageY;
		showTriggerButton(mouseX, mouseY);
	} else {
		// 選択が解除された、または何も選択していない空の場所をクリックした場合はすべて消す
		removeElements();
	}
});

// ボタンやポップアップを削除する共通関数
function removeElements() {
	const btn = document.getElementById("zen-trigger-button");
	if (btn) btn.remove();
	const popup = document.getElementById("zen-original-popup");
	if (popup) popup.remove();
}

// 選択範囲の近くに表示する専用の小さなボタン
function showTriggerButton(x, y) {
	// 既存のボタンがあれば一旦消す
	const oldBtn = document.getElementById("zen-trigger-button");
	if (oldBtn) oldBtn.remove();

	const btn = document.createElement("div");
	btn.id = "zen-trigger-button";
	btn.setAttribute("translate", "no");
	btn.classList.add("notranslate");

	const img = document.createElement("img");
	img.src = chrome.runtime.getURL("icon.png");

	Object.assign(img.style, {
		width: "15px",
		height: "15px",
		display: "block",
		PointerEvents: "nore",
	});

	btn.appendChild(img);

	// 押しやすいように選択位置の少し右上に配置
	Object.assign(btn.style, {
		position: "absolute",
		left: `${x + 10}px`,
		top: `${y - 30}px`,
		padding: "2px",
		backgroundColor: "#ffffff", // Zen Browserのテーマに合いそうなアクセントカラー
		borderRadius: "4px",
		boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
		cursor: "pointer",
		fontSize: "14px",
		zIndex: "2147483646",
		userSelect: "none",
	});

	// ボタンをクリックした時に原文を抽出してポップアップを出す
	btn.addEventListener("click", (e) => {
		e.stopPropagation(); // 画面クリックイベントの連鎖を防ぐ
		processAndShowOriginal();
		btn.remove(); // 用が済んだらボタンは消す
	});

	document.body.appendChild(btn);
}

// 選択された日本語に対応する原文を特定して表示するメインロジック
function processAndShowOriginal() {
	if (!lastSelectedElement) return;

	const targetElement = lastSelectedElement.closest("[data-zen-original-id]");
	if (!targetElement) return;

	const id = targetElement.dataset.zenOriginalId;
	const originalText = originalTextMap.get(id);

	if (originalText) {
		const selectionText = window.getSelection().toString().trim();

		if (selectionText) {
			const currentFullText = targetElement.innerText || "";
			const currentSentences = currentFullText
				.split(/(?<=[。\n])/)
				.map((s) => s.trim())
				.filter(Boolean);
			const originalSentences = originalText
				.split(/(?<=[.\n])\s*/)
				.map((s) => s.trim())
				.filter(Boolean);

			let targetIndices = [];
			currentSentences.forEach((sentence, index) => {
				if (
					sentence.includes(selectionText) ||
					selectionText.includes(sentence)
				) {
					targetIndices.push(index);
				}
			});

			if (targetIndices.length > 0) {
				const selectedOriginals = targetIndices
					.map((idx) => originalSentences[idx])
					.filter(Boolean);

				if (selectedOriginals.length > 0) {
					showPopup(selectedOriginals.join(" "));
					return;
				}
			}
		}
		showPopup(originalText);
	}
}

// 原文を表示するポップアップ関数
function showPopup(text) {
	const oldPopup = document.getElementById("zen-original-popup");
	if (oldPopup) oldPopup.remove();

	const popup = document.createElement("div");
	popup.id = "zen-original-popup";
	popup.setAttribute("translate", "no");
	popup.classList.add("notranslate");
	popup.innerText = text;

	Object.assign(popup.style, {
		position: "fixed",
		bottom: "20px",
		right: "20px",
		padding: "14px 18px",
		backgroundColor: "#1e1e2e",
		color: "#cdd6f4",
		border: "1px solid #45475a",
		borderRadius: "8px",
		boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
		zIndex: "2147483647",
		maxWidth: "400px",
		whiteSpace: "pre-wrap",
		fontFamily: "sans-serif",
		fontSize: "14px",
		lineHeight: "1.5",
	});

	document.body.appendChild(popup);
}
