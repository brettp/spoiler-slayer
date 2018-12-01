class SpoilerBlockerElement extends HTMLElement {
    constructor() {
        super();

        let templateId = this.templateId;

        if (!templateId) {
            throw `Missing getter for templateId in class ${this.constructor.name}`;
        }

        let templateEl = document.getElementById(templateId);

        if (!templateEl) {
            throw `Missing template element with an id of ${templateId} in class ${this.constructor.name}`
        }

        this.model = {};
        this.template = templateEl.content;
        this._unattachedEl = this.template.cloneNode(true);
        this._appended = false;
        this.innerInputs = {};

        for (let input of this._unattachedEl.querySelectorAll('input, textarea, regex-input')) {
            this.innerInputs[input.getAttribute('name')] = input;
        }
    }

    setInnerInputAttribute(input, name, val) {
        if (this.innerInputs[name]) {
            this.innerInputs[name].setAttribute(name, val);
        }
    }

    /**
     * Return the correct ref to the element depending on if it's been attached
     */
    get element() {
        return this._appended ? this : this._unattachedEl;
    }

    updateModelOnChange(e) {
        const target = e.target;
        if (this.model.constructor.mappedProps.includes(target.name)) {
            this.model[target.name] = target.type === 'checkbox' ? target.checked : target.value;
        }

        this.updateAttributesFromModel();
    }

    get byQS() {
        return this.element.querySelectorAll.bind(this.element);
    }

    get byQSOne() {
        return this.element.querySelector.bind(this.element);
    }

    getAttribute(name) {
        return this[name];
    }

    getAttributeBool(name) {
        return helpers.toBool(this.getAttribute(name));
    }

    attachModel(model) {
        if (!model instanceof SpoilerBlockerModel) {
            throw `Invalid model type '${model.constructor.name}' in ${this.constructor.name}`;
        }
        this.model = model;
        this.updateAttributesFromModel();
    }

    updateAttributesFromModel() {
        if (this.serializeMap) {
            for (const [attrName, modelName] of Object.entries(this.serializeMap)) {
                this.setAttribute(attrName, this.model[modelName]);
            }
        }
    }

    connectedCallback() {
        this.render();
    }

    onAppend() {}

    render() {
        if (!this._appended) {
            this._appended = true;
            this.appendChild(this._unattachedEl);
            this.addEventListener('change', this.updateModelOnChange.bind(this));
            this.onAppend();
        }

        this._originalValues = {};

        for (let attr of this.getAttributeNames()) {
            let val = this.getAttribute(attr);
            this._originalValues[attr] = val;
        }
    }
}

class SaveableItem extends SpoilerBlockerElement {

}

class SpoilerBlockerList extends HTMLUListElement {
    constructor() {
        super();
        this.items = [];
        this.elements = [];

        this.addEventListener('change', this.save.bind(this));
        this.addEventListener('click', this.handleRemoveClick.bind(this));
    }

    // @todo probably better to use native funcs on the array
    add(model) {
        this.items.push(model);
    }

    remove(id) {
        this.items.splice(id, 1);
    }

    save() {
        const name = this.getAttribute('settings-name');
        if (!name) {
            throw `Cannot save without settings-name attribute for class ${this.constructor.name}`
        }

        if (this.getAttribute('disabled')) {
            return false;
        }

        setSetting(name, this.items);
    }

    handleRemoveClick(e) {
        const target = e.target;

        if (!target.classList.contains('delete-item')) {
            return;
        }

        let li = helpers.getNearest('li', target);
        if (!li) {
            return;
        }

        if (this.getAttribute('disabled')) {
            return;
        }

        e.preventDefault();

        if (li.customElement) {
            let index = this.elements.indexOf(li.customElement);
            if (index >= 0) {
                this.elements.splice(index, 1);
                this.items.splice(index, 1);
            }
        }

        this.removeChild(li);
        this.save();
    }

    render() {
        if (this.items) {
            let name = this.getAttribute('list-item-element-name');
            if (!name || name === 'null') {
                throw `Missing attribute list-item-element-name in ${this.constructor.name}`;
            }

            for (const item of this.items) {
                let li = d.createElement('li');
                let el = d.createElement(name);
                el.attachModel(item);
                li.customElement = el;

                if (helpers.toBool(this.getAttribute('disabled'))) {
                    el.setAttribute('disabled', true);
                }

                this.appendChild(li);
                li.appendChild(el);
                this.elements.push(el);
            }
        }
    }

    connectedCallback() {
        this.render();
    }
}

