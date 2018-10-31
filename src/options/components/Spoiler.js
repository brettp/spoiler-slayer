import {Component} from 'preact';

export default class Spoiler extends Component {
    constructor(props) {
        super(props);

        this.state = props.value;
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({[name]: value}, () => {
            this.props.onChange(this.state);
        });
    }

    reset() {
        let newState = {};
        Object.keys(this.state).forEach(k => (newState[k] = ''));
        this.setState(newState);
    }

    renderIcon() {
        return (
            <a
                onClick={(e) => {
                    this.props.onIconClick(e, this.props.id);
                }}
            >
                <i class={`fas fa-fw fa-${this.props.icon} fader`} />
            </a>
        );
    }

    render() {
        let classes = 'supports-regex';
        let icon = this.renderIcon();

        if (this.state.isRegex) {
            classes += ' is-regex';
        }

        return (
            <div class="row spoiler-row" ref={row => (this.row = row)}>
                {icon}
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
