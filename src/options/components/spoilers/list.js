import {Component} from 'preact';
import Spoiler from './spoiler';

export default class List extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // spoilers: props.spoilers,
        };
    }

    render(props) {
        return (
            <ol class="col-2" id="spoilers" data-settings-name="spoilers">
                {this.props.spoilers.map((spoiler, i) => {
                    let hash = i + spoiler.spoiler + spoiler.isRegex

                    return (
                        <li key={hash}>
                            <Spoiler
                                id={i}
                                spoiler={spoiler.spoiler}
                                isRegex={spoiler.isRegex}
                                onRemove={this.props.onRemove}
                                onChange={this.props.onChange}
                            />
                        </li>
                    );
                })}
            </ol>
        );
    }
}
