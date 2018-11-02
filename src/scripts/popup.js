document.addEventListener('keydown', (event) => {
    if (event.key && event.key.toLowerCase() == 'alt') {
        $('body').addClass('debug-active');
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key && event.key.toLowerCase() == 'alt') {
        $('body').removeClass('debug-active');
    } else {
        // someone wants to use the keyboard, so make sure outlines show up
        $('body').addClass('keyboard-user');
    }
});

async function getActiveTabInfoReal() {
    return new Promise(res => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            let tab = tabs.pop();
            res(tab);
        });
    });
}

(async function init() {
    let tab = await getActiveTabInfoReal();
    cmd('debug', tab);

    let settings = await cmd('getSettings');

    loadSettings(settings);
    $('body').on('change', 'input, select', saveSetting);

    $('#open-options-page').on('click', openOptionsPage);
    $('.open-page').on('click', (e) => {
        let page = $(e.target).attr('href');
        if (page) {
            openPage(page);
        }
    });

    // disable options when needed
    $('body').on('input', '[name=destroySpoilers]', function() {
        $('[name=showSpecificSpoiler], [name=warnBeforeReveal], ' +
                '[name=heavyBlur], [name=hoverBlur], [name=blurSpoilers]')
            .attr('disabled', $(this).prop('checked'));
    });

    $('body').on('input', '[name=blurSpoilers]', function() {
        $('[name=heavyBlur], [name=hoverBlur]').attr('disabled', !$(this).prop('checked'));
    });

    // register quick adds
    $('body').on('click', '#quick-add-site, #quick-add-spoiler', function() {
        $($(this).attr('href')).toggleClass('none');
    });

    // remove warning classes on quick adds
    $('body').on('animationend', '.save-flasher', (e) => {
        $(e.currentTarget).removeClass('save-fail save-success');
    });

    $('body').on('submit', '#quick-add-spoiler-form', saveQuickAdd);
})();

function loadSettings(settings) {
    $('input, select').each(function() {
        var $input = $(this);
        var name = $input.prop('name');

        if (settings.hasOwnProperty(name)) {
            if ($input.attr('type') == 'checkbox') {
                $input.prop('checked', settings[name]);
            } else {
                $input.val(settings[name]);
            }
        }
    });

    // disable if needed
    let $destroySpoilers = $('[name=destroySpoilers]');
    $('[name=showSpecificSpoiler], [name=warnBeforeReveal], ' +
            '[name=heavyBlur], [name=hoverBlur], [name=blurSpoilers]')
        .attr('disabled', $destroySpoilers.prop('checked'));

    let $blurSpoilers = $('[name=blurSpoilers]');
    $('[name=heavyBlur], [name=hoverBlur]').attr('disabled', ($destroySpoilers.prop('checked') || !$blurSpoilers.prop('checked')));

    // force setting up styles since the content init func is never called for this page
    setupStyles();
    updateExample();
}

async function saveSetting(e) {
    let $input = $(this);

    if ($input.hasClass('no-auto-save')) {
        return;
    }

    let name = $input.prop('name');
    let val = ($input.attr('type') == 'checkbox') ? $input.prop('checked') : $input.val();
    let tab;

    setSetting(name, val);

    if (name == 'badgeDisplay') {
        if (val == 'none') {
            tab = await getActiveTab();
            cmd('setBadgeText', {'text': '', tabId: tab.id});
        } else {
            // update badge with current ACTIVE tab (not THIS tab, because this tab is an internal one)
            // for some reason this returns nothing if run through the normal cmd
            tab = await getActiveTab();
            cmd('showCorrectBadgeCount', {tab: tab});
        }
    }

    if ($('.spoiler-info').hasClass('revealed') || $input.attr('type') != 'range') {
        updateExample();
    }
}

async function getActiveTab() {
    return new Promise(res => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            let tab = tabs.pop();
            res(tab);
        });
    });
}

async function saveQuickAdd(e) {
    e.preventDefault();
    var $this = $(this);
    var $input = $(this).find('input');
    var spoilers = $input.val().trim().split(',');
    var cleaned = [];

    for (let str of spoilers) {
        if (str.trim()) {
            cleaned.push(str.trim());
        }
    }

    if (cleaned.length > 0) {
        var cur = await getSetting('spoilers');

        for (let spoiler of cleaned) {
            cur.unshift({
                'spoiler': spoiler
            });
        }

        setSetting('spoilers', cur);
        $input.addClass('save-success');
        $this[0].reset();
    } else {
        $input.addClass('save-fail');
    }

    return false;
}

async function updateExample() {
    let $exTpl = $('.content-template');
    let $ex = $exTpl.clone().removeClass('content-template').addClass('glamoured');

    $('.example').html($ex);

    if (await getSetting('blockingEnabled')) {
        let settings = await cmd('getSettings');
        blockElement($ex, 'Dumbledore', settings, false);
    }
}

function openOptionsPage() {
    if (chrome.runtime.openOptionsPage) {
        return chrome.runtime.openOptionsPage(helpers.nullFunc);
    } else {
        return openPage('options.html');
    }
}

function openPage(page) {
    return window.open(chrome.runtime.getURL(page));
}