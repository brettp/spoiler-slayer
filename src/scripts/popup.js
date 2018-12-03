const examples = [
    {
        'text': 'Jon Snow is Arya!',
        'image': 'blind_stark.png',
        'spoiler': 'Arya'
    },
    {
        'text': 'Ron is Dumbledore!',
        'image': 'Deathly_Hallows_Sign.svg',
        'spoiler': 'Dumbledore'
    },
    {
        'text': 'Teddy Flood eats canned goods!',
        'image': 'Westworld.svg',
        'spoiler': 'Teddy Flood'
    },
    {
        'text': 'Bucky Barnes likes Steve Rodgers!',
        'image': 'Avengers.svg',
        'spoiler': 'Steve Rodgers'
    },
    {
        'text': 'The 13th Doctor lives here!',
        'image': 'Tardis.svg',
        'spoiler': '13th Doctor'
    },
    {
        'text': 'Jean-Luc gets a promotion!',
        'image': 'Star_Trek.svg',
        'spoiler': 'Jean-Luc'
    }
];

// changing the example while the popup is open is too distracting
// pick one and use it per popup instance
const exampleInfo = examples[Math.floor(Math.random() * examples.length)];

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

    byId('open-options-page').addEventListener('click', e => {
        e.preventDefault();
        helpers.openOptionsPage();
    });

    byQS('.open-page').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            let page = e.target.getAttribute('href');
            if (page) {
                helpers.openPage(page);
            }

            return false;
        });
    });

    try {
        let tab = await getActiveTab();
        let url = new URL(tab.url);
        byId('current-site-display').innerText = '@ ' + url.hostname;
        byId('current-site').value = url.hostname;

        // prompt to add subscription
        initSubscription(url);
    } catch (e) {
        console.log(e);
        byId('current-site').value = '@ unknown';
    }

    byId('dismiss').addEventListener('click', e => {
        e.preventDefault();
        byId('settings').classList.remove('none');
        byId('subscribe').classList.add('none');
    });

    byId('quick-add-spoiler-form').addEventListener('submit', saveQuickAddSpoiler);
    byId('quick-add-selector-form').addEventListener('submit', saveQuickAddSelector);

    // toggle widths
    byId('new-spoiler').addEventListener('focus', (e) => {
        widen('spoiler');
    });
    byId('new-spoiler').addEventListener('blur', unwiden);

    byId('new-selector').addEventListener('focus', (e) => {
        widen('selector');
    });
    byId('new-selector').addEventListener('blur', unwiden);

    byId('new-selector').addEventListener('keyup', helpers.debounce((e) => {
        cmd('highlightElementsInActiveTab', e.target.value);
    }), 300);

    let blocked = settings.lifetimeBlockedCount.total;
    let text = blocked == 1 ? ' spoiler blocked' : ' spoilers blocked';

    byId('block-count').innerText = new Number(blocked).toLocaleString() + text;

    // clear preview styles when closed
    // this just fires off a disconnect event in the background script when the popup is closed
    chrome.runtime.connect({name: "spoilers-blocker"});

    updateStyles();
    updateExample(settings);
})();

function widen(id) {
    let other = id === 'spoiler' ? 'selector' : 'spoiler';

    let idEl = byId(`quick-add-${id}-content`).classList;
    let otherEl = byId(`quick-add-${other}-content`).classList;

    idEl.add('active');
    idEl.remove('inactive');

    otherEl.add('inactive');
    otherEl.remove('active');
}

