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
    let settings = await cmd('getSettings');

    $('body').on('change', 'input, select', saveSetting);

    $('#open-options-page').on('click', openOptionsPage);
    $('.open-page').on('click', (e) => {
        let page = $(e.target).attr('href');
        if (page) {
            openPage(page);
        }
    });

    let inputs = {};
    for (let type of ['input', 'select', 'range', 'textarea']) {
        for (let input of document.getElementsByTagName(type)) {
            inputs[input.name] = input;
        }
    }

    let changes = {
        destroySpoilers: ['showSpecificSpoiler', 'warnBeforeReveal', 'heavyBlur', 'hoverBlur', 'blurSpoilers', 'transitionDuration'],
        blurSpoilers: ['heavyBlur', 'hoverBlur', 'transitionDuration']
    }

    inputs.blockingEnabled.addEventListener('input', () => {
        for (const [name, input] of Object.entries(inputs)) {
            if (name !== 'blockingEnabled') {
                input.disabled = !inputs.blockingEnabled.checked;
            }
        }
    });

    inputs.destroySpoilers.addEventListener('input', () => {
        for (const input of changes.destroySpoilers) {
            inputs[input].disabled = inputs.destroySpoilers.checked;
        }
    });

    inputs.blurSpoilers.addEventListener('input', () => {
        for (const input of changes.blurSpoilers) {
            inputs[input].disabled = !inputs.blurSpoilers.checked;
        }
    });

    // set initial
    for (const [name, input] of Object.entries(inputs)) {
        if (settings[name] !== undefined) {
            if (input.type == 'checkbox') {
                input.checked = settings[name];
            } else {
                input.value = settings[name];
            }

            let event = new Event('input', {
                'bubbles': true,
                'cancelable': true
            });

            input.dispatchEvent(event);
        }
    }

    // register quick adds
    $('body').on('click', '#quick-add-site, #quick-add-spoiler', function() {
        $($(this).attr('href')).toggleClass('none');
    });

    // remove warning classes on quick adds
    $('body').on('animationend', '.save-flasher', (e) => {
        $(e.currentTarget).removeClass('save-fail save-success');
    });

    $('body').on('submit', '#quick-add-spoiler-form', saveQuickAdd);
    updateStyles();
    updateExample();
})();

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

    if ($('.spoiler-info').hasClass('spoiler-blocker-revealed') || $input.attr('type') != 'range') {
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
    let $ex = $exTpl.clone().removeClass('content-template').addClass('spoiler-blocker-glamoured');

    $('.example').html($ex);

    if (await getSetting('blockingEnabled')) {
        let settings = await cmd('getSettings');
        blockElement($ex[0], 'Dumbledore', settings, false);
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