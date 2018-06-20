// Event pages need a listener for onClicked for the context menu item
chrome.contextMenus.onClicked.addListener(function(info) {
    // Extract the root image URL, stripping off a size indicator if it exists
    let imgUrl = info.srcUrl;
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
});

// Add in the context menu item
chrome.contextMenus.create({
    type: "normal",
    id: "twitterOriginalImageDownload",
    title: "Download original image...",
    contexts: ["image"],
    targetUrlPatterns: ["https://pbs.twimg.com/media/*"],
});
