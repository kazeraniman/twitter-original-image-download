// Add in the context menu item
chrome.contextMenus.create({
    type: "normal",
    id: "twitterOriginalImageDownload",
    title: "Download original image...",
    contexts: ["image"],
    visible: true,
    targetUrlPatterns: ["https://pbs.twimg.com/media/*"]
});
