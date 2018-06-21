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
    let downloadLinkElement = document.createElement('img');
    downloadLinkElement.src = chrome.runtime.getURL("resources/twitter_download_icon.png");

    // Get the action bar
    let actionBar = tweet.querySelector(".ProfileTweet-actionList");

    // Add in the new element
    actionBar.appendChild(downloadLinkElement);
}

/**
 *
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
