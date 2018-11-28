async function init() {
    populateFromSettings();

    // check validity
    for (let el of byQS('input')) {
        el.addEventListener('invalid', (e) => {
            if (e.target.dataset.validationError) {
                e.target.setCustomValidity(e.target.dataset.validationError);
            } else {
                e.target.dataset.validationError('');
            }
            helpers.addFlash(e.target, 'fail');
        });
    }

    // add forms and icons
    byId('new-spoiler').addEventListener('submit', (e) => onNewSubmit(e, 'spoilers'));
    byId('plus-spoiler').addEventListener('click', (e) => onNewSubmit(e, 'spoilers'));

    byId('new-site').addEventListener('submit', (e) => onNewSubmit(e, 'sites'));
    byId('plus-site').addEventListener('click', (e) => onNewSubmit(e, 'sites'));

    byId('new-subscription').addEventListener('submit', (e) => onNewSubmit(e, 'subscriptions'));
    byId('plus-subscription').addEventListener('click', (e) => onNewSubmit(e, 'subscriptions'));
    byId('refresh-subscriptions').addEventListener('click', async (e) => {
        e.preventDefault();
        e.target.classList.add('active');

        let result = await cmd('refreshSubscriptions');

        if (result) {
            await renderList(result, 'subscriptions', true);
            helpers.addFlash(byId('subscriptions-settings'), 'success');
        } else {
            helpers.addFlash(byId('subscriptions-settings'), 'fail');
        }

        // feels better with at least a second to spin
        e.target.classList.add('last');
        e.target.addEventListener('animationend', (e) => {
            e.stopPropagation();
            e.target.classList.remove('active');
            e.target.classList.remove('last');
        }, {once: true});
    });

    // footer links
    byId('reset-spoilers').addEventListener('click', resetToOgSpoilers);
    byId('reset-sites').addEventListener('click', resetToOgSites);
    byId('export').addEventListener('click', e => exportSettings('all'));
    byId('import').addEventListener('click', e => byId('import-files').click());
    byId('import-files').addEventListener('change', importSettings);
    byId('clear-settings').addEventListener('click', clearSettings);
}

function containerToDatum(container) {
    let values = {};
    let inputs = container.querySelectorAll('input');

    inputs.forEach(el => {
        if (el.type !== 'submit') {
            values[el.name] = el.type === 'checkbox' ? el.checked || false : el.value;
        }
    });

    return values;
}

async function populateFromSettings(clear = false) {
    let settings = await cmd('getSettings');

    renderList(settings.spoilers, 'spoilers', clear);
    renderList(settings.sites, 'sites', clear);
    renderList(settings.subscriptions, 'subscriptions', clear);
}

async function renderList(data, type, clear = false) {
    const container = byId(type);

    if (clear) {
        container.removeChild(container.children[0]);
    }

    let list = d.createElement('ul', {is: `spoilers-blocker-list`});
    list.setAttribute('settings-name', type);
    list.setAttribute('list-item-element-name', type.substring(0, type.length - 1) + '-item');
    list.items = data;
    container.appendChild(list);
}

async function resetToOgSites(e) {
    e.preventDefault();
    if (confirm('Are you use you want to reset to the original list of sites?')) {
        await resetToOg('sites');
        populateFromSettings(true);
    }
}

async function resetToOgSpoilers(e) {
    e.preventDefault();

    if (confirm('Are you use you want to reset to the original list of spoilers?')) {
        await resetToOg('spoilers');
        populateFromSettings(true);
    }
}

async function reset(e) {
    e.preventDefault();
    if (confirm('Are you use you want to reset all settings?')) {
        let defaults = await cmd('getDefaultSettings');
        await cmd('saveSettings', defaults);
        populateFromSettings(true);
    }
}