function unwiden() {
    let spoiler = byId('quick-add-spoiler-content').classList;
    let selector = byId('quick-add-selector-content').classList;

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
    var input = byId('new-spoiler');
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
    var selectorInput = byId('new-selector');
    var siteInput = byId('current-site');

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

async function updateExample(settings = null) {
    let template = byId('example-template').content;
    let ex = template.cloneNode(true);
    let container = byId('example');

    let wrapper = container.querySelector('div');

    // if remove spoilers is enabled
    if (!wrapper) {
        wrapper = d.createElement('div');
        container.appendChild(wrapper);
    }

    ex.querySelector('.content').innerText = exampleInfo.text;
    ex.querySelector('img').setAttribute('src', `assets/images/${exampleInfo.image}`);

    wrapper.replaceWith(ex);

    if (!settings) {
        settings = await cmd('getSettings');
    }

    if (settings.blockingEnabled) {
        blockElement(byQSOne('.spoiler-blocker-glamoured'), exampleInfo.spoiler, settings, false);
    }
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
            if (!['blockingEnabled', 'new-selector', 'new-spoiler', 'current-site', 'useSpoilers', 'useSites'].includes(name)) {
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

async function initSubscription(url) {
    const subscribe = byId('subscribe');
    const icon = subscribe.querySelector('custom-icon');

    if (Subscription.isGitHubRevision(url) && !Subscription.isGitHubRawUrl(url)) {
        cmd('highlightElementsInActiveTab', '.file-actions > a.btn');
        byQSOne('.github-rev-not-raw').classList.remove('none');
        byId('new-subscription').classList.add('none');
        subscribe.classList.remove('none');
        icon.remove();

        byId('dismiss').innerText = 'Settings';
        return;
    } else if (!Subscription.isSubscribableUrl(url)) {
        byId('settings').classList.remove('none');
        return;
    }

    let subscriptions = helpers.objsToModels(await getSetting('subscriptions'), 'subscriptions');
    subscribe.classList.remove('none');

    let sub = Subscription.factory({
        url: url
    });
    let newSub = true;

    if (!await sub.update()) {
        subscribe.querySelector('.update-failed-banner').classList.remove('none');
        subscribe.querySelector('.update-failed-text').innerText = sub.lastError;
        byId('new-subscription').classList.add('none');

        icon.remove();
        byId('dismiss').innerText = 'Settings';
        return;
    }

    if (Subscription.isGitHubRevision(url)) {
        let warning = subscribe.querySelector('.github-rev-warning');
        warning.classList.remove('none');

        warning.querySelector('a').href = Subscription.getGitHubCurrentUrl(sub.url);
    }

    icon.remove();
    byId('new-subscription').classList.remove('none');

    if (sub.content.exportName) {
        subscribe.querySelector('.list-name').innerText = sub.content.exportName;
    }
    subscribe.querySelector('.spoilers-count').innerText = sub.spoilers.length;
    subscribe.querySelector('.sites-count').innerText = sub.sites.length;

    // see if it's already subscribed to
    for (const tempSub of subscriptions) {
        if (tempSub.url == sub.url) {
            sub = tempSub;
            newSub = false;
            subscribe.querySelector('[name=subscribe]').setAttribute('checked', ' ');

            if (sub.useSpoilers) {
                byQSOne('[name=useSpoilers]').setAttribute('checked', ' ');
            }
            if (sub.useSites) {
                byQSOne('[name=useSites]').setAttribute('checked', ' ');
            }

            subscribe.querySelector('[name=useSpoilers]').addEventListener('input',
                e => saveQuickAddSubscription(e, subscriptions, sub));

            subscribe.querySelector('[name=useSites]').addEventListener('input',
                e => saveQuickAddSubscription(e, subscriptions, sub));
            break;
        }
    }

    if (newSub) {
        if (sub.spoilers.length > 0) {
            subscribe.querySelector(`[name=useSpoilers]`).setAttribute('checked', ' ');
        }
        if (sub.sites.length > 0) {
            subscribe.querySelector(`[name=useSites]`).setAttribute('checked', ' ');
        }
    }

    // previews
    for (const type of ['spoilers', 'sites']) {
        if (sub[type] && sub[type].length > 0) {
            const list = subscribe.querySelector(`.${type}`);

            for (let i = 0; i < 4 && i < sub[type].length; i++) {
                let item = sub[type][i];
                let li = d.createElement('li');
                li.innerText = type === 'spoilers' ? item.spoiler : item.urlRegex;
                list.appendChild(li);
            }

            // add ... or the 5th element if only 5 total
            if (sub[type].length == 5) {
                let item = sub[type][4];
                let li = d.createElement('li');
                li.innerText = type === 'spoilers' ? item.spoiler : item.urlRegex;
                list.appendChild(li);
            } else if (sub[type].length > 5) {
                let li = d.createElement('li');
                li.innerText = '...and ' + (sub[type].length - 5) + ' more';
                list.appendChild(li);
            }
        }
    }

    subscribe.querySelector('[name=subscribe]').addEventListener('input',
        e => saveQuickAddSubscription(e, subscriptions, sub));
}

async function saveQuickAddSubscription(e, subscriptions, sub) {
    sub.useSpoilers = byQSOne('[name=useSpoilers]').checked;
    sub.useSites = byQSOne('[name=useSites]').checked;

    if (byQSOne('[name=subscribe]').checked) {
        subscriptions.unshift(sub);
    } else {
        let i = subscriptions.indexOf(sub);
        subscriptions.splice(i, 1);
    }

    setSetting('subscriptions', subscriptions);
}