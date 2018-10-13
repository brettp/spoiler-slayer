var loadUserPreferencesAndUpdate, sessionSpoilersBlocked, storeUserPreferences, updateSessionSpoilersBlocked;

sessionSpoilersBlocked = 0;

document.addEventListener('DOMContentLoaded', (function(_this) {
  return function() {
    _this.blockingEnabledToggle = document.getElementById('blocking-enabled-toggle');
    _this.showSpecificWordToggle = document.getElementById('show-specific-word-toggle');
    _this.destroySpoilersToggle = document.getElementById('destroy-spoilers-toggle');
    _this.warnBeforeReveal = document.getElementById('warn-before-reveal-toggle');
    _this.extraWordsHolder = document.getElementById('extra-words-to-block');
    _this.blockingEnabledToggle.addEventListener('change', storeUserPreferences);
    _this.showSpecificWordToggle.addEventListener('change', storeUserPreferences);
    _this.destroySpoilersToggle.addEventListener('change', storeUserPreferences);
    _this.warnBeforeReveal.addEventListener('change', storeUserPreferences);
    _this.extraWordsHolder.addEventListener('keyup', storeUserPreferences);
    loadUserPreferencesAndUpdate();
    return setTimeout((function() {
      return chrome.runtime.sendMessage({
        fetchPopupTotal: true
      }, function(response) {
        if (response.newTotal) {
          sessionSpoilersBlocked = response.newTotal;
          return updateSessionSpoilersBlocked();
        }
      });
    }), 1);
  };
})(this));

loadUserPreferencesAndUpdate = (function(_this) {
  return function() {
    return loadUserPreferences(function() {
      _this.blockingEnabledToggle.checked = _this.userPreferences.blockingEnabled;
      _this.showSpecificWordToggle.checked = _this.userPreferences.showSpecificWordEnabled;
      _this.destroySpoilersToggle.checked = _this.userPreferences.destroySpoilers;
      _this.warnBeforeReveal.checked = _this.userPreferences.warnBeforeReveal;
      return _this.extraWordsHolder.value = _this.userPreferences.extraWordsToBlock;
    });
  };
})(this);

storeUserPreferences = (function(_this) {
  return function() {
    var data;
    data = {};
    data[DATA_KEY] = JSON.stringify({
      blockingEnabled: _this.blockingEnabledToggle.checked,
      showSpecificWordEnabled: _this.showSpecificWordToggle.checked,
      destroySpoilers: _this.destroySpoilersToggle.checked,
      warnBeforeReveal: _this.warnBeforeReveal.checked,
      extraWordsToBlock: _this.extraWordsHolder.value
    });
    cl("Storing user preferences: " + data);
    return chrome.storage.sync.set(data, function(response) {
      return chrome.runtime.sendMessage({
        userPreferencesUpdated: true
      }, (function() {}));
    });
  };
})(this);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.newSpoilerBlocked) {
    sessionSpoilersBlocked += 1;
    return updateSessionSpoilersBlocked();
  }
});

updateSessionSpoilersBlocked = function() {
  var newText;
  newText = sessionSpoilersBlocked + " spoilers prevented in this session.";
  return document.getElementById('num-spoilers-prevented').textContent = newText;
};
