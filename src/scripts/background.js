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

    saveSettings(data) {
        this.settings.saveSettings(data);
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
        let res = '';

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
                    console.log(`No handler for ${request.cmd}`);
                }
                res = cmdHandler[request.cmd].call(cmdHandler, request.data);
                break;


            case 'increment-badge':
                // sessionSpoilersBlocked += 1;

                // chrome.browserAction.setBadgeText({
                //     text: "" + sessionSpoilersBlocked

                // });
                // chrome.runtime.sendMessage({
                //     newSpoilerBlocked: true
                // }, function() {
                //     return cb({
                //         result: "successfully updated"
                //     });
                // });
                break;

            case 'fetch-popup-total':
                // cb({
                //     newTotal: sessionSpoilersBlocked
                // });
                break;

            default:
                res = 'unknown message';
        }

        cb(res);
        let msg = `<-- msg ${request.cmd}`;
        if (typeof request.data != 'object') {
            if (request.data === undefined) {
                let shortData = "undefined";
            } else {
                let shortData = request.data.toString();

                if (request.data.length > 28) {
                    shortData = shortData.substr(0, 28) + '...';
                }
                msg += `(${shortData})`;
            }
        }
        console.groupCollapsed(msg, '|', `${res} -->`);

        if (request.stack) {
            console.log('Stack', request.stack);
            delete request.stack;
        }
        console.log(request);
        console.log(res);
        console.groupEnd();
        return true;
    });
}


init();