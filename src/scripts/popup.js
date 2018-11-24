d.addEventListener('keydown', (event) => {
    if (event.key && event.key.toLowerCase() == 'alt') {
        d.body.classList.add('debug-active');
    }
});

d.addEventListener('keyup', (event) => {
    if (event.key && event.key.toLowerCase() == 'alt') {
        d.body.classList.remove('debug-active');
    } else {
        // someone wants to use the keyboard, so make sure outlines show up
        d.body.classList.add('keyboard-user');
    }
});

(async function init() {
    let settings = await cmd('getSettings');
    initInputs(settings);

    d.body.addEventListener('change', saveSetting);

    byId('open-options-page').addEventListener('click', openOptionsPage);
    byQS('.open-page').forEach((el) => {
        addEventListener('click', (e) => {
            let page = e.target.getAttribute('href');
            if (page) {
                openPage(page);
            }
        });
    });

    try {
        let tab = await getActiveTab();
        let url = new URL(tab.url);
        d.getElementById('current-site-display').innerText = '@ ' + url.hostname;
        d.getElementById('current-site').value = url.hostname;
    } catch (e) {
        console.log(e);
        d.getElementById('current-site').value = '@ unknown';
    }

    d.getElementById('quick-add-spoiler-form').addEventListener('submit', saveQuickAddSpoiler);
    d.getElementById('quick-add-selector-form').addEventListener('submit', saveQuickAddSelector);

    // toggle widths
    d.getElementById('spoiler').addEventListener('focus', (e) => {
        widen('spoiler');
    });

    d.getElementById('spoiler').addEventListener('blur', unwiden);

    d.getElementById('selector').addEventListener('focus', (e) => {
        widen('selector');
    });

    d.getElementById('selector').addEventListener('blur', unwiden);

    d.getElementById('selector').addEventListener('keyup', helpers.debounce((e) => {
        cmd('highlightElementsInActiveTab', e.target.value);
    }), 300);

    // clear preview styles when closed
    // this just fires off a disconnect event in the background script when the popup is closed
    chrome.runtime.connect({name: "spoilers-blocker"});

    updateStyles();
    updateExample();
})();

function widen(id) {
    let other = id === 'spoiler' ? 'selector' : 'spoiler';

    let idEl = d.getElementById(`quick-add-${id}-content`).classList;
    let otherEl = d.getElementById(`quick-add-${other}-content`).classList;

    idEl.add('active');
    idEl.remove('inactive');

    otherEl.add('inactive');
    otherEl.remove('active');
}

function unwiden() {
    let spoiler = d.getElementById('quick-add-spoiler-content').classList;
    let selector = d.getElementById('quick-add-selector-content').classList;

    spoiler.remove('active');
    spoiler.remove('inactive');
    selector.remove('active');
    selector.remove('inactive');
}

async function saveSetting(e) {
    let input = e.target;
    if (input.nodeName !== 'SELECT' && input.nodeName !== 'INPUT') {
        return;
    }

    if (input.classList.contains('no-auto-save')) {
        return;
    }

    let name = input.getAttribute('name');
    let val = (input.getAttribute('type') == 'checkbox') ? input.checked : input.value;
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

    let revealed = byQSOne('.spoiler-blocker-revealed');
    if (revealed || input.getAttribute('type') != 'range') {
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

async function saveQuickAddSpoiler(e) {
    e.preventDefault();
    var form = e.target;
    var input = d.getElementById('spoiler');
    var spoilers = input.value.trim().split(',');
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
                'spoiler': spoiler,
                'isRegex': false
            });
        }

        setSetting('spoilers', cur);
        helpers.addFlash(input, 'success');
        form.reset();
        input.blur();
    } else {
        helpers.addFlash(input, 'fail');
    }

    return false;
}

async function saveQuickAddSelector(e) {
    e.preventDefault();
    var form = e.target;
    var selectorInput = d.getElementById('selector');
    var siteInput = d.getElementById('current-site');

    if (!selectorInput.value || !siteInput.value) {
        helpers.addFlash(selectorInput, 'fail');
        return false;
    }

    var cur = await getSetting('sites');

    cur.unshift({
        'urlRegex': siteInput.value,
        'selector': selectorInput.value
    });

    setSetting('sites', cur);
    helpers.addFlash(selectorInput, 'success');
    form.reset();
    selectorInput.blur();

    return false;
}

async function updateExample() {
    let template = byId('content-template').content;
    let ex = template.cloneNode(true);
    ex.querySelector('div').classList.add('spoiler-blocker-glamoured');

    let wrapper = byId('example').querySelector('div');
    wrapper.replaceWith(ex);

    if (await getSetting('blockingEnabled')) {
        let settings = await cmd('getSettings');
        blockElement(byQSOne('.spoiler-blocker-glamoured'), 'Dumbledore', settings, false);
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

function initInputs(settings) {
    let inputs = {};
    for (let type of ['input', 'select', 'range', 'textarea']) {
        for (let input of d.getElementsByTagName(type)) {
            inputs[input.name] = input;
        }
    }

    let changes = {
        destroySpoilers: ['showSpecificSpoiler', 'warnBeforeReveal', 'heavyBlur', 'hoverBlur', 'blurSpoilers', 'transitionDuration'],
        blurSpoilers: ['heavyBlur', 'hoverBlur', 'transitionDuration']
    }

    inputs.blockingEnabled.addEventListener('input', () => {
        for (const [name, input] of Object.entries(inputs)) {
            if (!['blockingEnabled', 'selector', 'spoiler', 'current-site'].includes(name)) {
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
}