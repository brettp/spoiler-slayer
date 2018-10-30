import './styles';
import '../../node_modules/@fortawesome/fontawesome-free/css/all';
import {Settings as SpoilerSettings} from './components/spoilers/settings';
import {Settings as SiteSettings} from './components/sites/settings';

export default function Options() {
    // let settings = await cmd('getSettings');
    let settings = {
        sites: [
            {
                selector: '.item, article.short, article > .heading',
                url_regexp: 'avclub.com',
            },
            {
                selector:
                    '.card--article-featured, .card--article, .card--package, .card--video, .sidebar__link, .js-now-buzzing__list > li',
                url_regexp: 'buzzfeed.com',
            },
            {
                selector:
                    'div[data-testid="fbfeed_story"], div[role="article"], #pagelet_trending_tags_and_topics ul > li',
                url_regexp: 'facebook.com',
            },
            {
                selector: '.entry',
                url_regexp: 'feedly.com',
            },
            {
                selector: '.featured-item, article',
                url_regexp: 'gizmodo.com',
            },
            {
                selector: 'a[target="_blank"]',
                url_regexp: 'news.google.com',
            },
            {
                selector: 'div[id^="update-"], c-wiz div div c-wiz',
                url_regexp: 'plus.google.com',
            },
            {
                selector: '.sitetable > .thing.link:visible, .usertext-body, .scrollerItem',
                url_regexp: 'reddit.com',
            },
            {
                selector: 'ts-message',
                url_regexp: 'slack.com',
            },
            {
                selector: '.post_container, article',
                url_regexp: 'tumblr.com',
            },
            {
                selector: "[data-item-type='tweet'], .trend-item",
                url_regexp: 'twitter.com',
            },
            {
                selector: '.yt-lockup, .related-list-item, .comment-renderer-text',
                url_regexp: 'youtube.com',
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
            {
                spoiler: 'ben crompton',
            },
            {
                spoiler: 'bloodraven',
            },
            {
                spoiler: 'braavos',
            },
            {
                spoiler: 'bran stark',
            },
            {
                spoiler: 'briene of tarth',
            },
            {
                spoiler: 'brienne of tarth',
            },
            {
                spoiler: 'carice van houten',
            },
            {
                spoiler: 'casterly rock',
            },
            {
                spoiler: 'cersei ',
            },
            {
                spoiler: 'conleth hill',
            },
            {
                spoiler: 'd.b. weiss',
            },
            {
                spoiler: 'daenerys',
            },
            {
                spoiler: 'daniel portman',
            },
            {
                spoiler: 'david benioff',
            },
            {
                spoiler: 'davos seaworth',
            },
            {
                spoiler: 'dornish',
            },
            {
                spoiler: 'dothraki',
            },
            {
                spoiler: 'dreadfort',
            },
            {
                spoiler: 'emilia clarke',
            },
            {
                spoiler: 'game of thrones',
            },
            {
                spoiler: 'gameofthrone',
            },
            {
                spoiler: 'gameofthone',
            },
            {
                spoiler: 'gamesofthrone',
            },
            {
                spoiler: 'greyjoy',
            },
            {
                spoiler: 'gwendoline christie',
            },
            {
                spoiler: 'highgarden',
            },
            {
                spoiler: 'hodor',
            },
            {
                spoiler: 'house bolton',
            },
            {
                spoiler: 'house stark',
            },
            {
                spoiler: 'house tyrell',
            },
            {
                spoiler: 'howland reed',
            },
            {
                spoiler: 'iain glen',
            },
            {
                spoiler: 'ian mcelhinney',
            },
            {
                spoiler: 'iron throne',
            },
            {
                spoiler: 'isaac hempstead wright',
            },
            {
                spoiler: 'jerome flynn',
            },
            {
                spoiler: 'john bradley',
            },
            {
                spoiler: 'jojen reed',
            },
            {
                spoiler: 'jon snow',
            },
            {
                spoiler: 'julian glover',
            },
            {
                spoiler: 'khaleesi',
            },
            {
                spoiler: "king's landing",
            },
            {
                spoiler: 'kit harington',
            },
            {
                spoiler: 'kit harrington',
            },
            {
                spoiler: 'kristian nairn',
            },
            {
                spoiler: 'lanister',
            },
            {
                spoiler: 'lannisport',
            },
            {
                spoiler: 'lannister',
            },
            {
                spoiler: 'lena headey',
            },
            {
                spoiler: 'liam cunningham',
            },
            {
                spoiler: 'littlefinger',
            },
            {
                spoiler: 'maisie williams',
            },
            {
                spoiler: 'meereen',
            },
            {
                spoiler: 'melisandre',
            },
            {
                spoiler: 'michele fairley',
            },
            {
                spoiler: 'michelle fairley',
            },
            {
                spoiler: 'myrcella',
            },
            {
                spoiler: 'natalie dormer',
            },
            {
                spoiler: 'nathalie emmanue',
            },
            {
                spoiler: 'ned stark',
            },
            {
                spoiler: 'nikolaj coster-waldau',
            },
            {
                spoiler: 'olenna tyrell',
            },
            {
                spoiler: 'peter dinklage',
            },
            {
                spoiler: 'podrick payne',
            },
            {
                spoiler: 'queen of thorns',
            },
            {
                spoiler: 'ramsay bolton',
            },
            {
                spoiler: 'roose bolton',
            },
            {
                spoiler: 'rory mccann',
            },
            {
                spoiler: 'sandor clegane',
            },
            {
                spoiler: 'sansa stark',
            },
            {
                spoiler: 'sophie turner',
            },
            {
                spoiler: 'sothoryos',
            },
            {
                spoiler: 'stephen dillane',
            },
            {
                spoiler: 'targaryen',
            },
            {
                spoiler: 'three eyed raven',
            },
            {
                spoiler: 'tower of joy',
            },
            {
                spoiler: 'tyrion',
            },
            {
                spoiler: 'vaes dothrak',
            },
            {
                spoiler: 'viserys',
            },
            {
                spoiler: 'walder frey',
            },
            {
                spoiler: 'westeros',
            },
            {
                spoiler: 'white walker',
            },
            {
                spoiler: 'whitewalker',
            },
            {
                spoiler: 'wildling',
            },
            {
                spoiler: 'winterfell',
            },
        ],
    };

    return (
        <div id="options">
            <h2 id="title">Game of Spoils Lite</h2>
            <hr />
            <SpoilerSettings spoilers={settings.spoilers} />
            <SiteSettings sites={settings.sites} />
        </div>
    );
}