SpoilerBlockerList.observedAttributes = ['disabled', 'settings-name', 'list-item-element-name'];
customElements.define('spoilers-blocker-list', SpoilerBlockerList, {extends: 'ul'});

/**
 * A combo text and checkbox input for regex entry
 */
class RegexInput extends SpoilerBlockerElement {
    get templateId() {
        return 'regex-input';
    }

    constructor() {
        super();

        this.template = document.getElementById('regex-input').content;
        this._unattachedEl = this.template.cloneNode(true);
        this.textInput = this._unattachedEl.querySelector('input[type=text]');
        this.checkboxInput = this._unattachedEl.querySelector('input[type=checkbox]');
    }

    connectedCallback() {
        if (!this._hasEls) {
            this.appendChild(this._unattachedEl);
            this._hasEls = true;
        }

        this.setIsRegex(this.getAttribute('is-regex'));
        this._originalValues = {};

        for (let attr of this.getAttributeNames()) {
            let val = this.getAttribute(attr);
            this._originalValues[attr] = val;

            if (attr == 'is-regex') {
                this.setIsRegex(val);
            } else {
                this.setTextInputAttr(attr, val || '');
            }
        }

        this.checkboxInput.addEventListener('change', this.handleCheckboxClick.bind(this));

        // regex check
        this.textInput.addEventListener('keyup', this.verifyRegex.bind(this));
        this.checkboxInput.addEventListener('change', this.verifyRegex.bind(this));
    }

    get value() {
        return this.textInput.value;
    }

    get name() {
        return this.textInput.name;
    }

    reset() {
        this.setTextInputAttr('value', this._originalValues['value'] || '');
        if (this._originalValues['is-regex'] || false) {
            this.checkboxInput.setAttribute('checked', true);
        } else {
            this.checkboxInput.removeAttribute('checked');
        }
    }

    verifyRegex() {
        if (this.checkboxInput.checked) {
            try {
                new RegExp(this.textInput.value, 'iu');
            } catch (e) {
                this.textInput.setCustomValidity('Invalid regex');
                return;
            }
        }
        this.textInput.setCustomValidity('');
    }

    handleCheckboxClick(e) {
        this.setAttribute('is-regex', e.target.checked);
        if (this['is-regex']) {
            this.setTextInputAttr('placeholder', this.getAttribute('regex-placeholder') || '');
        } else {
            this.setTextInputAttr('placeholder', this.getAttribute('placeholder') || '');
        }
    }

    setTextInputAttr(name, val) {
        this.textInput.setAttribute(name, val);
        this.verifyRegex();
    }

    setIsRegex(isRegex) {
        this['is-regex'] = helpers.toBool(isRegex);
        this.classList.toggle('is-regex', this['is-regex']);
        if (this['is-regex']) {
            this.checkboxInput.setAttribute('checked', true);
        } else {
            this.checkboxInput.removeAttribute('checked');
        }
    }

    attributeChangedCallback(name, oldV, newV) {
        if (oldV === newV) {
            return;
        }

        switch (name) {
            case 'is-regex':
                this.setIsRegex(newV);
                break;

            case 'value':
            case 'name':
                this.setTextInputAttr(name, newV || '');
                break;

            case 'disabled':
                if (newV) {
                    this.checkboxInput.setAttribute('disabled', true);
                    this.setTextInputAttr('disabled', true);
                } else {
                    this.checkboxInput.removeAttribute('disabled');
                    this.setTextInputAttr.removeAttribute('disabled');
                }
                break;
        }
    }
}

RegexInput.observedAttributes = ['is-regex', 'value', 'name', 'disabled'];
customElements.define('regex-input', RegexInput);

/**
 * Spoiler item
 */
class SpoilerItem extends SaveableItem {
    get itemType() {
        return 'spoiler';
    }

    get templateId() {
        return 'spoiler';
    }

    get serializeMap() {
        return {
            'value': 'spoiler',
            'is-regex': 'isRegex'
        };
    }

    get modelClass() {
        return Spoiler;
    }

    attributeChangedCallback(name, oldV, newV) {
        // super.attributeChangedCallback(...arguments);

        this.innerInputs['spoiler'].setAttribute(name, newV);

        if (name === 'disabled') {
            if (helpers.toBool(newV)) {
                this.element.querySelector('.delete-item').classList.add('none');
            } else {
                this.element.querySelector('.delete-item').classList.remove('none');
            }
        }
    }
}

SpoilerItem.observedAttributes = ['name', 'value', 'disabled', 'is-regex'];
customElements.define('spoiler-item', SpoilerItem);

