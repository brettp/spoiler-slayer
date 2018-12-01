class Settings {
    /**
     * Define available settings and set defaults.
     */
    static get defaultSettings() {
        return {
            hideTips: false,
            blockingEnabled: true,
            destroySpoilers: false,
            showSpecificSpoiler: true,
            warnBeforeReveal: false,
            heavyBlur: 10,
            hoverBlur: 2,
            blurSpoilers: true,
            blurHover: true,
            badgeDisplay: 'pageload',
            sites: [],
            spoilers: [],
            subscriptions: [],
            lifetimeBlockedCount: {
                total: 0,
                hosts: {},
            },
            // translated into seconds in the getter
            transitionDuration: 2,

            // debug and hidden options
            debug: false,
            disableOnDocReady: false,
        };
    }

    get compiledSettings() {
        return [
            'allSitesRegex',
            'compiledSitesAndSelectors',
            'transitionDurationSecs',
            'mergedSpoilers',
            'mergedSites',
        ];
    }

    /**
     * Defines which settings need recompiled when a setting changes.
     * changed_setting: [settings to recompile]
     */
    get compiledSettingsInfo() {
        return {
            sites: ['allSitesRegex', 'compiledSitesAndSelectors'],
            spoilers: ['spoilersRegex'],
            transitionDuration: ['transitionDurationSecs'],
            subscriptions: ['mergedSpoilers', 'mergedSites', 'allSitesRegex', 'compiledSitesAndSelectors', 'spoilersRegex']
        };
    }

    /**
     * Returns all settings, including compiled (as values)
     */
    get allSettings() {
        let settings = this.cached;
        for (const setting of this.compiledSettings) {
            settings[setting] = this[setting];
        }
        return settings;
    }

    constructor(saved) {
        if (saved && Object.keys(saved).length < 1) {
            saved = Settings.defaultSettings;
        } else {
            // make sure we have defaults
            saved = {...Settings.defaultSettings, ...saved};
        }

        Object.defineProperty(this, 'cached', {
            value: saved,
            enumerable: false
        })

        // make all settings accessible as normal props
        for (let k in saved) {
            if (this.compiledSettings.includes(k)) {
                continue;
            }

            Object.defineProperty(this, k, {
                get() {
                    return this.cached[k];
                },
                set(v) {
                    this.set(k, v);
                },
                enumerable: true
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
                console.log(`Updating cached settings for ${name} to`, changes[name].newValue);
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
            // define a getter for the prop that compiles when called
            get() {
                let val = this.compileProp(propName);

                // re-define the prop with a real value
                // if the prop is deleted (e.g., when settings change), the above getter takes back over
                // to recompile and define the real value again
                Object.defineProperty(this, propName, {
                    value: val,
                    configurable: true,
                    writeable: false,
                    enumerable: false,
                });

                return val;
            },
            configurable: true,
            writeable: false,
            enumerable: false
        });
    }

    compileProp(name, compiler) {
        if (compiler) {
            console.log(`Compiling setting ${name} using ${helpers.describe(compiler)}`);
            compiler.call(this, name);
        } else if (this[name + 'Compiler']) {
            console.log(
                `Compiling setting ${name} using ${this.constructor.name}.${name}Compiler()`
            );
            return this[name + 'Compiler'].call(this);
        }
    }

    mergedSpoilersCompiler() {
        let spoilers = this.cached.spoilers;

        for (let sub of this.subscriptions) {
            if (sub.useSpoilers && sub.content && sub.content.spoilers.length > 0) {
                spoilers = spoilers.concat(sub.content.spoilers);
            }
        }

        return spoilers;
    }

    mergedSitesCompiler() {
        let sites = this.cached.sites;

        for (let sub of this.subscriptions) {
            if (sub.useSites && sub.content && sub.content.sites.length > 0) {
                sites = sites.concat(sub.content.sites);
            }
        }

        return sites;
    }

    spoilersRegexCompiler() {
        var spoiler_strs = [];
        if (!this.mergedSpoilers) {
            return false;
        }

        for (let info of this.mergedSpoilers) {
            let spoiler = helpers.getRegexStr(info.spoiler, info.isRegex);

            if (spoiler) {
                spoiler_strs.push(spoiler);
            }
        }

        return new RegExp(spoiler_strs.join('|'), 'iu');
    }

    allSitesRegexCompiler() {
        let urls = [];

        for (let info of this.mergedSites) {
            let regex = helpers.getRegexStr(info.urlRegex, info.isRegex);
            urls.push(regex);
        }

        let urlRegex = new RegExp(urls.join('|'), 'iu');
        return urlRegex;
    }

    compiledSitesAndSelectorsCompiler() {
        let val = [];

        for (let info of this.mergedSites) {
            val.push({
                urlRegex: new RegExp(helpers.getRegexStr(info.urlRegex, info.isRegex), 'iu'),
                selector: info.selector,
            });
        }

        return val;
    }

    transitionDurationSecsCompiler() {
        switch (parseInt(this.transitionDuration)) {
            case 0:
                return 0;
            case 1:
                return 0.25;
            case 2:
                return 0.5;
            case 3:
                return 1;
            case 4:
                return 2;
            default:
                return 0.25;
        }
    }

    // @todo this doesn't work...the cmd never hits the listener
    // async badgeDisplayOnChange(changes) {
    //     console.log("Need to update badge");
    //     await cmd('debug', 'wtf');
    //     console.log('sent cmd');
    // }

    set(k, v) {
        // only save if this is a known value
        // if (k in Settings.defaultSettings) {
            console.log(`Saving setting ${helpers.describe(k)} to`, v);
            this.cached[k] = v;

            var setting = {};
            setting[k] = v;
            this.clearCompiledValues(k);

            // @todo use a Setting class that knows when it changed
            let cb = helpers.nullFunc;
            if (typeof this[k + 'OnChange'] === 'function') {
                cb = this[k + 'OnChange'];
            }

            try {
                chrome.storage.sync.set(setting, cb);
            } catch (e) {
                // this doesn't actually catch it...
                console.log('Error syncing settings!', e);
            }
        // } else {
        //     console.log(`Unknown settings ${helpers.describe(k)}. Will not set to`, v);
        // }
    }

    save(settings, cb) {
        this.cached = settings;
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
