chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: "view-real-original",
		title: "元の表示（原文）を確認",
		contexts: ["selection"],
	});
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "view-real-original") {
		chrome.tabs.sendMessage(tab.id, { action: "getOriginalText" });
	}
});
