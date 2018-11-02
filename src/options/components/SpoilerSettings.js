import {Component} from 'preact';
import Spoiler from './Spoiler';
import List from './List';

export class SpoilerSettings extends Component {
    constructor(props) {
        super(props);
        this.submitAndReset = this.submitAndReset.bind(this);
    }

    submitAndReset(e) {
        this.props.onNewSpoilerSubmit(e);
        this.input.reset();
    }

    render() {
        return (
            <section id="spoilers-settings">
                <h2>Spoilers</h2>
                <p>Add words to block. Can be RegEx if you know how!</p>
                <form class="new-entry new-spoiler" onSubmit={this.submitAndReset}>
                    <input type="submit" class="none" />
                    <Spoiler
                        icon="plus"
                        onIconClick={this.submitAndReset}
                        value={this.props.newSpoiler}
                        onChange={this.props.onNewChange}
                        ref={input => (this.input = input)}
                        showRECheckbox={true}
                    />
                </form>

                <List
                    type="spoilers"
                    data={this.props.spoilers}
                    icon="trash"
                    onIconClick={this.props.onRemove}
                    onChange={this.props.onSpoilerChange}
                />
            </section>
        );
    }
}
