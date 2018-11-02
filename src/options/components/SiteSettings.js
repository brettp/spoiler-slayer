import Site from './Site';
import List from './List';
import { SpoilerSettings } from './SpoilerSettings';
import { addFlash } from '../lib/util';

export class SiteSettings extends SpoilerSettings {

    validate() {
        if (!this.input.selectorInput.value.trim()) {
            addFlash(this.input.selectorInput, 'fail');
            return false;
        } else if (!this.input.siteInput.value.trim()) {
            addFlash(this.input.siteInput, 'fail');
            return false;
        }

        // addFlash(this.input.selectorInput, 'success');
        // addFlash(this.input.siteInput, 'success');
        return true;
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
