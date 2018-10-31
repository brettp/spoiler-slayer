import {Component} from 'preact';
import Site from './Site';
import List from './List';

export class SiteSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            sites: props.sites || [],
            newSite: {
                site: '',
                isRegex: false,
                selector: '',
            },
        };

        this.onNewSiteSubmit = this.onNewSiteSubmit.bind(this);
        this.removeSite = this.removeSite.bind(this);
        this.newChange = this.newChange.bind(this);
    }

    removeSite(e, id) {
        const sites = this.state.sites.slice();
        delete sites[id];
        this.setState({sites: sites});
    }

    onNewSiteSubmit(e) {
        e.preventDefault();
        e.stopPropagation();

        const sites = this.state.sites.slice();
        sites.unshift(this.state.newSite);

        this.setState({
            sites: sites,
            newSite: {
                site: '',
                isRegex: false,
                selector: '',
            },
        });

        this.newSiteInput.reset();
    }

    newChange(site) {
        const newSite = {...site};
        this.setState({newSite: newSite});
    }

    oldSpoilerChange(spoiler) {
        return true;
    }

    render() {
        return (
            <section class="sites-settings">
                <h2>Sites &amp; Selectors</h2>
                <p>Add sites to block (regex supported) and a selector for that site</p>
                <form
                    class="new-entry new-site"
                    onSubmit={this.onNewSiteSubmit}
                    ref={newSiteForm => (this.newSiteForm = newSiteForm)}
                >
                    <input type="submit" class="none" />
                    <Site
                        icon="plus"
                        onIconClick={this.onNewSiteSubmit}
                        value={this.state.newSite}
                        onChange={this.newChange}
                        ref={newSiteInput => (this.newSiteInput = newSiteInput)}
                    />
                </form>

                <List
                    type="sites"
                    data={this.state.sites}
                    icon="trash"
                    onIconClick={this.removeSite}
                    onChange={this.oldSpoilerChange}
                />
            </section>
        );
    }
}
