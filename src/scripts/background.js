var sessionSpoilersBlocked = 0;
class CmdHandler {
    constructor(settings) {
        this.settings = settings;
    }

    validUrl(url) {
        return this.settings.allSitesRegexp.test(url);
    }

    shouldBlock(url) {
        return this.settings.blockingEnabled && this.validUrl(url) && this.settings.spoilersRegexp !== false;
    }

    getSelectors(url) {
        let selectors = [];

        for (var info of this.settings.compiledSitesAndSelectors) {
            if (info.url_regexp.test(url)) {
                selectors.push(info.selector);
            }
        }

        return selectors.join(',');
    }

    getSetting(setting) {
        return this.settings[setting];
    }

    getSettings() {
        return this.settings.cached;
    }

    setSetting(data) {
        this.settings[data.name] = data.value;
    }

    getDefaultSettings() {
        return this.settings.defaultSettings;
    }

    hasSpoilers(text) {
        var regexp = this.settings.spoilersRegexp
        return text.match(regexp);
    }
}

// manage settings object here to avoid reloading on every page
// and so we can pre-compile the regexp
async function init() {
    let settings = await Settings.factory();
    console.log("Settings", settings);
    let cmdHandler = new CmdHandler(settings);

    chrome.runtime.onMessage.addListener(function(request, sender, cb) {
        console.log("<--", request);

        switch (request.cmd) {
            case 'validUrl':
            case 'getSetting':
            case 'getSettings':
            case 'setSetting':
            case 'saveSettings':
            case 'shouldBlock':
            case 'hasSpoilers':
            case 'getSelectors':
                if (!request.cmd in cmdHandler) {
                    console.log(`--- no handler for ${request.cmd}`);
                }
                let res = cmdHandler[request.cmd].call(cmdHandler, request.data);
                console.log("-->", res);
                cb(res);
                break;


            case 'increment-badge':
                sessionSpoilersBlocked += 1;

                chrome.browserAction.setBadgeText({
                    text: "" + sessionSpoilersBlocked

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
                    newTotal: sessionSpoilersBlocked
                });
            break;

            // probably shouldn't use ever
            case 'get-settings':
                cb(settings.cached);
            break;

            case 'get-setting':
                cb(settings[request.name]);

            case 'set-setting':
                settings.set(request.name, request.value, cb);
            break;

            case 'save-settings':
                settings.save(request.settings, cb);
            break;

            case 'valid-url':

                break;

            case 'ready-to-block':
                // is enabled?
                // has sites?
                // has spoilers?


            case 'has-spoilers':

                break;

            default:
                cb({
                    result: "failed to update"
                });
                return false;
        }

        return true;
    });
}


init();