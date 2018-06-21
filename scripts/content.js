/**
 * Adds an icon to enable downloading the image for tweets with images.
 *
 * Takes a tweet and determines whether or not it contains images.  If so, inject a new element
 * in the action bar to facilitate downloading the full, original image.
 *
 * @param {Object} tweet    A list element tweet.
 */
function addDownloadLink(tweet) {
    // Only deal with the tweets with images in them
    let images = tweet.querySelectorAll(".AdaptiveMedia-container img");
    if (images.length == 0) {
        return;
    }

    // Create the download link element
    // The surrounding container
    let downloadLinkElement = document.createElement("div");
    downloadLinkElement.className = "ProfileTweet-action ProfileTweet-action--download-original-image";
    // The button element
    let downloadLinkButton = document.createElement("button");
    downloadLinkButton.className = "ProfileTweet-actionButton u-textUserColorHover js-actionButton";
    downloadLinkButton.type = "button";
    downloadLinkButton.addEventListener("click", function(event) {
        chrome.runtime.sendMessage({
            imgUrl: images[0].src
        });
    });
    // The wrapper around the icon
    let downloadLinkIconContainer = document.createElement("div");
    downloadLinkIconContainer.className = "IconContainer js-tooltip";
    downloadLinkIconContainer.setAttribute("data-original-title", "Download original image(s)");
    // The actual icon
    let downloadLinkIcon = document.createElement("img");
    downloadLinkIcon.src = chrome.runtime.getURL("resources/twitter_download_icon.svg");
    downloadLinkIcon.height = 16;
    downloadLinkIcon.width = 16;
    downloadLinkIcon.addEventListener("mouseover", function(event) {
        event.target.src = chrome.runtime.getURL("resources/twitter_download_hovered_icon.svg");
    });
    downloadLinkIcon.addEventListener("mouseout", function(event) {
        event.target.src = chrome.runtime.getURL("resources/twitter_download_icon.svg");
    });
    // The tooltip
    let downloadLinkTooltip = document.createElement("span");
    downloadLinkTooltip.className = "u-hiddenVisually";
    downloadLinkTooltip.innerText = "Download original image(s)";
    // Put the pieces together
    downloadLinkIconContainer.appendChild(downloadLinkIcon);
    downloadLinkIconContainer.appendChild(downloadLinkTooltip);
    downloadLinkButton.appendChild(downloadLinkIconContainer);
    downloadLinkElement.appendChild(downloadLinkButton);

    // Get the action bar
    let actionBar = tweet.querySelector(".ProfileTweet-actionList");

    // Add in the new element
    actionBar.appendChild(downloadLinkElement);
}

/**
 * Processes new tweets as they are loaded asynchronously.
 *
 * For each mutation of the tweet container, go through all of the added nodes and process them
 * like tweets.
 *
 * @param {Object} mutationRecords    A list of mutation records for tweet container.
 */
function handleNewTweets(mutationRecords) {
    mutationRecords.forEach(function(mutationRecord) {
        mutationRecord.addedNodes.forEach(function(addedTweet) {
            addDownloadLink(addedTweet);
        });
    });
}

// Get the tweet container
let tweetsContainer = document.getElementById("stream-items-id");

// Add the download link to all current tweets
Array.from(tweetsContainer.children).forEach(tweet => addDownloadLink(tweet));

// Watch for further tweets being added in
let mutationObserver = new MutationObserver(handleNewTweets);
const mutationConfig = {
    childList: true
};
mutationObserver.observe(tweetsContainer, mutationConfig);
