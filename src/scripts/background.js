var numSpoilersBlocked = 0;

chrome.runtime.onMessage.addListener(function(request, sender, cb) {
    console.log("Got req", request);

    switch (request.cmd) {
        case 'increment-badge':
            numSpoilersBlocked += 1;
            chrome.browserAction.setBadgeText({
                text: "" + numSpoilersBlocked
            });
            chrome.runtime.sendMessage({
                newSpoilerBlocked: true
            }, function() {
                return cb({
                    result: "successfully updated"
                });
            });
        break;

        case 'fetch-popup-total':
            cb({
                newTotal: numSpoilersBlocked
            });
        break;

        // @todo use listeners
        case 'user-prefs-updated':
            loadUserPreferences();
        break;

        // @todo remove
        case 'user-prefs-requested':
            loadUserPreferences(function() {
                return cb(userPreferences);
            });
        break;

        default:
            cb({
                result: "failed to update"
            });
            return false;
    }

    return true;
});