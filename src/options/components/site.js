import {Component} from 'preact';
import Spoiler from './Spoiler';

export default class Site extends Spoiler {
    constructor(props) {
        super(props);
        this.type = 'sites';
        this.regexInputName = 'siteInput';
    }

    render() {
        return (
            <div class="site-row row">
                {this.renderIcon()}
                <label class="selector-input">
                    <input
                        name="selector"
                        type="text"
                        autocomplete="off"
                        class="save-flasher"
                        placeholder=".sitetable > .thing.link:visible, .usertext-body, .scrollerItem"
                        value={this.state.selector}
                        onChange={this.handleChange}
                        ref={ref => (this.selectorInput = ref)}
                    />
                    <span class="site-at">@</span>
                </label>
                <div class="site-input">
                    <label class={this.getClasses()}>
                        <span class="regex-marker">/</span>
                        <input
                            class="save-flasher"
                            placeholder="www.reddit.com"
                            autocomplete="off"
                            type="text"
                            class="save-flasher no-auto-save"
                            name="urlRegex"
                            value={this.state.urlRegex}
                            onChange={this.handleChange}
                            ref={ref => (this.siteInput = ref)}
                            onKeyUp={this.checkRegex}
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
            </div>
        );
    }
}
