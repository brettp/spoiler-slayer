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

    function escapeRegex(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    function getSpoilersRegex(spoilers) {
        var spoiler_strs = [];
        if (!spoilers) {
            return false;
        }

        for (let spoiler_info of spoilers) {
            helpers.escapeRegex(spoiler_info.spoiler.trim())

            var spoiler = helpers.escapeRegex(spoiler_info.spoiler.trim());
            if (spoiler) {
                spoiler_strs.push(spoiler);
            }
        }

        if (!spoilers.length > 0) {
            return false;
        }

        return new RegExp(spoiler_strs.join('|'), 'i');
    }

    function describe(obj, limit) {
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

        return limit ? excerpt(txt, limit) : txt;
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

    // yoink: https://stackoverflow.com/questions/2685911/is-there-a-way-to-round-numbers-into-a-reader-friendly-format-e-g-1-1k
    function friendlyNum(number, decPlaces = 0, maxChars = 4) {
        var origNum = number;
        var decPlacesOrig = decPlaces;

        // 2 decimal places => 100, 3 => 1000, etc
        decPlaces = Math.pow(10, decPlaces);

        // Enumerate number abbreviations
        var abbrev = ["k", "m", "b", "t"];

        // Go through the array backwards, so we do the largest first
        for (var i = abbrev.length - 1; i >= 0; i--) {

            // Convert array index to "1000", "1000000", etc
            var size = Math.pow(10, (i + 1) * 3);

            // If the number is bigger or equal do the abbreviation
            if (size <= number) {
                // Here, we multiply by decPlaces, round, and then divide by decPlaces.
                // This gives us nice rounding to a particular decimal place.
                number = Math.round(number * decPlaces / size) / decPlaces;

                // Handle special case where we round up to the next abbreviation
                if ((number == 1000) && (i < abbrev.length - 1)) {
                    number = 1;
                    i++;
                }

                //if the number + added decimal and abbr is < maxChars, run it again adding precision
                if (number.toString().length + 2 < maxChars) {
                    return friendlyNum(origNum, decPlaces++, maxChars);
                }

                // Add the letter for the abbreviation
                number += abbrev[i];

                // We are done... stop
                break;
            }
        }

        return number;
    }
    return {
        nullFunc: nullFunc,
        debounce: debounce,
        ucWords: ucWords,
        escapeRegex: escapeRegex,
        getSpoilersRegex: getSpoilersRegex,
        describe: describe,
        excerpt: excerpt,
        friendlyNum: friendlyNum
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