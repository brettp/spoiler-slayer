settings = (function() {
    var defaultSettings = {
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

    var cachedSettings = {};

    // update cached settings
    // this doesn't fire soon enough for immediate calls after,
    // so we also manually update the cached setting for each save
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (let name in changes) {
            console.log(`Updating cached settings for ${name} to ${changes[name].newValue}`);
            cachedSettings[name] = changes[name].newValue;
        }
    });

    function load(cb) {
        chrome.storage.sync.get(defaultSettings, function(result) {
            cachedSettings = result;

            console.log("Saved cached settings", cachedSettings);
            if (cb) {
                return cb(result);
            }
        });
    }

    function get(k) {
        return cachedSettings[k];
    }

    function set(k, v, cb) {
        console.log(`Saving setting ${k} to ${v}`);
        var setting = {};
        setting[k] = v;
        cachedSettings[k] = v;

        chrome.storage.sync.set(setting, cb || helpers.nullFunc);
    }

    function save(settings, cb) {
        cachedSettings = settings;
        chrome.storage.sync.set(settings, cb || helpers.nullFunc);
    }

    /* default and original settings */
    var ogSites = [{
            url_regexp: 'avclub.com',
            selector: '.item, article.short, article > .heading'
        },
        {
            url_regexp: 'buzzfeed.com',
            selector: '.card--article-featured, .card--article, .card--package, .card--video, .sidebar__link, .js-now-buzzing__list > li'
        },
        {
            url_regexp: 'facebook.com',
            selector: 'div[data-testid="fbfeed_story"], div[role="article"], #pagelet_trending_tags_and_topics ul > li'
        },
        {
            url_regexp: 'feedly.com',
            selector: '.entry'
        },
        {
            url_regexp: 'gizmodo.com',
            selector: '.featured-item, article'
        },
        {
            url_regexp: 'news.google.com',
            selector: 'a[target="_blank"]'
        },
        {
            url_regexp: 'plus.google.com',
            selector: 'div[id^="update-"], c-wiz div div c-wiz'
        },
        {
            url_regexp: 'reddit.com',
            selector: '.sitetable > .thing.link:visible, .usertext-body, .scrollerItem'
        },
        {
            url_regexp: 'slack.com',
            selector: 'ts-message'
        },
        {
            url_regexp: 'tumblr.com',
            selector: '.post_container, article'
        },
        {
            url_regexp: 'twitter.com',
            selector: "[data-item-type='tweet'], .trend-item"
        },
        {
            url_regexp: 'youtube.com',
            selector: '.yt-lockup, .related-list-item, .comment-renderer-text'
        },
    ];

    var ogSpoilers = [
        '#got',
        'ady stonehea',
        'aidan gillen',
        'alfie allen',
        'arya stark',
        'asoiaf',
        'azor ahai',
        'baelish',
        'baratheon',
        'ben crompton',
        'bloodraven',
        'braavos',
        'bran stark',
        'briene of tarth',
        'brienne of tarth',
        'carice van houten',
        'casterly rock',
        'cersei ',
        'conleth hill',
        'd.b. weiss',
        'daenerys',
        'daniel portman',
        'david benioff',
        'davos seaworth',
        'dornish',
        'dothraki',
        'dreadfort',
        'emilia clarke',
        'game of thrones',
        'gameofthrone',
        'gameofthone',
        'gamesofthrone',
        'greyjoy',
        'gwendoline christie',
        'highgarden',
        'hodor',
        'house bolton',
        'house stark',
        'house tyrell',
        'howland reed',
        'iain glen',
        'ian mcelhinney',
        'iron throne',
        'isaac hempstead wright',
        'jerome flynn',
        'john bradley',
        'jojen reed',
        'jon snow',
        'julian glover',
        'khaleesi',
        "king's landing",
        'kit harington',
        'kit harrington',
        'kristian nairn',
        'lanister',
        'lannisport',
        'lannister',
        'lena headey',
        'liam cunningham',
        'littlefinger',
        'maisie williams',
        'meereen',
        'melisandre',
        'michele fairley',
        'michelle fairley',
        'myrcella',
        'natalie dormer',
        'nathalie emmanue',
        'ned stark',
        'nikolaj coster-waldau',
        'olenna tyrell',
        'peter dinklage',
        'podrick payne',
        'queen of thorns',
        'ramsay bolton',
        'roose bolton',
        'rory mccann',
        'sandor clegane',
        'sansa stark',
        'sophie turner',
        'sothoryos',
        'stephen dillane',
        'targaryen',
        'three eyed raven',
        'tower of joy',
        'tyrion',
        'vaes dothrak',
        'viserys',
        'walder frey',
        'westeros',
        'white walker',
        'whitewalker',
        'wildling',
        'winterfell'
    ];



    // SPOILER_WORDS_REGEX = new RegExp(SPOILER_WORDS_LIST.join('|'), 'i');

    var ogIgnoredSubreddits = [
        'gameofthrones',
        'asoiaf',
        'iceandfire',
        'agotboardgame',
        'gamesofthrones',
        'westeros',
        'thronescomics',
        'asongofmemesandrage',
        'earthoficeandfire'
    ];

    // GOT_SUBREDDITS_REGEX = new RegExp('(\/r\/)' + GOT_RELATED_SUBREDDITS.join('|'), 'i');

    return {
        defaultSettings: defaultSettings,
        load: load,
        get: get,
        set: set,
        save: save,
        ogSites: ogSites,
        ogSpoilers: ogSpoilers,
        ogIgnoredSubreddits: ogIgnoredSubreddits
    };
})();