import './styles';
import '../../node_modules/@fortawesome/fontawesome-free/css/all';
import {render, Component, Input} from 'preact';
import {SpoilerSettings} from './components/SpoilerSettings';
import {SiteSettings} from './components/SiteSettings';
import {downloadSettings, resetToOg} from './lib/import_export';

class Options extends Component {
    constructor(props) {
        super(props);

        this.state = {...props.settings};
        this.state.newSpoiler = {
            spoiler: '',
            isRegex: false,
        };

        this.state.newSite = {
            urlRegex: '',
            selector: '',
            isRegex: false,
        };

        if (!this.state.sites) {
            this.state.sites = [];
        }

        if (!this.state.spoilers) {
            this.state.spoilers = [];
        }

        this.resetToOgSites = this.resetToOgSites.bind(this);
        this.resetToOgSpoilers = this.resetToOgSpoilers.bind(this);
        this.reset = this.reset.bind(this);
        this.saveToSettings = this.saveToSettings.bind(this);

        this.onRemove = this.onRemove.bind(this);
        this.onUpdate = this.onUpdate.bind(this);

        this.onNewSpoilerSubmit = this.onNewSpoilerSubmit.bind(this);
        this.onNewChange = this.onNewChange.bind(this);

        this.onNewSiteSubmit = this.onNewSiteSubmit.bind(this);

        this.importSettings = this.importSettings.bind(this);
        this.fileBrowser = this.fileBrowser.bind(this);

        this.forceUpdate = this.forceUpdate.bind(this);
    }

    async updateFromSettings() {
        console.log('Updating from settings...');
        const settings = await cmd('getSettings');
        console.log('presettings', settings);
        console.log('prestate', this.state);
        this.setState({...settings}, () => { console.log('post state', this.state)});
    }

    async saveToSettings() {
        setSetting('sites', this.state.sites);
        setSetting('spoilers', this.state.spoilers);
    }

    async resetToOgSites(e) {
        e.preventDefault();
        if (confirm('Are you use you want to reset to the original list of sites?')) {
            await resetToOg('sites');
            await this.updateFromSettings();
            // this.saveToSettings();
        }
    }

    async resetToOgSpoilers(e) {
        e.preventDefault();
        if (confirm('Are you use you want to reset to the original list of spoilers?')) {
            await resetToOg('spoilers');
            await this.updateFromSettings();
            // this.saveToSettings();
        }
    }

    async reset(e) {
        e.preventDefault();
        if (confirm('Are you use you want to reset all settings?')) {
            let defaults = await cmd('getDefaultSettings');
            await cmd('saveSettings', defaults);
            this.updateFromSettings();
        }
    }

    onRemove(e, type, id) {
        const data = [...this.state[type]];
        data.splice(id, 1);
        const state = {};
        state[type] = data;
        this.setState(state, this.saveToSettings);
    }

    onUpdate(datum, type, id) {
        const data = [...this.state[type]];
        data[id] = datum;

        const state = {};
        state[type] = data;
        this.setState(state, this.saveToSettings);
    }

    onNewSpoilerSubmit(e) {
        e.preventDefault();
        const spoiler = {...this.state.newSpoiler};
        const spoilers = [...this.state.spoilers];
        spoilers.unshift(spoiler);

        this.setState(
            {
                spoilers: spoilers,
                newSpoiler: {
                    spoiler: '',
                    isRegex: false,
                },
            },
            this.saveToSettings
        );
    }

    onNewChange(datum, type, id) {
        let key = type === 'spoilers' ? 'newSpoiler' : 'newSite';
        let newState = {};
        newState[key] = datum;
        this.setState(newState);
    }

    onNewSiteSubmit(e) {
        e.preventDefault();
        const site = {...this.state.newSite};
        const sites = [...this.state.sites];
        sites.unshift(site);

        this.setState(
            {
                sites: sites,
                newSite: {
                    urlRegex: '',
                    selector: '',
                    isRegex: false,
                },
            },
            this.saveToSettings
        );
    }

    async importSettings(e) {
        e.preventDefault();
        let files = e.target.files;
        let self = this;

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
                            console.log(settings[item]);
                            await setSetting(item, settings[item]);
                            await self.updateFromSettings();
                            break;
                    }
                }
            };
        }

        this.uploadForm.reset();
    }

    fileBrowser(e) {
        this.fileInput.click();
    }

    async forceUpdate() {
        this.updateFromSettings();
    }

    render() {
        return (
            <div id="options">
                <h2 id="title">Game of Spoils Lite</h2>
                <hr />
                <SpoilerSettings
                    spoilers={this.state.spoilers}
                    onSpoilerChange={this.onUpdate}
                    onNewChange={this.onNewChange}
                    onSubmit={this.onNewSpoilerSubmit}
                    onRemove={this.onRemove}
                    newSpoiler={this.state.newSpoiler}
                />
                <SiteSettings
                    sites={this.state.sites}
                    onSiteChange={this.onUpdate}
                    onNewChange={this.onNewChange}
                    onSubmit={this.onNewSiteSubmit}
                    onRemove={this.onRemove}
                    newSite={this.state.newSite}
                />

                <footer>
                    <form class="none" ref={uploadForm => (this.uploadForm = uploadForm)}>
                        <input
                            type="file"
                            onChange={this.importSettings}
                            ref={fileInput => (this.fileInput = fileInput)}
                        />
                        <input type="submit" />
                    </form>

                    <div class="left">
                        <ul class="menu-h">
                            <li>
                                <a href="#" onClick={this.resetToOgSites}>
                                    Reset to default sites
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={this.resetToOgSpoilers}>
                                    Reset to default spoilers
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={this.fileBrowser}>
                                    Import
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={() => downloadSettings('all')}>
                                    Export
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div class="right">
                        <ul class="menu-h">
                            <li>
                                <a href="#clear-settings" onClick={this.reset}>
                                    Clear settings
                                </a>
                            </li>
                        </ul>
                    </div>
                </footer>
            </div>
        );
    }
}

async function init() {
    cmd('getSettings').then(res => {
        render(<Options settings={res} />, document.body);
    });
}

init();
