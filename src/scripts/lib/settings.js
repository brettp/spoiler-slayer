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
            debug: false,
            sites: [],
            spoilers: []
        };
    }

    get compiledSettingsInfo() {
        return {
            'sites': ['allSitesRegexp', 'sitesInfo', 'compiledSitesAndSelectors'],
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

        this.setUpCompiledProps();
    }

    setUpCompiledProps() {
        for (let settingName in this.compiledSettingsInfo) {
            let props = this.compiledSettingsInfo[settingName];

            for (let propName of props) {
                this.addCompiledProp(propName);
            }
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

    addCompiledProp(propName) {
        let compiler = propName + 'Compiler';

        if (!this[compiler]) {
            return;
        }

        // define lazy loading and caching props
        // these will be compiled on first access, then cached,
        // but removed if their settings change, causing them
        // to be re-compiled and cached on the first call after
        Object.defineProperty(this.constructor.prototype, propName, {
            // define a getter the prop with a getter that compiles
            get() {
                let val = this.compileProp(propName);

                // re-define the prop with a real value
                // if the prop is deleted (e.g., when settings change), the above getter takes back over
                // to recompile and define the real value again
                Object.defineProperty(this, propName, {
                    value: val,
                    configurable: true,
                    writeable: false
                });

                return val;
            },
            configurable: true,
            writeable: false
        });
    }

    compileProp(name, compiler) {
        if (compiler) {
            console.log(`Compiling setting ${name} using ${helpers.describe(compiler)}`);
            compiler.call(this, name);
        } else if (this[name + 'Compiler']) {
            console.log(`Compiling setting ${name} using ${this.constructor.name}.${name}Compiler()`);
            return this[name + 'Compiler'].call(this);
        }
    }

    // compiled settings
    spoilersRegexpCompiler() {
        let spoilersRegexp = helpers.getSpoilersRegexp(this.spoilers);
        return spoilersRegexp;
    }

    allSitesRegexpCompiler() {
        let urls = [];

        for (let info of this.sites) {
            urls.push(info.url_regexp);
        }

        let urlRegexp = new RegExp(urls.join('|'), 'i');
        return urlRegexp;
    }

    compiledSitesAndSelectorsCompiler() {
        let val = [];

        for (let info of this.sites) {
            val.push({
                url_regexp: new RegExp(info.url_regexp, 'i'),
                selector: info.selector
            });
        }

        return val;
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
                console.log(`Clearing compiled value ${name} because ${changed} changed`);
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