// since the browser was open
var sessionSpoilersBlocked = 0;
// on this page load
var pageSpoilersBlocked = 0;
// for each page since the browser was opened
var siteSessionSpoilersBlocked = {};

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

    incBlockCount(host) {
        sessionSpoilersBlocked++;
        pageSpoilersBlocked++;
        if (!siteSessionSpoilersBlocked[host]) {
            siteSessionSpoilersBlocked[host] = 0;
        }
        siteSessionSpoilersBlocked[host]++;
    }

    showSessionCount() {
        this.updateBadge(sessionSpoilersBlocked);
    }

    resetPageCount() {
        pageSpoilersBlocked = 0;
    }

    showPageCount() {
        this.updateBadge(pageSpoilersBlocked);
    }

    // @todo this isn't the right way to get the active tabs
    // when switching tabs, update the badge
    async showSiteSessionCount() {
        let tabs = await this.getActiveTabInfo();
        if (!tabs.length > 0 || !tabs[0].url) {
            return;
        }
        let url = new URL(tabs[0].url);
        this.updateBadge(siteSessionSpoilersBlocked[url.hostname]);
        return siteSessionSpoilersBlocked[url.hostname];
    }

    async getActiveTabInfo() {
        return new Promise(res => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                res(tabs);
            });
        });

    }

    updateBadge(text) {
        if (!text) {
            text = '';
        }
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
        let desc = helpers.describe(req.data).replace(/\s\s+/g, ' ');
        let param = helpers.excerpt(desc, max - open.length - 2);
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