/**
 * Site item
 */
class SiteItem extends SaveableItem {
    get itemType() {
        return 'site';
    }

    get templateId() {
        return 'site';
    }

    get serializeMap() {
        return {
            'url-regex': 'urlRegex',
            'is-regex': 'isRegex',
            'selector-value': 'selector'
        };
    }

    get modelClass() {
        return Site;
    }

    attributeChangedCallback(name, oldV, newV) {
        // super.attributeChangedCallback(...arguments);
        switch (name) {
            case 'url-regex':
                this.innerInputs['urlRegex'].setAttribute('value', newV);
                break;

            case 'is-regex':
                this.innerInputs['urlRegex'].setAttribute(name, newV);
                break;

            case 'selector-value':
                this.innerInputs['selector'].setAttribute('value', newV);
                break;
        }

        if (name === 'disabled') {
            if (helpers.toBool(newV)) {
                for (const [name, input] of Object.entries(this.innerInputs)) {
                    input.setAttribute('disabled', true);
                }

                this.element.querySelector('.delete-item').classList.add('none');
            } else {
                for (let input of Object.entries(this.innerInputs)) {
                    input.removeAttribute('disabled');
                }

                this.element.querySelector('.delete-item').classList.remove('none');
            }
        }
    }
}

SiteItem.observedAttributes = ['name', 'url-regex', 'selector-value', 'disabled', 'is-regex'];
customElements.define('site-item', SiteItem);

class SubscriptionItem extends SaveableItem {
    get templateId() {
        return 'subscription';
    }

    get serializeMap() {
        return {
            'url-value': 'url',
            'use-spoilers': 'useSpoilers',
            'use-sites': 'useSites'
        };
    }

    get modelClass() {
        return Subscription;
    }

    attributeChangedCallback(name, oldV, newV) {
        // super.attributeChangedCallback(...arguments);

        if (oldV === newV) {
            return;
        }
        switch (name) {
            case 'url-value':
                // slots are more complicated because you have to define the elements
                this.byQSOne('.subscription-url').innerText = newV;
                this.byQSOne('.subscription-url').setAttribute('href', newV);
                break;

            case 'use-spoilers':
                if (helpers.toBool(newV)) {
                    this.innerInputs['useSpoilers'].setAttribute('checked', true);
                } else {
                    this.innerInputs['useSpoilers'].removeAttribute('checked');
                }
                break;

            case 'use-sites':
                if (helpers.toBool(newV)) {
                    this.innerInputs['useSites'].setAttribute('checked', true);
                } else {
                    this.innerInputs['useSites'].removeAttribute('checked');
                }
                break;
        }

        if (name === 'disabled') {
            for (let input of this.innerInputs) {
                if (helpers.toBool(newV)) {
                    input.setAttribute('disabled', 'disabled');
                } else {
                    input.removeAttribute('disabled');
                }
            }

            this.element.querySelector('.delete-item').classList.add('none');
        }

        if (this._appended) {
            this.render();
        }
    }

    onAppend() {
        // don't let label clicks open summary
        for (const el of this.querySelectorAll('.no-click')) {
            el.addEventListener('click', (e) => {
                if (e.target == e.currentTarget && e.target.nodeName === 'LABEL') {
                    e.stopPropagation();
                    e.preventDefault();
                    e.target.querySelector('input[type=checkbox]').click();
                }
            });
        }

        // there's no built in way to animate the details element so do it manually
        // add a close attribute to fire off an animation
        // once the animation ends, actually close it
        // we can't use the toggle element because it fires after the state change
        for (const el of this.byQS('summary')) {
            el.addEventListener('click', e => {
                if (e.currentTarget.nodeName !== 'SUMMARY' || e.target.nodeName === 'INPUT') {
                    return;
                }

                let details = el.parentElement;

                if (!details.open) {
                    details.removeAttribute('close');
                    details.open = true;
                } else {
                    details.classList.add('closing');

                    details.querySelector('.subscription-content').addEventListener('animationend', e => {
                        details.open = false;
                        details.removeAttribute('close');
                        details.classList.remove('closing');
                    }, {once: true});
                }

                e.preventDefault();
                e.stopPropagation();
            });
        }
    }

    renderSubList(active, type) {
        if (active && this.model.content[type]) {
            // remove old list
            for (const ul of this.byQS(`.subscription-${type}-content > ul`)) {
                ul.parentElement.removeChild(ul);
            }

            this.byQSOne(`.subscription-${type}`).classList.remove('none');

            let list = new SpoilerBlockerList();
            list.setAttribute('list-item-element-name', `${type.substring(0, type.length - 1)}-item`);
            list.setAttribute('disabled', true);
            list.items = this.model.content[type];

            this.byQSOne(`.subscription-${type}-content`).append(list);
        } else {
            this.byQSOne(`.subscription-${type}`).classList.add('none');
        }
    }

