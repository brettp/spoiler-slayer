import settings from '../og_settings';

export async function downloadSettings(section = 'all') {
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
    let filename = 'Spoiler Settings ' + now.toISOString().split('T')[0];
    var url = URL.createObjectURL(file);

    chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true,
    });
}

export async function resetToOg(section = 'all') {
    switch (section) {
        case 'sites':
            return setSetting('sites', settings.sites)

        case 'spoilers':
            return setSetting('spoilers', settings.spoilers)

        case 'settings':
            let info = {...settings};
            delete info.sites;
            delete info.spoilers;
            for (let k of info) {
                setSetting(k, info[k]);
            }
            break;
    }
}
