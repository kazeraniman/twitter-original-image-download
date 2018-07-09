/**
 * Initializes the base element to add for downloading without the listeners.
 *
 * The element created by this method is then cloned for each additional tweet to reduce the
 * workload and be more performant when compared to create the element from scratch each time.
 */
function createBaseDownloadLinkElement() {
    // Create the download link element
    // The surrounding container
    let downloadLinkElement = document.createElement("div");
    downloadLinkElement.className = "ProfileTweet-action ProfileTweet-action--download-original-image";
    // The button element
    let downloadLinkButton = document.createElement("button");
    downloadLinkButton.className = "ProfileTweet-actionButton u-textUserColorHover js-actionButton";
    downloadLinkButton.type = "button";
    // The wrapper around the icon
    const tooltipMessage = chrome.i18n.getMessage("downloadIconTooltip");
    let downloadLinkIconContainer = document.createElement("div");
    downloadLinkIconContainer.className = "IconContainer js-tooltip";
    downloadLinkIconContainer.setAttribute("data-original-title", tooltipMessage);
    // The actual icon
    let downloadLinkIcon = document.createElement("img");
    downloadLinkIcon.src = chrome.runtime.getURL("resources/twitter_download_icon.svg");
    downloadLinkIcon.height = 16;
    downloadLinkIcon.width = 16;
    // The tooltip
    let downloadLinkTooltip = document.createElement("span");
    downloadLinkTooltip.className = "u-hiddenVisually";
    downloadLinkTooltip.innerText = tooltipMessage;
    // Put the pieces together
    downloadLinkIconContainer.appendChild(downloadLinkIcon);
    downloadLinkIconContainer.appendChild(downloadLinkTooltip);
    downloadLinkButton.appendChild(downloadLinkIconContainer);
    downloadLinkElement.appendChild(downloadLinkButton);
    // Set the global variable to hold the base node
    window.downloadLinkElement = downloadLinkElement;
}

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

    // Prepare the download element by cloning the base element with all its children
    let downloadLinkElement = window.downloadLinkElement.cloneNode(true);
    // Set up the download link
    let downloadLinkButton = downloadLinkElement.querySelector("button");
    downloadLinkButton.addEventListener("click", function(event) {
        chrome.runtime.sendMessage({
            imgUrl: images[0].src
        });
    });
    // Setup the hover listeners for animation
    let downloadLinkIcon = downloadLinkElement.querySelector("img");
    downloadLinkIcon.addEventListener("mouseover", function(event) {
        event.target.src = chrome.runtime.getURL("resources/twitter_download_hovered_icon.svg");
    });
    downloadLinkIcon.addEventListener("mouseout", function(event) {
        event.target.src = chrome.runtime.getURL("resources/twitter_download_icon.svg");
    });

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
    // Go through each mutation record
    mutationRecords.forEach(function(mutationRecord) {
        // Go through each added node
        mutationRecord.addedNodes.forEach(function(addedNode) {
            // If the node is a nice, HTML node
            if (addedNode.tagName) {
                // Get all tweets under it and add in the download link for them
                Array.from(addedNode.querySelectorAll(".tweet")).forEach(addedTweet => addDownloadLink(addedTweet));
            }
        });
    });
}

/**
 * Handles everything that needs to be done on pages where the script should be injected.
 *
 * The script needs to be re-injected on Twitter pages when navigation goes to a different page.
 * This is necessary due to the single-page nature of the site.  Initial processing must be redone
 * as well as setting up mutation observers for further asynchronous loading.
 */
function scriptInjection() {
    // Configure the mutation observer for new tweets
    let mutationObserver = new MutationObserver(handleNewTweets);
    const mainTweetsMutationConfig = {
        childList: true
    };
    const modalTweetsMutationConfig = {
        childList: true,
        subtree: true
    };

    // Get the main tweet container
    let tweetsContainer = document.querySelector("#timeline #stream-items-id");
    // If there is a tweet container present (we are on a valid page)
    if (tweetsContainer) {
        // Add the download link to all current tweets
        Array.from(tweetsContainer.querySelectorAll(".tweet")).forEach(tweet => addDownloadLink(tweet));

        // Watch for further tweets being added in
        mutationObserver.observe(tweetsContainer, mainTweetsMutationConfig);
    }

    // Get the modal container for specific tweet expansion
    let modalContainer = document.querySelector("#permalink-overlay");
     // If there is a modal container present (we are on a valid page)
    if (modalContainer) {
        // Add the download link to all current tweets
        Array.from(modalContainer.querySelectorAll(".tweet")).forEach(tweet => addDownloadLink(tweet));

        // Watch for further tweets being added in
        mutationObserver.observe(modalContainer, modalTweetsMutationConfig);
    }
}

// Prepare the download node so it can be cloned for further use
window.downloadLinkElement = null;
createBaseDownloadLinkElement();
// On navigation to Twitter need to perform the initial script injection
scriptInjection();
