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

    static get demoSettings() {
        return {
            subscriptions: [
                Subscription.factory({
                    url: 'https://gist.github.com/brettp/60faa5f1e217b4fb082e4e8a808dd402',
                    useSites: true,
                    useSpoiler: false
                })
            ],
            sites: [

            ],
            spoilers: [

            ]
        }
    }

    get compiledSettings() {
        return [
            'sitesRegex',
            'spoilersRegex',
            'compiledSitesAndSelectors',
            'transitionDurationSecs',
            'mergedSpoilers',
            'mergedSites',
        ];
    }

    get proxiedSettings() {
        return ['spoilers', 'sites', 'subscriptions'];
    }

    /**
     * Returns all settings, including compiled (as values)
     */
    get allSettings() {
        let settings = this.cached;
        for (const setting of this.compiledSettings) {
            settings[setting] = this[setting];
        }

        settings.spoilers = Object.values(this.spoilers);
        settings.sites = Object.values(this.sites);
        settings.subscriptions = Object.values(this.subscriptions);

        return settings;
    }

    constructor(saved) {
        let val;
        // make sure we have defaults
        saved = {...Settings.defaultSettings, ...saved};

        Object.defineProperty(this, 'cached', {
            value: saved,
            enumerable: false
        })

        // make all settings accessible as normal props
        for (let k in saved) {
            // not saveable so don't wrap
            if (this.compiledSettings.includes(k)) {
                continue;
            }

            let props = {
                get() {
                    return this.cached[k];
                },
                enumerable: true
            };

            // initial proxied setting
            if (this.proxiedSettings.includes(k)) {
                this.cached[k] = this.proxySetting(k, this.cached[k]);
                // this sets the object itself
                // the proxy sets the props on that object
                props.set = function(v) {
                    this.cached[k] = this.proxySetting(k, v);
                    this.clearCompiledValues(k);
                    this.update(k);
                }
            } else {
                props.set = function(v) {
                    this.cached[k] = v;
                    this.clearCompiledValues(k);
                    this.update(k);
                }
            }

            Object.defineProperty(this, k, props);
        }

        this.setUpCompiledProps();
    }

    proxySetting(settingName, base) {
       return new Proxy(base, {
            set: (target, prop, val, receiver) => {
                Reflect.set(target, prop, val, receiver);

                // when splicing an array that would leave it empty, nothing is set expect length
                if (prop !== 'length' || prop === 'length' && val === 0) {
                    this.clearCompiledValues(settingName)
                    this.update(settingName);
                }
                return true;
            }
        });
    }

    setUpCompiledProps() {
        for (let propName of this.compiledSettings) {
            this.addCompiledProp(propName);
        }

        // update cached and compiled settings
        // this doesn't fire soon enough for immediate calls after,
        // so we also manually update the cached setting for each save
        // var self = this;
        // chrome.storage.onChanged.addListener(function(changes, namespace) {
        //     for (let name in changes) {
        //         console.log(`Updating cached settings for ${name} to`, changes[name].newValue);
        //         // self.cached[name] = changes[name].newValue;

        //         self.clearCompiledValues(name);
        //     }
        // });
    }

    addCompiledProp(propName) {
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
            if (this.debug) {
                console.log(`Compiling setting ${name} using ${helpers.describe(compiler)}`);
            }
            compiler.call(this, name);
        } else if (this[name + 'Compiler']) {
            if (this.debug) {
                console.log(`Compiling setting ${name} using ${this.constructor.name}.${name}Compiler()`);
            }
            return this[name + 'Compiler'].call(this);
        }
    }

    mergedSpoilersCompiler() {
        let spoilers = this.spoilers;

        for (let sub of this.subscriptions) {
            if (sub.useSpoilers && sub.content && sub.content.spoilers && sub.content.spoilers.length > 0) {
                spoilers = spoilers.concat(sub.content.spoilers);
            }
        }

        return spoilers;
    }

    mergedSitesCompiler() {
        let sites = this.sites;

        for (let sub of this.subscriptions) {
            if (sub.useSites && sub.content && sub.content.sites && sub.content.sites.length > 0) {
                sites = sites.concat(sub.content.sites);
            }
        }

        return sites;
    }

    spoilersRegexCompiler() {
        var spoiler_strs = [];
        if (this.mergedSpoilers.length < 1) {
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

    sitesRegexCompiler() {
        let urls = [];

        if (this.mergedSites.length < 1) {
            return false;
        }

        for (let info of this.mergedSites) {
            let regex = helpers.getRegexStr(info.urlRegex, info.isRegex);
            if (regex) {
                urls.push(regex);
            }
        }

        if (urls.length < 1) {
            return false;
        }

        let urlRegex = new RegExp(urls.join('|'), 'iu');
        return urlRegex;
    }

    compiledSitesAndSelectorsCompiler() {
        let val = [];

        for (let info of this.mergedSites) {
            val.push({
                urlRegex: new RegExp(helpers.getRegexStr(info.urlRegex, info.isRegex), 'iu'),
                selector: Settings.addNotToSelector(info.selector, '.spoiler-blocker-glamoured'),
            });
        }

        return val;
    }

    static trimAndAppend(txt, append) {
        txt = txt.trim();
        return txt ? txt + append : '';
    }

    static addNotToSelector(selector, not) {
        // technically commas are allowed in class names, but not as a selector
        // more problematically, commas are allowed in data and name attributes
        let re = /'[^']+'|"[^"]+"/g;
        if (re.test(selector)) {
            let tokens = [];
            let replaced = selector.replace(re, match => {
                tokens.push(match);
                return `!TOKEN_${tokens.length - 1}!`;
            });

            let notted = replaced.split(',')
                .map(txt => Settings.trimAndAppend(txt, `:not(${not})`))
                .join(',');

            for (let i = 0; i < tokens.length; i++) {
                notted = notted.replace(`!TOKEN_${i}!`, tokens[i]);
            }

            return notted;
        } else {
            return selector.split(',')
                .map(txt => Settings.trimAndAppend(txt, `:not(${not})`))
                .join(',');
        }
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

    update(name) {
        var setting = {};

        // don't save the arrays as objects
        if (this.proxiedSettings.includes(name)) {
            setting[name] = Object.values(this[name]);
        } else {
            setting[name] = this[name];
        }

        // @todo use a Setting class that knows when it changed
        let cb = helpers.nullFunc;

        try {
            chrome.storage.sync.set(setting, cb);
        } catch (e) {
            // this doesn't actually catch it...
            console.log('Error syncing settings!', e);
        }
    }

    save() {
        let settings = {};

        for (const name in this) {
            if (this.proxiedSettings.includes(name)) {
                settings[name] = Object.values(this[name]);
            } else {
                settings[name] = this[name];
            }
        }

        return new Promise(res => {
            chrome.storage.sync.set(settings, setRes => res(setRes));
        });
    }

    /**
     * Clears compiled values so they will be recalculated
     * based on new settings
     *
     */
    clearCompiledValues() {
        if (this.debug) {
            console.log("Clearing compiled values");
        }
        for (let name of this.compiledSettings) {
            delete this[name];
        }
    }

    static factory() {
        return new Promise(res => {
            chrome.storage.sync.get(Settings.defaultSettings, settings => {
                res(new Settings(settings));
            });
        });
    }
}

if (typeof require !== 'undefined') {
    module.exports = {
        Settings: Settings
    }
}