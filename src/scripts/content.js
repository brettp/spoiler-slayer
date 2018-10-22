var num_feed_elems = null;
var smaller_font_mode = false;
var reddit_mode = false;
var $document = $(document);
var hostname = window.location.hostname.replace(/\./g, '-');

// add style tag that we can adjust for user customizable styles
// and when the settings change
let styleSettings = {
    heavyBlur: '.glamoured-active',
    hoverBlur: '.glamoured-active:hover'
};

async function init() {
    let url = window.location.href.toLowerCase();
    let shouldBlock = await cmd('shouldBlock', url);

    if (!shouldBlock) {
        console.log("Disabled, no sites, or not spoilers defined.");
        return;
    }

    console.log("Starting spoiler blocker");
    setupStyles();

    var selector = await cmd('getSelectors', url);
    initiateSpoilerBlocking(selector, false);
}

// wait until onload
// @todo can get rid of this since using mutations observers?
$(() => { init(); });

chrome.storage.onChanged.addListener((changes, namespace) => {
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
async function setupStyles() {
    for (let name in styleSettings) {
        let val = await getSetting(name);
        updateStyles(name, val);
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

function incrementBadgeNumber() {
    return chrome.runtime.sendMessage({
        incrementBadge: true
    }, helpers.nullFunc);
}

function initiateSpoilerBlocking(selector_string, remove_parent) {
    searchForAndBlockSpoilers(selector_string, true, remove_parent);
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    var observer = new MutationObserver(helpers.debounce(function(muts, obs) {
        searchForAndBlockSpoilers(selector_string, false, remove_parent);
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

async function searchForAndBlockSpoilers(selector, force_update, remove_parent) {
    var items = $(selector).not('.glamoured');
    if (remove_parent) {
        items = items.parent();
    }

    if (force_update || items.length > 0) {
        items.each(blockOrNot);
    }
}

async function blockOrNot(i, el) {
    // track the items we already looked at
    var $el = $(el);
    $el.addClass(`glamoured ${hostname}`);

    // check for spoilers
    let spoilers = await cmd('hasSpoilers', el.textContent);

    if (spoilers) {
        let settings = await cmd('getSettings');
        blockElement($el, spoilers[0], settings);
    }
}

function blockElement($element, blocked_word, settings) {
    var $contentWrapper, $info, capitalized_spoiler_words;
    incrementBadgeNumber();

    if (settings.destroySpoilers) {
        $element.remove();
        return;
    }

    // move all content into a new div so we can blur
    // but keep the info text clear without doing silly stuff
    $contentWrapper = $(`<div class="content-wrapper glamoured-active" />`)
        .append($element.children())
        .appendTo($element);

    if (!settings.blurSpoilers) {
        $contentWrapper.addClass('no-fx');
    }

    capitalized_spoiler_words = helpers.ucWords(blocked_word);

    if (settings.showSpecificSpoiler) {
        $info = $("<h2 class='spoiler-info'>Spoiler about \"" + capitalized_spoiler_words + "\"</h2>");
        if (!settings.blurSpoilers) {
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

        if (settings.warnBeforeReveal) {
            specific_words_for_confirm = settings.showSpecificSpoiler ? " about '" + capitalized_spoiler_words + "'" : "";
            if (!confirm("Show spoiler" + specific_words_for_confirm + "?")) {
                return;
            }
        }
        $contentWrapper.removeClass('glamoured-active').addClass('revealed');
        $info.addClass('revealed');
    });
}