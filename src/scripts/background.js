class CmdHandler {
    constructor(settings) {
        this.settings = settings;
        this.blockedCounts = {
            // since the browser was open
            session: {
                total: 0,
                hosts: {

                }
            },
            // on this page load
            // tracked by tabId
            page: {}
        }

        this.blockedCounts.lifetime = this.settings.lifetimeBlockedCount;
        console.log(this.blockedCounts);
    }

    validUrl(url) {
        return this.settings.allSitesRegex.test(url);
    }

    shouldBlock(url) {
        return this.settings.blockingEnabled && this.validUrl(url) && this.settings.spoilersRegex !== false;
    }

    getSelectors(url) {
        let selectors = [];

        for (var info of this.settings.compiledSitesAndSelectors) {
            if (info.urlRegex.test(url)) {
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
        this.settings.save(data);
    }

    getDefaultSettings() {
        return Settings.defaultSettings;
    }

    hasSpoilers(text) {
        var regex = this.settings.spoilersRegex
        return text.match(regex);
    }

    incBlockCount(count, sender) {
        let tabInfo = sender.tab;
        // let tabInfo = await getTabInfo(tabId);
        let url = new URL(tabInfo.url);

        if (!count) {
            count = 1;
        }

        // lifetime (is persisted and synced kinda?)
        this.blockedCounts.lifetime.total += count;
        if (!this.blockedCounts.lifetime.hosts[url.host]) {
            this.blockedCounts.lifetime.hosts[url.host] = 0;
        }
        this.blockedCounts.lifetime.hosts[url.host] += count;
        // @todo this is a perfect example for a proxied Setting object
        this.settings.lifetimeBlockedCount = this.blockedCounts.lifetime;

        // session
        this.blockedCounts.session.total += count;
        if (!this.blockedCounts.session.hosts[url.host]) {
            this.blockedCounts.session.hosts[url.host] = 0;
        }

        this.blockedCounts.session.hosts[url.host] += count;


        if (!this.blockedCounts.page[tabInfo.id]) {
            this.blockedCounts.page[tabInfo.id] = 0;
        }

        this.blockedCounts.page[tabInfo.id] += count;

        return this.blockedCounts;
    }

    // when a tab is activated, see if the badge needs updated
    // based on the settings
    showCorrectBadgeCount(data, sender) {
        let tab, url, info = {};
        // default to sender's tab, but allow settings to specify tab
        // it has problems resolving the active tab when this is called from settings
        if (data && data.tab) {
            tab = data.tab;
        } else {
            if (!sender.tab) {
                return;
            }
            tab = sender.tab;
        }

        info.tabId = tab.id;

        switch (this.settings.badgeDisplay) {
            case 'life':
                info.text = this.blockedCounts.lifetime.total
                break;

            case 'lifeSite':
                url = new URL(tab.url);
                info.text = this.blockedCounts.lifetime.hosts[url.host];
                break;


            case 'session':
                info.text = this.blockedCounts.session.total;
                break;

            case 'sessionSite':
                url = new URL(tab.url);
                info.text = this.blockedCounts.session.hosts[url.host];
                break;

            case 'pageload':
                info.text = this.blockedCounts.page[tab.id];
                break;

            case 'none':
                info.text = '';
                break;
        }

        this.setBadgeText(info);

        return info;
    }

    resetBadgePageCount(cmd, sender) {
        if (sender.tab && sender.tab.id) {
            this.blockedCounts.page[sender.tab.id] = 0;
        }
    }

    debug(msg) {
        console.log(msg);
        return msg;
    }

    getActiveTabInfo() {
        return _getActiveTabInfo();
    }

    setBadgeText(text = 0) {
        if (!text || text == '') {
            text = 0;
        }
        if (typeof text !== 'object') {
            text = {text: text};
        }

        if (!text.text) {
            text.text = 0;
        }

        text.text = helpers.friendlyNum(parseInt(text.text)).toString();

        if (text.text == 0) {
            text.text = '';
        }
        chrome.browserAction.setBadgeText(text);
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
// and so we can pre-compile the regex
async function init() {
    settings = await Settings.factory();
    let cmdHandler = new CmdHandler(settings);

    chrome.runtime.onMessage.addListener(function(req, sender, cb) {
        let res = '';

        if (req.cmd in cmdHandler) {
            res = cmdHandler[req.cmd].call(cmdHandler, req.data, sender);
        } else {
            if (settings.debug) {
                debugMsg(req, res);
            }
            throw `Unknown command '${cmd}'`;
        }

        if (settings.debug) {
            debugMsg(req, res);
        }
        cb(res);
        return true;
    });

    chrome.tabs.onActivated.addListener(function(info) {
        chrome.tabs.get(info.tabId, function(tabInfo) {
            // put in same format as the sender obj
            debugMsg({
                cmd: 'tabs.onActivated'
            }, tabInfo);
            cmdHandler.showCorrectBadgeCount(null, {
                tab: tabInfo
            });
        });
    });

    chrome.tabs.onUpdated.addListener((id, changes, tab) => {
        // console.log(id, changes, tab);
    });

    return settings;
}

async function getTabInfo(info) {
    return new Promise(res => {
        chrome.tabs.get(info.tabId, (info) => {
            res(info);
        });
    });
}

async function _getActiveTabInfo() {
    return new Promise(res => {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, (tabs) => {
            let tab = tabs.pop();
            res(tab);
        });
    });
}

// so it's accessible on the background page console
var settings;
init();