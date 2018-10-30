import {Component} from 'preact';
import List from './list';

export class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            sites: props.sites,
        };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.addSite = this.addSite.bind(this);
    }

    handleSubmit(e) {
        console.log(this.state);
        e.preventDefault();
    }

    addSite(site) {
        const spoilers = this.state.spoilers.slice();
        spoilers.push(spoiler);
        this.setState({spoilers: spoilers});
    }

    render() {
        return (
            <section class="sites-settings">
                <h2>Sites &amp; Selectors</h2>
                <p>Add sites to block and an element selector for that site</p>
                <form id="new-site" onSubmit={this.handleSubmit}>
                    <Site />
                </form>
                <table id="sites" data-settings-name="sites">
                    <tr>
                        <th>
                            <a class="new-row" data-row-type="site">
                                <i class="fa fa-plus" />
                            </a>
                        </th>
                        <th>Site or RegEx</th>
                        <th>Element selector</th>
                    </tr>

                    <List sites={this.state.sites} />
                </table>
            </section>
        );
    }
}
