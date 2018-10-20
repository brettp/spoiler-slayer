var num_feed_elems = null;
var smaller_font_mode = false;
var reddit_mode = false;

// add style tag that we can adjust for user customizable styles
// and when the settings change
let styleSettings = {
    heavyBlur: '.glamoured-active',
    hoverBlur: '.glamoured-active:hover'
};

chrome.storage.onChanged.addListener(function(changes, namespace) {
    // if blur spoilers is changed, remove all injected styles and add/remove no-fx
    if (changes.blurSpoilers) {
        $('.spoiler-injected-style').remove();
        if (changes.blurSpoilers.newValue) {
            $('.content-wrapper.glamoured-active').removeClass('no-fx');
        } else {
            $('.content-wrapper.glamoured-active').addClass('no-fx');
        }
        setupStyles();
    }

    for (let name in styleSettings) {
        if (name in changes) {
            let newVal = changes[name].newValue;
            updateStyles(name, newVal);
        }
    }
});

// load initial customizable styles
function setupStyles() {
    for (let name in styleSettings) {
        updateStyles(name, settings.get(name));
    }
}

function updateStyles(name, value) {
    let $style = $(`#spoiler-${name}`);

    if (!styleSettings[name]) {
        return;
    }

    if ($style.length < 1) {
        $style = $(`<style id="spoiler-${name}" class="spoiler-injected-style"></style>`);
        $('head').append($style);
    }

    $style.text(`${styleSettings[name]} { filter: blur(${value}px) !important; }`);
}

$document = $(document);

$document.ready(function() {
    settings.load(function() {
        if (!settings.get('blockingEnabled') || settings.get('spoilers').length < 1 || settings.get('sites').length < 1) {
            console.log("Disabled, no sites defined, or no spoilers defined. Not activating...");
            return;
        }

        setupStyles();
        initialize(settings);
    });
});

function incrementBadgeNumber() {
    return chrome.runtime.sendMessage({
        incrementBadge: true
    }, helpers.nullFunc);
}

function initiateSpoilerBlocking(selector_string, regexp, remove_parent) {
    searchForAndBlockSpoilers(selector_string, true, regexp, remove_parent);

    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    var observer = new MutationObserver(helpers.debounce(function(muts, obs) {
        searchForAndBlockSpoilers(selector_string, false, regexp, remove_parent);
    }, 150));

    const opts = {
        attributes: true,
        attributeOldValue: false,
        characterData: true,
        characterDataOldValue: false,
        childList: true,
        subtree: true
    };

    // @todo Can we do better than body?
    observer.observe(document.querySelector('body'), opts);
}

function searchForAndBlockSpoilers(feed_elements_selector, force_update, regexp, remove_parent) {
    var items = $(feed_elements_selector).not('.glamoured');
    if (remove_parent) {
        items = items.parent();
    }

    if (items.length === 0) {
        return;
    }

    if (force_update || items.length > 0) {
        items.each(function() {
            var matchedSpoiler;
            var $this = $(this);

            // track the items we already looked at
            $this.addClass('glamoured');

            // Search textContent of the element to see if it contains any spoilers
            matchedSpoiler = this.textContent.match(regexp);
            if (matchedSpoiler !== null) {
                blockElement($this, matchedSpoiler[0]);
            }
        });
    }
}

function blockElement($element, blocked_word) {
    var $contentWrapper, $info, capitalized_spoiler_words;
    incrementBadgeNumber();

    if (settings.get('destroySpoilers')) {
        $element.remove();
        return;
    }

    // move all content into a new div so we can blur
    // but keep the info text clear without doing silly stuff
    $contentWrapper = $('<div class="content-wrapper glamoured-active" />')
        .append($element.children())
        .appendTo($element);

    if (!settings.get('blurSpoilers')) {
        $contentWrapper.addClass('no-fx');
    }

    capitalized_spoiler_words = helpers.ucWords(blocked_word);
    // console.log(`Found spoiler for: "${capitalized_spoiler_words}" in`, $element);

    if (settings.get('showSpecificSpoiler')) {
        $info = $("<h2 class='spoiler-info'>Spoiler about \"" + capitalized_spoiler_words + "\"</h2>");
        if (!settings.get('blurSpoilers')) {
            $info.addClass('no-fx');
        }
        if (smaller_font_mode) {
            $info.addClass('small');
        }
        if (reddit_mode) {
            $info.addClass('redditized');
        }
    } else {
        $info = $();
    }

    $element.prepend($info);
    $contentWrapper.on('click', function(ev) {
        if ($(this).hasClass('revealed')) {
            return;
        }

        var specific_words_for_confirm;
        ev.stopPropagation();
        ev.preventDefault();

        if (settings.get('warnBeforeReveal')) {
            specific_words_for_confirm = settings.get('showSpecificSpoiler') ? " about '" + capitalized_spoiler_words + "'" : "";
            if (!confirm("Show spoiler" + specific_words_for_confirm + "?")) {
                return;
            }
        }
        $contentWrapper.removeClass('glamoured-active').addClass('revealed');
        $info.addClass('revealed');
    });
}

// Initialize page-specific spoiler-blocking, if page is supported
function initialize(settings) {
    getSetting = function(name) {
        return settings[name];
    };

    var url = window.location.href.toLowerCase();
    var spoiler_strs = [];

    for (var spoiler_info of settings.get('spoilers')) {
        var spoiler = helpers.escapeRegexp(spoiler_info.spoiler.trim());
        if (spoiler) {
            spoiler_strs.push(spoiler);
        }
    }

    var spoilersRegexp = new RegExp(spoiler_strs.join('|'), 'i');

    for (var info of settings.get('sites')) {
        if (new RegExp(info.url_regexp).test(url)) {
            // console.log(`Matched site ${info.url_regexp}`);
            initiateSpoilerBlocking(info.selector, spoilersRegexp, false);

            // @todo don't return and allow it to fall through for more blocking?
            return;
        }
    }
}