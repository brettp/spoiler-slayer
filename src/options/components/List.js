import {Component} from 'preact';
import Spoiler from './Spoiler';
import Site from './Site';

export default class List extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let classes = '';
        if (this.props.type == 'spoilers') {
            classes = 'col-2';
        }
        return (
            <ol class={classes} id={this.props.type} data-settings-name={this.props.type}>
                {this.props.data.map((datum, i) => {
                    let hash = i + Object.keys(datum).join('') + Object.values(datum).join('');
                    switch (this.props.type) {
                        case 'spoilers':
                            return (
                                <li>
                                    <Spoiler
                                        key={hash}
                                        id={i}
                                        value={datum}
                                        onIconClick={this.props.onIconClick}
                                        onChange={this.props.onChange}
                                        icon={this.props.icon}
                                    />
                                </li>
                            );
                        case 'sites':
                            return (
                                <li>
                                    <Site
                                        key={hash}
                                        id={i}
                                        value={datum}
                                        onIconClick={this.props.onIconClick}
                                        onChange={this.props.onChange}
                                        icon={this.props.icon}
                                    />
                                </li>
                            );
                    }
                })}
            </ol>
        );
    }
}
