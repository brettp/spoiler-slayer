import {Component} from 'preact';
import Site from './site';

export default class List extends Component {
    constructor(props) {
        super(props);
        this.state = {
            spoilers: props.spoilers,
        };

        this.removeSpoiler = this.removeSpoiler.bind(this);
    }

    removeSpoiler(id) {
        const spoilers = this.state.spoilers.slice();
        delete spoilers[id];
        this.setState({spoilers: spoilers});
    }

    render(props) {
        return (
            <ol class="col-2" id="spoilers" data-settings-name="spoilers">
                {this.state.spoilers.map((spoiler, i) => {
                    return (
                        <li key={i}>
                            <Spoiler
                                id={i}
                                value={spoiler.spoiler}
                                isRegex={spoiler.isRegex}
                                remove={this.removeSpoiler}
                            />
                        </li>
                    );
                })}
            </ol>
        );
    }
}
