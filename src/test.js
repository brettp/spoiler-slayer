class Settings {
    constructor(saved) {
        if (Object.keys(saved).length < 1) {
            saved = this.defaultSettings;
        }

        this.cached = saved;

        // make all settings accessible as normal props
        for (let k in saved) {
            Object.defineProperty(this, k, {
                get() {
                    return this.cached[k];
                },
                set(v) {
                    console.log("got set");
                    this.set(k, v);
                }
            });
        }
    }

    set(k, v, cb) {
        console.log(`Saving setting ${k} to ${v}`);
        this.cached[k] = v;

        var setting = {};
        setting[k] = v;
        //chrome.storage.sync.set(setting, cb || helpers.nullFunc);
    }

    get defaultSettings() {
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
}

test = new Settings({
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
    sites: [{
            urlRegex: 'reddit.com',
            selector: 'article'
        },
        {
            urlRegex: 'twitter.com',
            selector: 'post'
        },
    ],
    spoilers: []
});

console.log(test);


test.blueHover = false;