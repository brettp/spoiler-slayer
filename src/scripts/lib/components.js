class RegexInput extends HTMLElement {
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

        // emit events for input changes
        this.textInput.addEventListener('change', this.fireOnInput.bind(this));
        this.checkboxInput.addEventListener('change', this.fireOnInput.bind(this));
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
        if (isRegex === undefined || !isRegex) {
            this['is-regex'] = false;
            return;
        }
        let str = isRegex.toString();
        this['is-regex'] = str == 'true' || str == 1 ? true : false;
        this.classList.toggle('is-regex', this['is-regex']);
        if (this['is-regex']) {
            this.checkboxInput.setAttribute('checked', true);
        } else {
            this.checkboxInput.removeAttribute('checked');
        }
    }

    fireOnInput() {
        var e = new CustomEvent('change', {bubbles: true, cancelable: true});
        return this.dispatchEvent(e);
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
        }
    }
}

RegexInput.observedAttributes = ['is-regex', 'value', 'name'];
customElements.define('regex-input', RegexInput);