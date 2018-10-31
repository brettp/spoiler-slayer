import {Component} from 'preact';
import Spoiler from './Spoiler';
import Site from './Site';

export default class List extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // spoilers: props.spoilers,
        };
    }

    render(props) {
        let classes = '';
        if (this.props.type == 'spoilers') {
            classes = 'col-2';
        }
        return (
            <ol class={classes} id={this.props.type} data-settings-name={this.props.type}>
                {this.props.data.map((datum, i) => {
                    let hash = Object.keys(datum).join('') + Object.values(datum).join('');
                    switch (this.props.type) {
                        case 'spoilers':
                            return (
                                <li key={hash}>
                                    <Spoiler
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
                                <li key={hash}>
                                    <Site
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