    render() {
        super.render();
        let now = new Date();

        if (this.model.lastUpdate) {
            let update = new Date(this.model.lastUpdate);
            let time = this.byQSOne('.last-updated');

            time.setAttribute('datetime', update);

            time.innerText = update.toLocaleDateString() == now.toLocaleDateString() ?
                update.toLocaleTimeString() :
                update.toLocaleString();
        }

        if (!this.model.lastUpdateSuccess) {
            this.byQSOne('.update-failed').classList.remove('none');
            this.byQSOne('.update-failed-banner').classList.remove('none');

            if (this.model.lastUpdateAttempt) {
                let attempt = new Date(this.model.lastUpdateAttempt);
                let time = this.byQSOne('.last-update-attempt');

                time.setAttribute('datetime', attempt);

                time.innerText = attempt.toLocaleDateString() == now.toLocaleDateString() ?
                    attempt.toLocaleTimeString() :
                    attempt.toLocaleString();
            }

            if (this.model.lastError) {
                this.byQSOne('.update-failed-text').innerText = this.model.lastError;
            }
        }

        if (!this.model.content) {
            return;
        }

        // update metadata
        // @todo time last updated
        this.byQSOne('.export-name').innerText = this.model.content.exportName;
        this.byQSOne('.spoilers-count').innerText = this.model.content.spoilers ? this.model.content.spoilers.length : 0;
        this.byQSOne('.sites-count').innerText = this.model.content.sites ? this.model.content.sites.length : 0;

        this.renderSubList(this.model.useSpoilers, 'spoilers');
        this.renderSubList(this.model.useSites, 'sites');
    }
}

SubscriptionItem.observedAttributes = ['use-sites', 'use-spoilers', 'url-value', 'disabled'];
customElements.define('subscription-item', SubscriptionItem);


class CustomIcon extends HTMLElement {
    constructor() {
        super();

        let iconAttr = this.getAttribute('icon');
        if (iconAttr) {
            switch (iconAttr) {
                case "delete":
                    this.icon = '✖️';
                    break;

                case "add":
                    this.icon = '➕';
                    break;

                case "download":
                    this.icon = '⇪';
                    this.classList.add('r180');
                    break;

                case "upload":
                    this.icon = '⇪';
                    break;

                case "reload":
                    this.icon = '↻'
                    break;

                case "tip":
                    this.icon = '💡';
                    break;
            }
        } else {
            this.icon = this.innerText.trim();
        }

        this.attachShadow({
            mode: "open"
        });

        const template = document.createElement('i');
        if (this.getAttribute('icon')) {
            template.classList.add(this.getAttribute('icon'));
        }
        template.innerText = this.icon;

        const style = document.createElement('style');
        this.shadowRoot.appendChild(style);

        // fix for FF's weird short fonts
        // let transformOrigin = '50% 64.25%';
        let transformOrigin = '44% 51.25%';
        if (/firefox/i.test(navigator.userAgent)) {
            transformOrigin = '31% 63%';
        }

        style.innerText = `
:host {
    display: inline-flex;
    position: relative;
    width: 1em;
    height: 1em;
    font-size: 1em;
    pointer-events: none;
    filter: grayscale(100%);
}

i {
    display: inline-flex;
    line-height: 1em;
    height: 1em;
    width: 1em;
    font-style: initial;
}

i.reload {
    vertical-align: bottom;
    transform-origin: ${transformOrigin};
}

i.upload {
    vertical-align: text-top;
}

:host(.spin) > i {
    animation: spin 1s infinite;
}

:host(.r180) > i {
	transform: rotate(180deg);
}

:host(.r180.spin) > i {
    transform: inherit;
}

:host(.end-animation) > i {
    animation-iteration-count: 1;
}

@keyframes spin {
	to {
    	transform: rotate(360deg);
    }
}
`.replace(/[\n\r]/g, '');

        this.shadowRoot.appendChild(template);
        this.classList.add('active');
    }

    endAnimation() {
        this.classList.add('end-animation');

        this.shadowRoot.addEventListener('animationend', e => {
            e.stopPropagation();
            this.classList.remove('spin');
            this.classList.remove('end-animation');
        }, {once: true});
    }
}

customElements.define('custom-icon', CustomIcon);
