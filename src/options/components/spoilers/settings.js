import {Component} from 'preact';
import Spoiler from './spoiler';
import List from './list';

export class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            spoilers: props.spoilers,
            newSpoiler: {
                spoiler: '',
                isRegex: false,
            },
        };

        this.onSubmit = this.onSubmit.bind(this);
        this.removeSpoiler = this.removeSpoiler.bind(this);
        this.newSpoilerChange = this.newSpoilerChange.bind(this);
    }

    removeSpoiler(id) {
        const spoilers = this.state.spoilers.slice();
        delete spoilers[id];
        this.setState({spoilers: spoilers});
    }

    onSubmit(e) {
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
                <form id="new-spoiler" onSubmit={this.onSubmit}>
                    <Spoiler
                        removable={false}
                        value={this.state.newSpoiler.spoiler}
                        isRegex={this.state.newSpoiler.isRegex}
                        onChange={this.newSpoilerChange}
                        ref={newSpoilerInput => (this.newSpoilerInput = newSpoilerInput)}
                    />
                </form>

                <List
                    spoilers={this.state.spoilers}
                    onRemove={this.removeSpoiler}
                    onChange={this.oldSpoilerChange}
                />
            </section>
        );
    }
}
