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


function debugMsg(req, res) {
    let max = 50;

    let open = `<-- ${req.cmd}`;
    if (req.data) {
        let param = helpers.excerpt(req.data, max - open.length - 2);
        open += `(${param})`;
    }

    open = open.padEnd(max, " ");

    let end = " -->";
    end = helpers.excerpt(res, max - end.length) + end;
    end = end.padStart(max, " ");

    console.groupCollapsed(open, "|", end);

    console.log("Request", req);
    console.log("Response", res);
    if (req.stack) {
        console.log("Stack", req.stack);
        delete req.stack;
    }
    console.groupEnd();
}

// manage settings object here to avoid reloading on every page
// and so we can pre-compile the regexp
async function init() {
    settings = await Settings.factory();
    let cmdHandler = new CmdHandler(settings);
    console.log("Settings", settings);

    chrome.runtime.onMessage.addListener(function(req, sender, cb) {
        let res = '';

        if (req.cmd in cmdHandler) {
            res = cmdHandler[req.cmd].call(cmdHandler, req.data);
        } else {
            console.log(`No handler for ${req.cmd}`);
            res = false;
        }

        if (settings.debug) {
            debugMsg(req, res);
        }
        cb(res);
        return true;
    });

    return settings;
}

// so it's accessible on the background page console
var settings;
init();