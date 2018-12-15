class OptionsSettings {
    setSetting(name, val) {
        this.settings[name] = val;
        // in msgApi.js
        return setSetting(name, val);
    }

    saveSettings(settings) {
        this.settings = settings;
        return saveSettings(settings);
    }

    constructor(settings) {
        this.settings = settings;
        this.populateFromSettings();

        // check validity
        // this doesn't work quite right
        // for (let el of byQS('input')) {
        //     el.addEventListener('invalid', (e) => {
        //         console.log('invalid', e);
        //         if (e.target.dataset.validationError) {
        //             e.target.setCustomValidity(e.target.dataset.validationError);
        //         } else {
        //             e.target.dataset.validationError('');
        //         }
        //         helpers.addFlash(e.target, 'fail');
        //     });
        // }

        // add forms and icons
        byId('new-spoiler').addEventListener('submit', e => this.onNewSubmit(e, 'spoilers'));
        byId('plus-spoiler').addEventListener('click', e => this.onNewSubmit(e, 'spoilers'));

        byId('new-site').addEventListener('submit', e => this.onNewSubmit(e, 'sites'));
        byId('plus-site').addEventListener('click', e => this.onNewSubmit(e, 'sites'));

        byId('new-subscription').addEventListener('submit', e => this.onNewSubmit(e, 'subscriptions'));
        byId('plus-subscription').addEventListener('click', e => this.onNewSubmit(e, 'subscriptions'));
        byId('update-subscriptions').addEventListener('click', this.updateSubscriptions.bind(this));

        // toolbar links
        d.body.addEventListener('click', this.handleToolbarClick.bind(this));

        // footer links
        // byId('reset-spoilers').addEventListener('click', resetToOgSpoilers);
        // byId('reset-sites').addEventListener('click', resetToOgSites);
        byId('export-settings').addEventListener('click', e => this.exportSettings('settings'));
        byId('export').addEventListener('click', e => this.exportSettings('all'));
        byId('import').addEventListener('click', e => byId('import-files').click());
        byId('import-files').addEventListener('change', this.importSettings.bind(this));
        byId('clear-settings').addEventListener('click', this.clearSettings.bind(this));

        const hideTips = byId('hideTips');
        hideTips.addEventListener('click', e => {
            this.setSetting('hideTips', e.target.checked);
            if (e.target.checked) {
                d.body.classList.add('hide-tips');
            } else {
                d.body.classList.remove('hide-tips');
            }
        });

        for (const link of byQS('.set-hide-tips')) {
            link.addEventListener('click', e => {
                e.preventDefault();
                this.setSetting('hideTips', true);
                d.body.classList.add('hide-tips');
                byId('hideTips').checked = true;
            });
        }

        byId('version').innerText = chrome.runtime.getManifest().version;
    }

    populateFromSettings(clear = false) {
        this.renderList(this.settings.spoilers, 'spoilers', clear);
        this.renderList(this.settings.sites, 'sites', clear);
        this.renderList(this.settings.subscriptions, 'subscriptions', clear);

        const hideTips = byId('hideTips');

        if (!this.settings.hideTips) {
            d.body.classList.remove('hide-tips');
            hideTips.removeAttribute('checked');
        } else {
            hideTips.setAttribute('checked', ' ');
        }
    }

    renderList(data, type, clear = false) {
        const container = byId(type);

        if (clear) {
            container.removeChild(container.children[0]);
        }

        let list = d.createElement('ul', {is: 'spoilers-blocker-list'});
        list.setAttribute('settings-name', type);
        list.setAttribute('list-item-element-name', type.substring(0, type.length - 1) + '-item');

        list.addEventListener('change', e => this.settings[type] = list.items);
        list.addEventListener('add', e => this.settings[type] = list.items);
        list.addEventListener('remove', e => this.settings[type] = list.items);

        list.items = helpers.objsToModels(data, type);
        container.appendChild(list);
    }

    handleToolbarClick(e) {
        const target = e.target;
        if (!target.classList.contains('toolbar-action')) {
            return;
        }

        const section = helpers.getNearest('section', target);
        const type = section.dataset.type;

        if (!type) {
            return;
        }

        e.preventDefault();

        switch (true) {
            case target.classList.contains('remove-all'):
                if (!confirm(`Clear all ${type}?`)) {
                    return;
                }
                this.setSetting(type, []);
                break;

            case target.classList.contains('import'):
                byId('import-files').click()
                break;
            case target.classList.contains('export'):
                this.exportSettings(type);
                break;
        }

        this.populateFromSettings(true);
    }

    async updateSubscriptions(e) {
        e.preventDefault();
        const icon = e.currentTarget.querySelector('custom-icon');
        icon.classList.add('spin');

        let result = await cmd('updateSubscriptions');

        if (result) {
            this.renderList(result, 'subscriptions', true);
            helpers.addFlash(byId('subscriptions-settings'), 'success');
        } else {
            helpers.addFlash(byId('subscriptions-settings'), 'fail');
        }

        // feels better with at least a second to spin
        icon.endAnimation();
    }

    resetToOgSites(e) {
        e.preventDefault();
        if (confirm('Reset to the original list of sites?')) {
            resetToOg('sites');
            this.populateFromSettings(true);
        }
    }

    resetToOgSpoilers(e) {
        e.preventDefault();

        if (confirm('Reset to the original list of spoilers?')) {
            resetToOg('spoilers');
            this.populateFromSettings(true);
        }
    }

    async onNewSubmit(e, type) {
        e.preventDefault();
        let form = helpers.getNearest('form', e.target);
        let list = byQSOne(`[settings-name=${type}]`);
        let datum = containerToDatum(form);

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
                if (!datum.url || !Subscription.isSubscribableUrl(datum.url)) {
                    helpers.addFlash(form.querySelectorAll('[type=url]'), 'fail');
                    return;
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
                datum = Subscription.factory(datum);
                helpers.addFlash(form, 'pending');

                if (!await datum.update()) {
                    if (datum.lastError) {
                        form.querySelector('.update-failed-text').innerText = datum.lastError;
                        form.querySelector('.update-failed-banner').classList.remove('none');
                    }

                    helpers.addFlash(form, 'fail');
                    return;
                }
                // fall through

            default:
                list.add(datum);
                break;
        }

        helpers.addFlash(form, 'success');
        if (type === 'subscriptions') {
            form.querySelector('.update-failed-banner').classList.add('none');
        }

        // reset doesn't work completely with web components, so do it manually too
        form.reset();
        let reEl = form.querySelector('regex-input');
        if (reEl) {
            reEl.reset();
        }

        await list.save();

        form.querySelector('input').focus();
    }

    importSettings(e) {
        e.preventDefault();
        let files = e.target.files;
        let self = this;

        for (const file of files) {
            let reader = new FileReader();
            reader.readAsBinaryString(file);

            reader.onloadend = function() {
                let obj = JSON.parse(this.result);
                if (obj.__exportVersion != 1) {
                    alert("Mismatched import version!");
                }

                for (const item in obj) {
                    switch (item) {
                        case 'subscriptions':
                        case 'sites':
                        case 'spoilers':
                            if (self.settings[item]) {
                                self.setSetting(item, self.settings[item].concat(obj[item]));
                            } else {
                                self.setSetting(item, obj[item]);
                            }

                            self.populateFromSettings(true);
                            if (item === 'subscriptions') {
                                byId('update-subscriptions').click();
                            }
                            break;
                    }
                }
            };
        }
    }

    async exportSettings(section = 'all') {
        // Work on a deep copy so nothing is saved to settings
        let val;
        let info = JSON.parse(JSON.stringify(await cmd('getSettings'), null, 2));

        switch (section) {
            case 'all':
                break;

            case 'settings':
                let newInfo = {};
                for (const name in Settings.defaultSettings) {
                    newInfo[name] = info[name];
                }

                delete newInfo.sites;
                delete newInfo.spoilers;
                delete newInfo.subscriptions;
                info = newInfo;
                break;

            case 'subscriptions':
                val = info[section];
                info = {};
                info[section] = val;
                break;

            default:
                // only export the single section
                val = info[section];
                info = {};
                info[section] = val;
                break;
        }

        // don't export any sub content
        if (info.subscriptions) {
            for (let sub of info.subscriptions) {
                sub.content = {};
            }
        }

        info.__exportVersion = 1;

        if (section === 'sites' || section === 'spoilers') {
            info.exportName = 'Unnamed List';
            info.comment = '';
        }

        let json = JSON.stringify(info, null, 2);

        let file = new Blob([json], {
            type: 'application/json',
        });

        let sectionCaps = helpers.ucWords(section);
        let now = new Date();
        // dates in JS are awful.
        let date = now.toISOString().split('T')[0];
        // let filename = now.toISOString().replace('T', '-').replace('Z', ' ').replace(':', );
        let filename = `Spoiler Slayer - ${sectionCaps} - ${date}.json`;
        var url = URL.createObjectURL(file);

        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true,
        });
    }

    async clearSettings(e) {
        e.preventDefault();
        if (confirm('Reset all settings to defaults?')) {
            let defaults = {...Settings.defaultSettings, ...Settings.demoSettings};
            await this.saveSettings(defaults);
            this.populateFromSettings(true);
            byId('update-subscriptions').click();
            window.scroll(0, 0);
        }
    }

    resetToOg(section = 'all') {
        switch (section) {
            case 'sites':
                return this.setSetting('sites', ogSettings.sites);

            case 'spoilers':
                return this.setSetting('spoilers', ogSettings.spoilers);

            case 'settings':
                let info = {...ogSettings};
                let newSettings = {};

                delete info.sites;
                delete info.spoilers;
                delete info.subscriptions;

                for (let k of info) {
                    newSettings[k] = info[k];
                }
                break;
        }
    }
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

(async function() {
    let settings = await cmd('getSettings');
    options = new OptionsSettings(settings);
})();