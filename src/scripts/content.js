var num_feed_elems = null;
var smaller_font_mode = false;
var reddit_mode = false;

$document = $(document);

$document.ready(function() {
    settings.load(function(settings) {
        if (!settings.blockingEnabled || settings.spoilers.length < 1 || settings.sites.length < 1) {
            console.log("Disabled, no sites defined, or no spoilers defined. Not activating...");
            return;
        }

        initialize(settings);
    });
})

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
    }, 300));

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
    console.log("Looking at new times: " + items.length);

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

    if (getSetting('destroySpoilers')) {
        $element.remove();
        return;
    }

    // move all content into a new div so we can blur
    // but keep the info text clear without doing silly stuff
    $contentWrapper = $('<div class="content-wrapper glamoured-active" />')
        .append($element.children())
        .appendTo($element);

    capitalized_spoiler_words = helpers.ucWords(blocked_word);
    // console.log(`Found spoiler for: "${capitalized_spoiler_words}" in`, $element);

    if (getSetting('showSpecificWord')) {
        $info = $("<h2 class='spoiler-info'>Spoiler about \"" + capitalized_spoiler_words + "\"</h2>");
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

        console.log('content wrapper click');
        var specific_words_for_confirm;
        ev.stopPropagation();
        ev.preventDefault();

        if (getSetting('warnBeforeReveal')) {
            specific_words_for_confirm = settings.show_specific_words ? " about '" + capitalized_spoiler_words + "'" : "";
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

    for (var spoiler_info of settings.spoilers) {
        var spoiler = helpers.escapeRegexp(spoiler_info.spoiler.trim());
        if (spoiler) {
            spoiler_strs.push(spoiler);
        }
    }

    var spoilersRegexp = new RegExp(spoiler_strs.join('|'), 'i');

    for (var info of settings.sites) {
        if (new RegExp(info.url_regexp).test(url)) {
            console.log(`Matched site ${info.url_regexp}`);
            initiateSpoilerBlocking(info.selector, spoilersRegexp, settings.destro1ySpoilers);

            // @todo don't return and allow it to fall through for more blocking?
            return;
        }
    }
}