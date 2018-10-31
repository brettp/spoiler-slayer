import {Component} from 'preact';
import Spoiler from './Spoiler';

export default class Site extends Spoiler {
    render() {
        let classes = 'supports-regex';
        let icon = this.renderIcon();

        if (this.state.isRegex) {
            classes += ' is-regex';
        }

        return (
            <div class="site-row row">
                {icon}
                <label class="selector-input">
                    <input
                        name="selector"
                        type="text"
                        autocomplete="off"
                        placeholder=".sitetable > .thing.link:visible, .usertext-body, .scrollerItem"
                        value={this.state.selector}
                        onChange={this.handleChange}
                    />
                    <span class="site-at">@</span>
                </label>
                <div class="site-input">
                    <label class={classes}>
                        <span class="regex-marker">/</span>
                        <input
                            placeholder="www.reddit.com"
                            autocomplete="off"
                            type="text"
                            class="save-flasher no-auto-save"
                            name="url_regex"
                            value={this.state.url_regex}
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
            </div>
        );
    }
}
