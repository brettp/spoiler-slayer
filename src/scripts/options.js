$siteRow = $("<tr>" +
    "<td><a class='remove-row'><i class='fa fa-trash'></i></a> <td><input autocomplete='off' type='text' name='url_regexp' /></td>" +
    "<td><input type='text' name='selector' /></td> </tr>"
);

$spoilerRow = $("<tr>" +
    "<td><a class='remove-row'><i class='fa fa-trash'></i></a> <td><input autocomplete='off' type='text' name='spoiler' /></td></tr>"
);


async function init() {
    var $spoilers = $('#spoilers');
    var $sites = $('#sites');

    updateInputs(await getSetting('spoilers'), $spoilers);
    updateInputs(await getSetting('sites'), $sites);

    $('body').on('change', 'input', function(e) {
        saveSettings();
    });

    $('.new-row').on('click', function(e) {
        let $tpl = $(this).data('rowType') == 'site' ? $siteRow : $spoilerRow;
        let $row = $tpl.clone();
        $(this).parents('table').find('tr').first().after($row);
        $row.find('input').focus();
    });

    $('body').on('click', '.remove-row', function(e) {
        console.log('removing', this);
        $(this).parents('tr').first().remove();
        saveSettings();
    });

    $('#reset-to-default-sites').on('click', function(e) {
        if (!confirm('Are you use you want to reset all sites to the defaults?')) {
            return false;
        }

        setSetting('sites', ogSites);
        $sites.find('tr').not(':first').remove();

        updateInputs(ogSites, $sites);
    });


    $('#reset-to-default-spoilers').on('click', function(e) {
        if (!confirm('Are you use you want to reset all spoilers to the defaults?')) {
            return false;
        }

        setSetting('spoilers', ogSpoilers);
        $spoilers.find('tr').not(':first').remove();

        updateInputs(ogSpoilers, $spoilers);
    });
}

init();

tableToJson = function($table) {
    var data;
    data = [];

    $table.children('tbody').children('tr').each(function(i, tr) {
        var datum, has;
        has = false;
        datum = {};
        $(tr).find('input').each(function(i, input) {
            has = true;
            datum[$(input).attr('name')] = $(input).val();
        });
        if (has) {
            data.push(datum);
        }
    });
    return data;
};

function updateInputs(data, $root) {
    var $row, j, len, datum;

    for (j = 0, len = data.length; j < len; j++) {
        datum = data[j];
        $row = ($root.data('settingsName') == 'sites' ? $siteRow : $spoilerRow).clone();

        if (typeof datum === 'object') {
            for (var k in datum) {
                $row.find(`[name=${k}]`).val(datum[k]);
            }
        } else {
            $row.find('input').val(datum);
        }

        $root.append($row);
    }
}

function saveSettings() {
    var sections = [
        'spoilers',
        'sites'
    ];

    for (var section of sections) {
        var data = tableToJson($('#' + section));
        if (data) {
            setSetting(section, data);
        }
    }
}







// @todo update to just a normal json file to import
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