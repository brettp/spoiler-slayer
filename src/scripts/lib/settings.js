class Settings {
    static get defaultSettings() {
        return {
            blockingEnabled: true,
            destroySpoilers: false,
            showSpecificSpoiler: true,
            warnBeforeReveal: false,
            // out of 0 - 100, which gets converted to a range from 0-20pt
            // 100 means completely black, no animations
            heavyBlur: 10,
            hoverBlur: 2,
            blurSpoilers: true,
            blurHover: true,
            sites: [],
            spoilers: []
        };
    }

    get compiledSettingsInfo() {
        return {
            'sites': ['sitesRegexp', 'sitesInfo'],
            'spoilers': ['spoilersRegexp']
        };
    }

    constructor(saved) {
        if (saved && Object.keys(saved).length < 1) {
            saved = Settings.defaultSettings;
        }

        this.cached = saved;

        // make all settings accessible as normal props
        for (let k in saved) {
            Object.defineProperty(this, k, {
                get() {
                    return this.cached[k];
                },
                set(v) {
                    console.log("got set for " + k);
                    this.set(k, v);
                }
            });
        }

        // update cached and compiled settings
        // this doesn't fire soon enough for immediate calls after,
        // so we also manually update the cached setting for each save
        var self = this;
        chrome.storage.onChanged.addListener(function(changes, namespace) {
            for (let name in changes) {
                console.log(`Updating cached settings for ${name} to ${changes[name].newValue}`);
                self.cached[name] = changes[name].newValue;

                self.clearCompiledValues(name);
            }
        });
    }

    // compiled settings
    get spoilersRegexp() {
        console.log("Compiling spoilers regexp...");
        let spoilersRegexp = helpers.getSpoilersRegexp(this.spoilers);

        Object.defineProperty(this, 'spoilersRegexp', {
            value: spoilersRegexp,
            writable: false,
            configurable: true
        });

        return this.spoilersRegexp;
    }

    get allSitesRegexp() {
        console.log("Compiling all sites regexp...");
        let urls = [];

        for (var info of this.sites) {
            urls.push(info.url_regexp);
        }

        var urlRegexp = new RegExp(urls.join('|'), 'i');

        Object.defineProperty(this, 'sitesRegexp', {
            value: urlRegexp,
            writable: false,
            configurable: true
        });

        return this.sitesRegexp;
    }

    get compiledSitesAndSelectors() {
        console.log("Compiling individual site regexp");
        let val = [];

        for (let info of this.sites) {
            val.push({
                url_regexp: new RegExp(info.url_regexp, 'i'),
                selector: info.selector
            });
        }

        Object.defineProperty(this, 'compiledSitesAndSelectors', {
            value: val,
            writable: false,
            configurable: true
        });

        return this.compiledSitesAndSelectors;
    }

    set(k, v, cb) {
        console.log(`Saving setting ${k} to ${v}`);
        this.cached[k] = v;

        var setting = {};
        setting[k] = v;
        this.clearCompiledValues(k);

        // only save if this is a known value
        if (k in Settings.defaultSettings) {
            chrome.storage.sync.set(setting, cb || helpers.nullFunc);
        }
    }

    save(settings, cb) {
        cachedSettings = settings;
        chrome.storage.sync.set(settings, cb || helpers.nullFunc);
    }

    /**
     * Clears compiled values so they will be recalculated
     * based on new settings
     *
     * @param {String} changed
     */
    clearCompiledValues(changed) {
        if (changed in this.compiledSettingsInfo) {
            for (let name of this.compiledSettingsInfo[changed]) {
                delete this[name];
            }
        }
    }

    /**
     * Updates the cached version without firing a changed event
     *
     * @param {String} k
     * @param {mixed} v
     */
    update(k, v) {
        this.cached[k] = v;
    }

    static factory() {
        return new Promise(res => {
            chrome.storage.sync.get(Settings.defaultSettings, settings => {
                res(new Settings(settings));
            });
        });
    }
}