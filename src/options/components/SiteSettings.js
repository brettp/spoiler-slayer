import Site from './Site';
import List from './List';
import { SpoilerSettings } from './SpoilerSettings';

export class SiteSettings extends SpoilerSettings {
    constructor(props) {
        super(props);
        this.submitAndReset = this.submitAndReset.bind(this);
    }

    submitAndReset(e) {
        this.props.onNewSiteSubmit(e);
        this.input.reset();
    }

    render() {
        return (
            <section class="sites-settings">
                <h2>Sites &amp; Selectors</h2>
                <p>Add sites to block (regex supported) and a selector for that site</p>
                <form
                    class="new-entry new-site"
                    onSubmit={this.submitAndReset}
                    ref={newSiteForm => (this.newSiteForm = newSiteForm)}
                >
                    <input type="submit" class="none" />
                    <Site
                        icon="plus"
                        onIconClick={this.submitAndReset}
                        value={this.props.newSite}
                        onChange={this.props.onNewChange}
                        ref={input => (this.input = input)}
                        showRECheckbox={true}
                    />
                </form>
                <List
                    type="sites"
                    data={this.props.sites}
                    icon="trash"
                    onIconClick={this.props.onRemove}
                    onChange={this.props.onSiteChange}
                />
            </section>
        );
    }
}
