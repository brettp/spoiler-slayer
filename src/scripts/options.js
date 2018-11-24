async function init() {
    populateFromSettings();

    // add forms and icons
    byId('new-spoiler').addEventListener('submit', onNewSpoilerSubmit);
    byId('new-site').addEventListener('submit', onNewSiteSubmit);
    byId('plus-spoiler').addEventListener('click', onNewSpoilerSubmit);
    byId('plus-site').addEventListener('click', onNewSiteSubmit);

    // delete icons
    d.body.addEventListener('click', onRemoveClick);

    // footer links
    byId('reset-spoilers').addEventListener('click', resetToOgSpoilers);
    byId('reset-sites').addEventListener('click', resetToOgSites);
    byId('export').addEventListener('click', e => exportSettings('all'));
    byId('import').addEventListener('click', e => byId('import-files').click());
    byId('import-files').addEventListener('change', importSettings);
    byId('clear-settings').addEventListener('click', clearSettings);
}

async function populateFromSettings(clear = false) {
    let settings = await cmd('getSettings');

    renderList(settings.spoilers, 'spoilers', clear);
    renderList(settings.sites, 'sites', clear);
}

function renderList(data, type, clear = false) {
    const template = byId(type.substring(0, type.length - 1)).content;
    let list = byId(type);

    if (clear) {
        let newSL = list.cloneNode(false);
        list.replaceWith(newSL);
        list = newSL;
    }

    for (let i in data) {
        let datum = data[i];

        let li = d.createElement('li');
        li.dataset.id = i;
        li.dataset.type = type;

        let el = template.cloneNode(true);
        let reInput = el.querySelector('regex-input');

        if (type == 'spoilers') {
            reInput.setAttribute('value', datum.spoiler);
            reInput.setAttribute('is-regex', datum.isRegex || false);
        } else {
            reInput.setAttribute('value', datum.urlRegex);
            reInput.setAttribute('is-regex', datum.isRegex || false);

            let sI = el.querySelector('input[type=text]');
            sI.value = datum.selector;
        }

        list.appendChild(li);
        li.appendChild(el);
    }
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

async function onRemoveClick(e) {
    const target = e.target;

    if (!target.classList.contains('delete-item')) {
        return;
    }
    let row = helpers.getNearest('li', target);

    let id = row.dataset.id;
    let type = row.dataset.type;

    if (!id || !type) {
        return;
    }

    let data = await getSetting(type);
    data.splice(id, 1);
    await setSetting(type, data);
    renderList(data, type, true);
}

async function onNewSpoilerSubmit(e) {
    e.preventDefault();

    let form = helpers.getNearest('form', e.target);
    let input = form.querySelector('regex-input');

    const spoiler = {
        spoiler: input.value,
        isRegex: input['is-regex']
    };

    if (!spoiler.spoiler) {
        helpers.addFlash(input, 'fail');
        return;
    }

    const settings = await cmd('getSettings');

    settings.spoilers.unshift(spoiler);
    await setSetting('spoilers', settings.spoilers);

    helpers.addFlash(input, 'success');

    // reset doesn't work completely with web components, so do it manually too
    form.reset();
    input.reset();

    let spoilers = await getSetting('spoilers');
    renderList(spoilers, 'spoilers', true);
}

async function onNewSiteSubmit(e) {
    e.preventDefault();

    let form = helpers.getNearest('form', e.target);
    let input = form.querySelector('regex-input');
    let sel = form.querySelector('input[name=selector]');

    const site = {
        urlRegex: input.value,
        isRegex: input['is-regex'],
        selector: sel.value
    };

    if (!site.selector) {
        helpers.addFlash(sel, 'fail');
        return;
    }

    if (!site.urlRegex) {
        helpers.addFlash(input, 'fail');
        return;
    }

    const settings = await cmd('getSettings');
    settings.sites.unshift(site);

    await setSetting('sites', settings.sites);

    helpers.addFlash(e.target, 'success');

    // reset doesn't work completely with web components, so do it manually too
    form.reset();
    input.reset();

    let sites = await getSetting('sites');
    renderList(sites, 'sites', true);
}

async function importSettings(e) {
    e.preventDefault();
    let files = e.target.files;

    for (const file of files) {
        let reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onloadend = async function() {
            let obj = JSON.parse(this.result);
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