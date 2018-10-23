// call this manually first to set early.
var debug = false;
chrome.storage.sync.get({
    debug: false
}, res => {
    debug = res;
});

chrome.storage.onChanged.addListener(changes => {
    if (changes.name == 'debug') {
        debug = changes.debug.newValue;
    }
});

helpers = (function() {
    var nullFunc = function() {};

    // thanks, lodash
    function debounce(func, wait, immediate) {
        var timeout;
        wait = wait || 150;

        return function() {
            var context = this,
                args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    function ucWords(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function escapeRegexp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    function getSpoilersRegexp(spoilers) {
        var spoiler_strs = [];
        if (!spoilers) {
            return false;
        }

        for (let spoiler_info of spoilers) {
            helpers.escapeRegexp(spoiler_info.spoiler.trim())

            var spoiler = helpers.escapeRegexp(spoiler_info.spoiler.trim());
            if (spoiler) {
                spoiler_strs.push(spoiler);
            }
        }

        if (!spoilers.length > 0) {
            return false;
        }

        return new RegExp(spoiler_strs.join('|'), 'i');
    }

    function describe(obj) {
        let txt;
        let tmp = [];

        switch (true) {
            case obj === undefined:
                txt = 'undefined';
                break;
            case obj === null:
                txt = 'null';
                break;
            case Array.isArray(obj):
                for (let info of obj) {
                    tmp.push(`${describe(info)}`);
                }
                txt = `[${tmp.join(', ')}]`;
                break;
            case typeof obj === 'object':
                for (let name in obj) {
                    let val = describe(obj[name]);
                    tmp.push(`${name}: ${val}`);
                }
                txt = `{${tmp.join(", ")}}`;
                break;
            case typeof obj.toString === 'function':
                txt = obj.toString();
                break;
            default:
                txt = '[unknown]';
                break;
        }

        return txt;
    }

    function excerpt(obj, limit, elsp) {
        elsp = elsp || '…';

        let text = describe(obj);

        if (text.length <= limit) {
            return text;
        } else {
            text = text.substr(0, limit - elsp.length) + elsp;
        }
        return text;
    }

    return {
        nullFunc: nullFunc,
        debounce: debounce,
        ucWords: ucWords,
        escapeRegexp: escapeRegexp,
        getSpoilersRegexp: getSpoilersRegexp,
        describe: describe,
        excerpt: excerpt,
    };
})();


async function getSetting(name) {
    return cmd('getSetting', name);
}

async function setSetting(name, val) {
    return cmd('setSetting', {
        name: name,
        value: val
    })
}

async function cmd(cmd, data) {
    return msg({
        cmd: cmd,
        data: data
    });
}

async function msg(msg) {
    if (debug) {
        let stack = (new Error()).stack.split("\n");
        let newStack = [];
        stack.shift();

        for (let line of stack) {
            if (!/helpers.js/.test(line)) {
                newStack.push(line.trim());
            }
        }
        msg.stack = newStack;
    }
    return new Promise(res => {
        chrome.runtime.sendMessage(msg, (ret) => {
            res(ret);
        });
    });
}