var sessionSpoilersBlocked = 0;
var pageSpoilersBlocked = {};

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

    incSessionCount() {
        sessionSpoilersBlocked++;
        return sessionSpoilersBlocked;
    }

    showSessionCount() {
        this.updateBadge(sessionSpoilersBlocked);
    }

    resetPageCount(host) {
        pageSpoilersBlocked[host] = 0;
    }

    incPageCount(host) {
        if (!pageSpoilersBlocked[host]) {
            pageSpoilersBlocked[host] = 0;
        }
        pageSpoilersBlocked[host]++;
        return pageSpoilersBlocked[host];
    }

    showPageCount(host) {
        this.updateBadge(pageSpoilersBlocked[host]);
    }

    updateBadge(text) {
        text = text.toString();
        chrome.browserAction.setBadgeText({
            text: text
        });
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

        if (request.cmd in cmdHandler) {
            res = cmdHandler[request.cmd].call(cmdHandler, request.data);
        } else {
            console.log(`No handler for ${request.cmd}`);
            res = false;
        }

        if (settings.debug) {
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
        }
        cb(res);
        return true;
    });
}


init();