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
 * Takes a tweet and determines whether or not it contains images.  If so, add the download link.
 *
 * @param {Object} tweet    A list element tweet.
 */
function addDownloadLinkToTweet(tweet) {
    // Only deal with the tweets with images in them
    let images = tweet.querySelectorAll(".AdaptiveMedia-container img");
    if (images.length == 0) {
        return;
    }

    // Get the action bar
    let actionBar = tweet.querySelector(".ProfileTweet-actionList");

    // Add in the download link
    addDownloadLink(images[0].src, actionBar)
}

/**
 * Inject a new element in the action bar to facilitate downloading the full, original image.
 *
 * @param {string} imgUrl    The URL of the image to download.
 * @param {Object} actionBar    The action bar to which to add the download button.
 */
function addDownloadLink(imgUrl, actionBar) {
    // Prepare the download element by cloning the base element with all its children
    let downloadLinkElement = window.downloadLinkElement.cloneNode(true);

    // Set up the download link
    let downloadLinkButton = downloadLinkElement.querySelector("button");
    downloadLinkButton.addEventListener("click", function(event) {
        chrome.runtime.sendMessage({
            imgUrl: imgUrl
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

    // Nuke any previous download buttons in the action bar
    actionBar.querySelectorAll(".ProfileTweet-action--download-original-image").forEach(downloadLink => downloadLink.parentNode.removeChild(downloadLink));

    // Add in the new element
    actionBar.prepend(downloadLinkElement);
}

/**
 * Processes modifications to the image currently being displayed in the gallery media.
 *
 * @param {Object} mutationRecords    A list of mutation records for the gallery media.
 */
function handleGallery(mutationRecords) {
    // Go through each mutation record
    mutationRecords.forEach((mutationRecord) => {
        // Go through each added node
        mutationRecord.addedNodes.forEach((addedNode) => {
            // If the node is an image node
            if (addedNode.tagName && addedNode.tagName == "IMG") {
                // Store the url in a window variable so the gallery tweet can later access it since this happens first
                window.currentGalleryImage = addedNode.src;
            }
        });
    });
}

/**
 * Processes modifications to the tweet currently being displayed in the gallery tweet.
 *
 * @param {Object} mutationRecords    A list of mutation records for the gallery tweet.
 */
function handleGalleryContent(mutationRecords) {
    // Go through each mutation record
    mutationRecords.forEach(function(mutationRecord) {
        // Go through each added node
        mutationRecord.addedNodes.forEach(function(addedNode) {
            // If the node is a nice, HTML node
            if (addedNode.tagName) {
                // Add the download link given in the window variable to the action bars
                addedNode.querySelectorAll(".ProfileTweet-actionList").forEach(actionBar => addDownloadLink(window.currentGalleryImage, actionBar));
            }
        });
    });
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
                addedNode.querySelectorAll(".tweet").forEach(addedTweet => addDownloadLinkToTweet(addedTweet));
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
    let mainMutationObserver = new MutationObserver(handleNewTweets);
    let galleryMutationObserver = new MutationObserver(handleGallery);
    let galleryContentCreationMutationObserver = new MutationObserver(handleGalleryContent);
    const mainTweetsMutationConfig = {
        childList: true
    };
    const modalTweetsMutationConfig = {
        childList: true,
        subtree: true
    };
    const galleryMutationConfig = {
        childList: true
    };
    const galleryContentMutationConfig = {
        childList: true,
        subtree: true
    };

    // Get the main tweet container
    let tweetsContainer = document.querySelector("#timeline #stream-items-id");
    // If there is a tweet container present (we are on a valid page)
    if (tweetsContainer) {
        // Add the download link to all current tweets
        tweetsContainer.querySelectorAll(".tweet").forEach(tweet => addDownloadLinkToTweet(tweet));

        // Watch for further tweets being added in
        mainMutationObserver.observe(tweetsContainer, mainTweetsMutationConfig);
    }

    // Get the modal container for specific tweet expansion
    let modalContainer = document.querySelector("#permalink-overlay");
     // If there is a modal container present (we are on a valid page)
    if (modalContainer) {
        // Add the download link to all current tweets
        modalContainer.querySelectorAll(".tweet").forEach(tweet => addDownloadLinkToTweet(tweet));

        // Watch for further tweets being added in
        mainMutationObserver.observe(modalContainer, modalTweetsMutationConfig);
    }

    // Get the gallery media container
    let galleryMediaContainer = document.querySelector(".Gallery-media");
    // If there is a gallery media container present (we are on a valid page)
    if (galleryMediaContainer) {
        // Watch for changes to the gallery image
        galleryMutationObserver.observe(galleryMediaContainer, galleryMutationConfig)
    }

    // Get the gallery tweet container
    let galleryTweetContainer = document.querySelector(".GalleryTweet");
    // If there is a gallery tweet container present (we are on a valid page)
    if (galleryTweetContainer) {
        // Watch for changes to the gallery bar
        galleryContentCreationMutationObserver.observe(galleryTweetContainer, galleryContentMutationConfig)
    }
}

// Prepare the download node so it can be cloned for further use
window.downloadLinkElement = null;
createBaseDownloadLinkElement();
// On navigation to Twitter need to perform the initial script injection
scriptInjection();
