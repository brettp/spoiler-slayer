# default settings
SETTINGS = {
  sites: [],
  spoilers: [],
  blockingEnabled: true,
  showSpecificWordEnabled: true,
  destroySpoilers: false,
  warnBeforeReveal: false
}

# jQuery selectors that specify elements to block on each supported site
SELECTORS = [
  {
    url_regexp: 'avclub_feed',
    selector: '.item, article.short, article > .heading'
  }
  # buzzfeed         : '.card--article-featured, .card--article, .card--package, .card--video, .sidebar__link, .js-now-buzzing__list > li'
  # facebook_feed    : 'div[data-testid:"fbfeed_story"], div[role:"article"], #pagelet_trending_tags_and_topics ul > li'
  # feedly           : '.entry'
  # gizmodo          : '.featured-item, article'
  # google_news_feed : 'a[target:"_blank"]'
  # google_plus      : 'div[id^:"update-"], c-wiz div div c-wiz'
  {
    url_regexp: 'reddit.com',
    selector: '.sitetable > .thing.link:visible, .usertext-body'
  }
  # slack_feed       : 'ts-message'
  # tumblr           : '.post_container, article'
  # twitter_feed     : "[data-item-type:'tweet'], .trend-item"
  # youtube          : '.yt-lockup, .related-list-item, .comment-renderer-text'
];

# GoT-specific words that are potentially spoiler-ific and thus trigger a spoiler blocker
SPOILER_WORDS_LIST = [
  '#got'
  'ady stonehea'
  'aidan gillen'
  'alfie allen'
  'arya stark'
  'asoiaf'
  'azor ahai'
  'baelish'
  'baratheon'
  'ben crompton'
  'bloodraven'
  'braavos'
  'bran stark'
  'briene of tarth'
  'brienne of tarth'
  'carice van houten'
  'casterly rock'
  'cersei '
  'conleth hill'
  'd.b. weiss'
  'daenerys'
  'daniel portman'
  'david benioff'
  'davos seaworth'
  'dornish'
  'dothraki'
  'dreadfort'
  'emilia clarke'
  'game of thrones'
  'gameofthrone'
  'gameofthone'
  'gamesofthrone'
  'greyjoy'
  'gwendoline christie'
  'highgarden'
  'hodor'
  'house bolton'
  'house stark'
  'house tyrell'
  'howland reed'
  'iain glen'
  'ian mcelhinney'
  'iron throne'
  'isaac hempstead wright'
  'jerome flynn'
  'john bradley'
  'jojen reed'
  'jon snow'
  'julian glover'
  'khaleesi'
  "king's landing"
  'kit harington'
  'kit harrington'
  'kristian nairn'
  'lanister'
  'lannisport'
  'lannister'
  'lena headey'
  'liam cunningham'
  'littlefinger'
  'maisie williams'
  'meereen'
  'melisandre'
  'michele fairley'
  'michelle fairley'
  'myrcella'
  'natalie dormer'
  'nathalie emmanue'
  'ned stark'
  'nikolaj coster-waldau'
  'olenna tyrell'
  'peter dinklage'
  'podrick payne'
  'queen of thorns'
  'ramsay bolton'
  'roose bolton'
  'rory mccann'
  'sandor clegane'
  'sansa stark'
  'sophie turner'
  'sothoryos'
  'stephen dillane'
  'targaryen'
  'three eyed raven'
  'tower of joy'
  'tyrion'
  'vaes dothrak'
  'viserys'
  'walder frey'
  'westeros'
  'white walker'
  'whitewalker'
  'wildling'
  'winterfell'
]

# Regex formed from the spoiler array for quick matching
SPOILER_WORDS_REGEX = new RegExp(SPOILER_WORDS_LIST.join('|'), 'i')

# Subreddits that are GoT related, dont block GoT-related things there, since that'd pretty much block everything...
GOT_RELATED_SUBREDDITS = [
  'gameofthrones'
  'asoiaf'
  'iceandfire'
  'agotboardgame'
  'gamesofthrones'
  'westeros'
  'thronescomics'
  'asongofmemesandrage'
  'earthoficeandfire'
]
GOT_SUBREDDITS_REGEX = new RegExp('(\/r\/)' + GOT_RELATED_SUBREDDITS.join('|'), 'i')
