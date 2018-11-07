// import "../scripts/lib/helpers";

console.log('Using debug settings API');

var debug = true;

var settings = {
    sites: [
        {
            selector: '.item, article.short, article > .heading',
            urlRegex: 'avclub.com',
        },
        {
            selector:
                '.card--article-featured, .card--article, .card--package, .card--video, .sidebar__link, .js-now-buzzing__list > li',
            urlRegex: 'buzzfeed.com',
        },
        {
            selector:
                'div[data-testid="fbfeed_story"], div[role="article"], #pagelet_trending_tags_and_topics ul > li',
            urlRegex: 'facebook.com',
        },
        {
            selector: '.entry',
            urlRegex: 'feedly.com',
        },
        {
            selector: '.featured-item, article',
            urlRegex: 'gizmodo.com',
        },
    ],
    spoilers: [
        {
            spoiler: '#got',
        },
        {
            spoiler: 'ady stonehea',
        },
        {
            spoiler: 'aidan gillen',
        },
        {
            spoiler: 'alfie allen',
        },
        {
            spoiler: 'arya stark',
        },
        {
            spoiler: 'asoiaf',
        },
        {
            spoiler: 'azor ahai',
        },
        {
            spoiler: 'baelish',
        },
        {
            spoiler: 'baratheon',
        },
    ],
};

sendMsg = async function(...args) {
    console.log('Got msg', ...args);

    return new Promise(res => {
        res(settings);
    });
};


setSetting = getSetting = saveSettings = cmd = sendMsg;``
