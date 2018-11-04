import {Component} from 'preact';
import Spoiler from './Spoiler';

export default class Site extends Spoiler {
    constructor(props) {
        super(props);
        this.type = 'sites';
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
                        />
                        <span class="regex-marker">/ig</span>
                    </label>
                    {this.renderCheckbox()}
                </div>
            </div>
        );
    }
}