class SpoilerBlockerElement extends HTMLElement {
    constructor() {
        super();

        let templateId = this.templateId;

        if (!templateId) {
            throw `Missing getter for templateId in class ${this.constructor.name}`;
        }

        let templateEl = document.getElementById(templateId);

        if (!templateEl) {
            throw `Missing element with an id of ${templateId} in class ${this.constructor.name}`
        }

        this.baseItem = {};
        this.template = templateEl.content;
        this._unattachedEl = this.template.cloneNode(true);
        this.innerInputs = {};

        for (let input of this._unattachedEl.querySelectorAll('input, textarea, regex-input')) {
            this.innerInputs[input.getAttribute('name')] = input;
        }

        // reverse map for quicker lookup later
        this.serializeMapReverse = {};

        if (this.serializeMap) {
            for (const [k, v] of Object.entries(this.serializeMap)) {
                if (typeof v === 'string') {
                    this.serializeMapReverse[v] = k;
                }
            }
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
        return this._appended ? this:  this._unattachedEl;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (!this._appended) {
            this.appendChild(this._unattachedEl);
            this._appended = true;
        }

        this._originalValues = {};

        for (let attr of this.getAttributeNames()) {
            let val = this.getAttribute(attr);
            this._originalValues[attr] = val;
        }

        this.addEventListener('change', this.updateAttributes.bind(this));
    }

    updateAttributes(e) {
        const target = e.target;
        if (this.serializeMapReverse.hasOwnProperty(target.name)) {
            const name = this.serializeMapReverse[target.name];
            this[name] = target.type === 'checkbox' ? target.checked : target.value;
        }
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

    serialize() {
        let obj;

        obj = {};
        if (this.serializeMap) {
            for (const [elName, itemName] of Object.entries(this.serializeMap)) {
                obj[itemName] = this.getAttribute(elName);
            }
        }

        if (this.propertiesMap) {
            for (const [elName, itemName] of Object.entries(this.propertiesMap)) {
                obj[itemName] = this[elName];
            }
        }

        if (this.settingsItemClass) {
            obj = this.settingsItemClass.factory(obj);
        }

        return obj;
    }

    deserialize(info) {
        this.baseItem = info;

        if (this.serializeMap) {
            for (const [elName, itemName] of Object.entries(this.serializeMap)) {
                this.setAttribute(elName, info[itemName]);
            }
        }
    }

    setProperties(item) {
        if (this.propertiesMap) {
            for (const [elName, itemName] of Object.entries(this.propertiesMap)) {
                this[elName] = item[itemName];
            }
        }
    }

    /**
     * Keep attributes in sync with real values
     */
    attributeChangedCallback(name, oldV, newV) {
        this[name] = newV;
    }
}

class SaveableItem extends SpoilerBlockerElement {

}

class SpoilerBlockerList extends HTMLUListElement {
    constructor() {
        super();
        this.items = [];
        this.itemElements = [];

        this.addEventListener('change', this.save.bind(this));
        this.addEventListener('click', this.handleRemoveClick.bind(this));
    }

    add(info) {
        this.items.push(info);
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

        this.listToItems();
        setSetting(name, this.items);
    }

    listToItems() {
        let newItems = [];

        for (const el of this.itemElements) {
            newItems.push(el.serialize());
        }

        this.items = newItems;
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
            let index = this.itemElements.indexOf(li.customElement);
            if (index >= 0) {
                this.itemElements.splice(index, 1);
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
                li.customElement = el;

                el.deserialize(item);
                el.setProperties(item);

                if (helpers.toBool(this.getAttribute('disabled'))) {
                    el.setAttribute('disabled', true);
                }

                this.appendChild(li);
                li.appendChild(el);
                this.itemElements.push(el);
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

    attributeChangedCallback(name, oldV, newV) {
        super.attributeChangedCallback(...arguments);

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

    attributeChangedCallback(name, oldV, newV) {
        super.attributeChangedCallback(...arguments);
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

    get propertiesMap() {
        return {
            'content': 'content'
        }
    }

    get settingsItemClass() {
        return Subscription;
    }

    attributeChangedCallback(name, oldV, newV) {
        super.attributeChangedCallback(...arguments);
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
    }

    render() {
        super.render();

        this.byQSOne('.export-name').innerText = this.content.exportName;

        // update metadata
        // @todo time last updated
        this.byQSOne('.spoilers-count').innerText = this.content.spoilers.length;
        this.byQSOne('.sites-count').innerText = this.content.sites.length;

        // add spoilers
        if (this.getAttributeBool('use-spoilers')) {
            this.byQSOne('.subscription-spoilers').classList.remove('none');

            let spoilers = new SpoilerBlockerList();
            spoilers.setAttribute('list-item-element-name', 'spoiler-item');
            spoilers.setAttribute('disabled', true);
            spoilers.items = this.content.spoilers;
            this.byQSOne('.subscription-spoilers-content').append(spoilers);
        }

        // add sites
        if (this.getAttributeBool('use-sites')) {
            this.byQSOne('.subscription-sites').classList.remove('none');

            let sites = new SpoilerBlockerList();
            sites.setAttribute('list-item-element-name', 'site-item');
            sites.setAttribute('disabled', true);
            sites.items = this.content.sites;
            this.byQSOne('.subscription-sites-content').append(sites);
        }

        // don't let label clicks open summary
        // for (const el of this.querySelectorAll('summary')) {
        for (let el of this.querySelectorAll('.no-click')) {
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
        for (let el of this.byQS('summary')) {
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
}

SubscriptionItem.observedAttributes = ['use-sites', 'use-spoilers', 'url-value', 'disabled'];
customElements.define('subscription-item', SubscriptionItem);