async function onNewSubmit(e, type) {
    e.preventDefault();
    let form = helpers.getNearest('form', e.target);
    let datum = containerToDatum(form);
    let data = await getSetting(type);

    if (datum.length < 1) {
        helpers.addFlash(form, 'fail');
        return;
    }
    let checks = [];

    switch (type) {
        case 'spoilers':
            checks.push('spoiler');
            break;

        case 'sites':
            checks.push('selector');
            checks.push('urlRegex');
        break;

        case 'subscriptions':
            if (!datum.url) {
                helpers.addFlash(form.querySelectorAll('[type=url]'), 'fail');
                return;
            }

            // normalize to always have slash
            if (datum.url[datum.url.length - 1] != '/') {
                datum.url += '/';
            }

            if (!datum.useSpoilers && !datum.useSites) {
                helpers.addFlash(form.querySelectorAll('[type=checkbox]'), 'fail');
                return;
            }
        break;
    }

    for (let name of checks) {
        if (!datum.hasOwnProperty(name) || !datum[name]) {
            helpers.addFlash(form.querySelector(`[name=${name}]`), 'fail');
            return;
        }
    }

    switch (type) {
        case 'subscriptions':
            helpers.addFlash(form, 'pending');

            try {
                // gh and gl both append /raw
                let rawUrl = datum.url + 'raw';

                let text = await helpers.httpGet(rawUrl);
                let remoteInfo = JSON.parse(text);

                helpers.addFlash(form, 'success');
                datum.rawUrl = rawUrl;
                datum.content = remoteInfo;
            } catch (e) {
                console.log(e);
                helpers.addFlash(form, 'fail');
                return;
            }
            // fall through

        default:
            data.unshift(datum);
            await setSetting(type, data);
            break;
    }

    helpers.addFlash(form, 'success');

    // reset doesn't work completely with web components, so do it manually too
    form.reset();
    let reEl = form.querySelector('regex-input');
    if (reEl) {
        reEl.reset();
    }

    form.querySelector('input').focus();

    renderList(data, type, true);
}

async function importSettings(e) {
    e.preventDefault();
    let files = e.target.files;

    for (const file of files) {
        let reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onloadend = async function() {
            let obj = JSON.parse(this.result);
            if (obj.__exportVersion != 1) {
                alert("Mismatched import version!");
            }
            let settings = await cmd('getSettings');

            // @todo validate!
            for (const item in obj) {
                switch (item) {
                    case 'sites':
                    case 'spoilers':
                        if (settings[item]) {
                            settings[item] = settings[item].concat(obj[item]);
                        }
                        await setSetting(item, settings[item]);
                        populateFromSettings(true);
                        break;
                }
            }
        };
    }
}

async function exportSettings(section = 'all') {
    let settings = await cmd('getSettings');
    let info;

    switch (section) {
        case 'all':
            info = settings;
            break;

        case 'sites':
            info = {sites: settings.sites};
            break;

        case 'spoilers':
            info = {spoilers: settings.spoilers};
            break;

        case 'settings':
            info = {...settings};
            delete info.sites;
            delete info.spoilers;
            break;
    }

    info.__exportVersion = 1;

    let json = JSON.stringify(info, null, 2);

    let file = new Blob([json], {
        type: 'application/json',
    });

    let now = new Date();
    // dates in JS are awful.
    // let filename = now.toISOString().replace('T', '-').replace('Z', ' ').replace(':', );
    let filename = 'Spoiler Settings ' + now.toISOString().split('T')[0] + '.json';
    var url = URL.createObjectURL(file);

    chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true,
    });
}

async function clearSettings(e) {
    e.preventDefault();
    if (confirm('Are you use you want to reset all settings?')) {
        let defaults = await cmd('getDefaultSettings');
        await cmd('saveSettings', defaults);
        populateFromSettings(true);
    }
}

async function resetToOg(section = 'all') {
    switch (section) {
        case 'sites':
            return setSetting('sites', ogSettings.sites)

        case 'spoilers':
            return setSetting('spoilers', ogSettings.spoilers)

        case 'settings':
            let info = {...ogSettings};
            delete info.sites;
            delete info.spoilers;
            for (let k of info) {
                setSetting(k, info[k]);
            }
            break;
    }
}

init();