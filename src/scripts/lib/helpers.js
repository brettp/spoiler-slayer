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

	return {
		nullFunc: nullFunc,
		debounce: debounce,
		ucWords: ucWords,
        escapeRegexp: escapeRegexp,
	};
})();