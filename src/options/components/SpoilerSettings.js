import {Component} from 'preact';
import Spoiler from './Spoiler';
import List from './List';

export class SpoilerSettings extends Component {
    constructor(props) {
        console.log(props);
        super(props);
        this.state = {
            spoilers: props.spoilers,
            newSpoiler: {
                spoiler: '',
                isRegex: false,
            },
        };

        this.onNewSpoilerSubmit = this.onNewSpoilerSubmit.bind(this);
        this.removeSpoiler = this.removeSpoiler.bind(this);
        this.newSpoilerChange = this.newSpoilerChange.bind(this);
    }

    removeSpoiler(e, id) {
        const spoilers = this.state.spoilers.slice();
        delete spoilers[id];
        this.setState({spoilers: spoilers});
    }

    onNewSpoilerSubmit(e) {
        e.preventDefault();

        const spoilers = this.state.spoilers.slice();
        spoilers.unshift(this.state.newSpoiler);

        this.setState({
            spoilers: spoilers,
            newSpoiler: {
                spoiler: '',
                isRegex: false,
            },
        });

        this.newSpoilerInput.reset();
    }

    newSpoilerChange(spoiler) {
        const newSpoiler = {
            spoiler: spoiler.spoiler,
            isRegex: spoiler.isRegex,
        };

        this.setState({newSpoiler: newSpoiler});
    }

    oldSpoilerChange(spoiler) {
        return true;
    }

    render() {
        return (
            <section id="spoilers-settings">
                <h2>Spoilers</h2>
                <p>Add words to block. Can be RegEx if you know how!</p>
                <form
                    class="new-entry new-spoiler"
                    onSubmit={this.onNewSpoilerSubmit}
                    ref={newSpoilerForm => (this.newSpoilerForm = newSpoilerForm)}
                >
                    <Spoiler
                        icon="plus"
                        onIconClick={this.onNewSpoilerSubmit}
                        value={this.state.newSpoiler}
                        onChange={this.newSpoilerChange}
                        ref={newSpoilerInput => (this.newSpoilerInput = newSpoilerInput)}
                    />
                </form>

                <List
                    type="spoilers"
                    data={this.state.spoilers}
                    icon="trash"
                    onIconClick={this.removeSpoiler}
                    onChange={this.oldSpoilerChange}
                />
            </section>
        );
    }
}
