import {Component, createRef} from 'preact';

export default class Spoiler extends Component {
    constructor(props) {
        super(props);

        this.state = {
            spoiler: props.spoiler,
            isRegex: props.isRegex,
        };

        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {}

    componentWillUnmount() {}

    handleChange(e) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({[name]: value}, () => {
            this.props.onChange(this.state);
        });
    }

    reset() {
        this.setState({
            spoiler: '',
            isRegex: false,
        });
    }

    render() {
        let remove;
        let classes = 'supports-regex';

        if (this.state.isRegex) {
            classes += ' is-regex';
        }

        if (this.props.onRemove) {
            remove = (
                <a
                    class="remove-li"
                    onClick={() => {
                        this.props.onRemove(this.props.id);
                    }}
                >
                    <i class="fa fa-trash fader" />
                </a>
            );
        }

        return (
            <div class="spoiler-row">
                {remove}
                <label class={classes}>
                    <span class="regex-marker">/</span>
                    <input
                        autocomplete="off"
                        type="text"
                        class="save-flasher no-auto-save"
                        name="spoiler"
                        value={this.state.spoiler}
                        onChange={this.handleChange}
                    />
                    <span class="regex-marker">/ig</span>
                </label>
                <label class="checkbox inline">
                    <input
                        type="checkbox"
                        name="isRegex"
                        value="1"
                        class="no-auto-save"
                        checked={this.state.isRegex}
                        onChange={this.handleChange}
                    />
                    <code>/re/</code>
                </label>
            </div>
        );
    }
}
