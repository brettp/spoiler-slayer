var loadUserPreferencesAndUpdate, openOptionsPage, sessionSpoilersBlocked, updateSessionSpoilersBlocked;

sessionSpoilersBlocked = 0;

document.addEventListener('DOMContentLoaded', (function(_this) {
  return function() {
    _this.blockingEnabledToggle = document.getElementById('blocking-enabled-toggle');
    _this.showSpecificWordToggle = document.getElementById('show-specific-word-toggle');
    _this.destroySpoilersToggle = document.getElementById('destroy-spoilers-toggle');
    _this.warnBeforeReveal = document.getElementById('warn-before-reveal-toggle');
    _this.extraWordsHolder = document.getElementById('extra-words-to-block');
    _this.optionsPage = document.getElementById('options-page');
    _this.blockingEnabledToggle.addEventListener('change', storeUserPreferences);
    _this.showSpecificWordToggle.addEventListener('change', storeUserPreferences);
    _this.destroySpoilersToggle.addEventListener('change', storeUserPreferences);
    _this.warnBeforeReveal.addEventListener('change', storeUserPreferences);
    _this.extraWordsHolder.addEventListener('keyup', storeUserPreferences);
    _this.optionsPage.addEventListener('click', openOptionsPage);
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
    return loadUserPreferences(function() {});
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

openOptionsPage = function() {
  if (chrome.runtime.openOptionsPage) {
    return chrome.runtime.openOptionsPage(function() {});
  } else {
    return window.open(chrome.runtime.getURL('options.html'));
  }
};
