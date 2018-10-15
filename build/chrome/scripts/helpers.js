var $log, GAME_O_SPOILERS_DEBUG_MODE, addClass, cl, debounce, debounce_timeout, hasClass, loadUserPreferences, log_timeout, storeUserPreferences;

debounce_timeout = null;

debounce = function(fn_to_debounce) {
  if (debounce_timeout !== null) {
    return;
  }
  return debounce_timeout = setTimeout((function() {
    fn_to_debounce();
    return debounce_timeout = null;
  }), 150);
};

hasClass = function(element, className) {
  if (element.classList) {
    return element.classList.contains(className);
  } else {
    return !!element.className.match(new RegExp("(\\s|^)" + className + "(\\s|$)"));
  }
};

addClass = function(element, className) {
  if (element.classList) {
    return element.classList.add(className);
  } else if (!hasClass(element, className)) {
    return element.className += " " + className;
  }
};

String.prototype.capitalizeFirstLetter = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.escapeRegex = function() {
  return this.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

loadUserPreferences = (function(_this) {
  return function(callback) {
    chrome.storage.sync.get(null, function(result) {
      return cl(result);
    });
    if (callback) {
      return callback();
    }
  };
})(this);

storeUserPreferences = (function(_this) {
  return function() {
    var settings;
    settings = {
      blockingEnabled: _this.blockingEnabledToggle.checked,
      showSpecificWordEnabled: _this.showSpecificWordToggle.checked,
      destroySpoilers: _this.destroySpoilersToggle.checked,
      warnBeforeReveal: _this.warnBeforeReveal.checked,
      extraWordsToBlock: _this.extraWordsHolder.value
    };
    cl("Storing user preferences: " + settings);
    return chrome.storage.sync.set(settings, function(response) {
      return chrome.runtime.sendMessage({
        userPreferencesUpdated: true
      }, (function() {}));
    });
  };
})(this);

GAME_O_SPOILERS_DEBUG_MODE = true;

if (GAME_O_SPOILERS_DEBUG_MODE) {
  log_timeout = void 0;
  $('body').append('<div class="debug-floaty-thingy" ></div>');
  $log = $('body > .debug-floaty-thingy');
}

cl = function(log_line) {
  if (!GAME_O_SPOILERS_DEBUG_MODE) {
    return;
  }
  console.log(log_line);
  $log.text(log_line);
  $log.addClass('show');
  clearTimeout(log_timeout);
  return log_timeout = setTimeout((function() {
    return $log.removeClass('show');
  }), 2000);
};
