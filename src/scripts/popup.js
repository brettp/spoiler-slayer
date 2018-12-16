const examples = [
    {
        'text': 'Jon Snow is Arya!',
        'image': 'Blind_Stark.png',
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
        'text': 'Bucky Barnes likes Steve Rogers!',
        'image': 'Avengers.svg',
        'spoiler': 'Steve Rogers'
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

const bodyClasses = d.body.classList;

// changing the example while the popup is open is too distracting
// pick one and use it per popup instance
let exampleInfo = examples[Math.floor(Math.random() * examples.length)];

d.addEventListener('keydown', (event) => {
    if (event.key && event.key.toLowerCase() == 'alt') {
        bodyClasses.add('debug-active');
    }
});

d.addEventListener('keyup', (event) => {
    if (event.key && event.key.toLowerCase() == 'alt') {
        bodyClasses.remove('debug-active');
    } else {
        // someone wants to use the keyboard, so make sure outlines show up
        bodyClasses.add('keyboard-user');
    }
});

class PopupSettings {
    setSetting(name, val) {
        this.settings[name] = val;
        // in msgApi.js
        return setSetting(name, val);
    }

    constructor(settings) {
        this.settings = settings;
        initInputs(settings);

        d.body.addEventListener('change', this.saveSetting.bind(this));

        byId('open-options-page').addEventListener('click', e => {
            // e.preventDefault();
            helpers.openOptionsPage();
            window.close();
        });

        byQS('.open-page').forEach((el) => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                let page = e.target.getAttribute('href');
                if (page) {
                    helpers.openPage(page);
                }
            });
        });

        getActiveTab().then(tab => {
            let url = new URL(tab.url);
            byId('current-site-display').innerText = '@ ' + url.hostname;
            byId('current-site').value = url.hostname;

            // prompt to add subscription
            this.initSubscription(url, this.settings);
        }).catch(e => {
            console.log(e);
            byId('current-site').value = '@ unknown';
        });

        byId('dismiss').addEventListener('click', e => {
            e.preventDefault();
            bodyClasses.remove('subscribe-mode');
            bodyClasses.add('settings-mode');
        });

        byId('quick-add-spoiler-form').addEventListener('submit', this.saveQuickAddSpoiler.bind(this));
        byId('quick-add-selector-form').addEventListener('submit', this.saveQuickAddSelector.bind(this));

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

        let blocked = this.settings.lifetimeBlockedCount.total;
        let text = blocked == 1 ? ' spoiler blocked' : ' spoilers blocked';

        byId('block-count').innerText = new Number(blocked).toLocaleString() + text;

        // clear preview styles when closed
        // this just fires off a disconnect event in the background script when the popup is closed
        chrome.runtime.connect({name: "spoilers-blocker"});

        updateExample(this.settings);

        // from content.js
        updateStyles();

        d.addEventListener('keyup', (event) => {
            // support changing example image with number keys
            if (event.key) {
                let num = parseInt(event.key);
                if (num && examples[num]) {
                    exampleInfo = examples[num];
                    updateExample(this.settings);
                }
            }
        });
    }

    async saveSetting(e) {
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

        this.setSetting(name, val);

        tab = await getActiveTab();
        cmd('showCorrectBadgeCount', {tab: tab});

        let revealed = byQSOne('.spoiler-blocker-revealed');
        if (revealed || input.getAttribute('type') != 'range') {
            updateExample(this.settings);
        }
    }

    saveQuickAddSpoiler(e) {
        e.preventDefault();
        const form = e.target;
        const input = byId('new-spoiler');
        let spoilers = input.value.trim().split(',').filter(str => str.trim());
        let cleaned = [];

        for (let str of spoilers) {
            if (str.trim()) {
                cleaned.push({
                    spoiler: str.trim(),
                    isRegex: false
                });
            }
        }

        if (cleaned.length > 0) {
            this.setSetting('spoilers', cleaned.concat(this.settings.spoilers));

            helpers.addFlash(input, 'success');
            form.reset();
            input.blur();
        } else {
            helpers.addFlash(input, 'fail');
        }

        return false;
    }

    saveQuickAddSelector(e) {
        e.preventDefault();
        const form = e.target;
        const selectorInput = byId('new-selector');
        const siteInput = byId('current-site');

        if (!selectorInput.value || !siteInput.value) {
            helpers.addFlash(selectorInput, 'fail');
            return false;
        }

        let site = {
            'urlRegex': siteInput.value,
            'selector': selectorInput.value
        };

        this.setSetting('sites', [site, ...this.settings.sites]);

        helpers.addFlash(selectorInput, 'success');
        form.reset();
        selectorInput.blur();

        return false;
    }

    async initSubscription(url) {
        const subscribe = byId('subscribe');

        if (Subscription.isGitHubRevision(url) && !Subscription.isGitHubRawUrl(url)) {
            bodyClasses.add('is-github-rev-not-raw');
            cmd('highlightElementsInActiveTab', '.file-actions > a.btn');
            byQSOne('.github-rev-not-raw').classList.remove('none');
            byId('new-subscription').classList.add('none');

            bodyClasses.add('subscribe-mode');
            subscribe.classList.add('loaded');
            return;
        } else if (!Subscription.isSubscribableUrl(url)) {
            bodyClasses.add('settings-mode');
            return;
        }

        bodyClasses.add('subscribe-mode');
        let subscriptions = helpers.objsToModels(this.settings.subscriptions, 'subscriptions');

        let sub = Subscription.factory({
            url: url
        });
        let newSub = true;

        if (!await sub.update()) {
            subscribe.querySelector('.update-failed-banner').classList.remove('none');
            subscribe.querySelector('.update-failed-text').innerText = sub.lastError;
            bodyClasses.add('loaded');

            byId('new-subscription').classList.add('none');
            return;
        }

        subscribe.classList.remove('loading');
        subscribe.classList.add('loaded');

        if (Subscription.isGitHubRevision(url)) {
            let warning = subscribe.querySelector('.github-rev-warning');
            warning.classList.remove('none');

            warning.querySelector('a').href = Subscription.getGitHubCurrentUrl(sub.url);
        }

        if (sub.content.exportName) {
            byId('list-name').innerText = sub.content.exportName;
        }
        byId('spoilers-count').innerText = sub.spoilers.length;
        byId('sites-count').innerText = sub.sites.length;

        // see if it's already subscribed to
        // and pass the index if so
        let i = 0;
        for (const tempSub of subscriptions) {
            if (tempSub.url == sub.url) {
                sub = tempSub;
                sub.index = i;
                newSub = false;
                subscribe.querySelector('[name=subscribe]').setAttribute('checked', ' ');

                if (sub.useSpoilers) {
                    byQSOne('[name=useSpoilers]').setAttribute('checked', ' ');
                }
                if (sub.useSites) {
                    byQSOne('[name=useSites]').setAttribute('checked', ' ');
                }

                break;
            }

            i++;
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

        subscribe.addEventListener('input', e => {
            if (['subscribe', 'useSpoilers', 'useSites'].includes(e.target.name)) {
                e.preventDefault();
                this.saveQuickAddSubscription(e, sub, newSub);
            }
        });
    }

    saveQuickAddSubscription(e, sub, newSub) {
        sub.useSpoilers = byQSOne('[name=useSpoilers]').checked;
        sub.useSites = byQSOne('[name=useSites]').checked;

        // only add sub if it's new
        if (byQSOne('[name=subscribe]').checked) {
            if (newSub) {
                this.setSetting('subscriptions', [sub, ...this.settings.subscriptions]);
            }
        } else {
            if (sub.index >= 0) {
                this.settings.subscriptions.splice(sub.index, 1);
                this.setSetting('subscriptions', this.settings.subscriptions);
            }
        }

        helpers.addFlash(byId('new-subscription'), 'success');
    }
}

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

async function getActiveTab() {
    return new Promise(res => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            let tab = tabs.pop();
            res(tab);
        });
    });
}

function updateExample(settings) {
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

(async function() {
    let settings = await cmd('getSettings');
    new PopupSettings(settings);
})();