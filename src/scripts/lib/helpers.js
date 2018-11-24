const d = document;
const byId = d.getElementById.bind(document);
const byQS = d.querySelectorAll.bind(document);
const byQSOne = d.querySelector.bind(document);

var helpers = (function() {
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
        if (!str) {
            return '';
        }

        // have to escape dashes separately because it was doing weird things
        return str.replace(/[\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&').replace('-', '\-');
    }

    function getRegexStr(text, isRegex) {
        if (!text) {
            return '';
        }

        if (isRegex) {
            return text.trim();
        } else {
            return '\\' + 'b' + helpers.escapeRegex(text).trim() + '\\' + 'b';
        }
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
                txt = `{${tmp.join(', ')}}`;
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
        var abbrev = ['k', 'm', 'b', 't'];

        // Go through the array backwards, so we do the largest first
        for (var i = abbrev.length - 1; i >= 0; i--) {
            // Convert array index to "1000", "1000000", etc
            var size = Math.pow(10, (i + 1) * 3);

            // If the number is bigger or equal do the abbreviation
            if (size <= number) {
                // Here, we multiply by decPlaces, round, and then divide by decPlaces.
                // This gives us nice rounding to a particular decimal place.
                number = Math.round((number * decPlaces) / size) / decPlaces;

                // Handle special case where we round up to the next abbreviation
                if (number == 1000 && i < abbrev.length - 1) {
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

    // remove warning classes on quick adds
    function addFlash(el, type) {
        el.addEventListener(
            'animationend', e => {
                el.classList.remove('save-fail');
                el.classList.remove('save-success');
            },
            {once: true}
        );

        el.classList.add(`save-${type}`);
    }

    function getNearest(type, el) {
        while (el) {
            if (el.nodeName === type.toUpperCase()) {
                return el;
            }
            el = el.parentNode;
        }
    }

    return {
        nullFunc: nullFunc,
        debounce: debounce,
        ucWords: ucWords,
        escapeRegex: escapeRegex,
        getRegexStr: getRegexStr,
        describe: describe,
        excerpt: excerpt,
        friendlyNum: friendlyNum,
        addFlash: addFlash,
        getNearest: getNearest,
    };
})();