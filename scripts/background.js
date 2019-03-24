/**
 * Download the provided image at the original size.
 *
 * Takes the image url provided, strips off any size specifiers that already exist.
 * Extracts the filename from the URL then downloads the image through the Chrome API.
 *
 * @param {string} imgUrl    The URL of the image to download.
 */
function downloadImage(imgUrl) {
    // Remove the size specifier if it exists
    if (imgUrl.endsWith(":large")) {
        imgUrl = imgUrl.slice(0, -6);
    }

    // Extract a potential filename
    const urlParts = imgUrl.split("/");
    const potentialFilename = urlParts[urlParts.length - 1]

    // Add in the original file specifier
    imgUrl += ":orig"

    // Download the original image
    chrome.downloads.download({
        url: imgUrl,
        filename: potentialFilename,
        conflictAction: "overwrite",
        saveAs: true,
    });
}

// Event pages need a listener for onClicked for the context menu item
chrome.contextMenus.onClicked.addListener(function(info) {
    downloadImage(info.srcUrl);
});

// Add in the context menu item
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            type: "normal",
            id: "twitterOriginalImageDownload",
            title: "Download original image...",
            contexts: ["image"],
            targetUrlPatterns: ["https://pbs.twimg.com/media/*"],
        });
    });
});

// Listen for messages from the Twitter tab
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    downloadImage(message.imgUrl);
});
