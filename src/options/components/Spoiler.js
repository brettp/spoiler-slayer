import {Component} from 'preact';
import {addFlash, regexHasError} from '../lib/util';

export default class Spoiler extends Component {
    constructor(props) {
        super(props);

        this.type = 'spoilers';
        this.state = props.value;
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e) {
        const target = e.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({[name]: value}, () => {
            this.props.onChange(this.state, this.type, this.props.id);
        });

        if (name == 'spoiler' || name == 'urlRegex') {
            let error = regexHasError(value);
            if (error) {
                this.regexError.classList.remove('none');
            } else {
                this.regexError.classList.add('none');
            }
        }
    }

    reset() {
        let newState = {};
        Object.keys(this.state).forEach(k => (newState[k] = ''));
        this.setState(newState);
    }

    renderIcon() {
        return (
            <a
                onClick={e => {
                    this.props.onIconClick(e, this.type, this.props.id);
                }}
            >
                <i class={`fas fa-fw fa-${this.props.icon} fader`} />
            </a>
        );
    }

    renderCheckbox() {
        if (this.props.showRECheckbox) {
            return (
                <label class="checkbox inline">
                    <input
                        type="checkbox"
                        name="isRegex"
                        value="1"
                        checked={this.state.isRegex}
                        onChange={this.handleChange}
                    />
                    <code>/re/</code>
                </label>
            );
        }
    }

    getClasses() {
        let classes = 'supports-regex';

        if (this.state.isRegex) {
            classes += ' is-regex';
        }

        return classes;
    }

    render() {
        return (
            <div class="row spoiler-row" ref={row => (this.row = row)}>
                {this.renderIcon()}
                <label class={this.getClasses()}>
                    <span class="regex-marker">/</span>
                    <input
                        autocomplete="off"
                        type="text"
                        class="save-flasher"
                        name="spoiler"
                        ref={ref => (this.spoilerInput = ref)}
                        value={this.state.spoiler}
                        onChange={this.handleChange}
                    />
                    <span class="regex-marker">
                        /ig
                        <i
                            class="fas fa-exclamation-triangle regex-error none"
                            ref={ref => (this.regexError = ref)}
                        />
                    </span>
                </label>
                {this.renderCheckbox()}
            </div>
        );
    }
}
