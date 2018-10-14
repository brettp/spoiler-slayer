var $document, blockElement, first_feed_elem_text, incrementBadgeNumber, initialize, initiateSpoilerBlocking, num_feed_elems, searchForAndBlockSpoilers, settings;

first_feed_elem_text = null;

num_feed_elems = null;

this.smaller_font_mode = false;

this.reddit_mode = false;

settings = {
  show_specific_words: true,
  spoiler_words_regex: null,
  destroy_spoilers: false,
  warn_before_reveal: false
};

$document = $(document);

$document.ready(function() {
  return chrome.runtime.sendMessage({
    userPreferencesRequested: true
  }, (function(_this) {
    return function(response) {
      var extra_words_to_block;
      settings.show_specific_words = response.showSpecificWordEnabled;
      settings.destroy_spoilers = response.destroySpoilers;
      settings.warn_before_reveal = response.warnBeforeReveal;
      extra_words_to_block = response.extraWordsToBlock.split(',').map(function(word) {
        return word.trim().escapeRegex();
      }).filter(function(word) {
        return !!word;
      });
      settings.spoiler_words_regex = new RegExp(SPOILER_WORDS_LIST.concat(extra_words_to_block).join('|'), 'i');
      if (response.blockingEnabled) {
        return initialize();
      }
    };
  })(this));
});

incrementBadgeNumber = function() {
  return chrome.runtime.sendMessage({
    incrementBadge: true
  }, (function() {}));
};

initiateSpoilerBlocking = function(selector_string, remove_parent) {
  searchForAndBlockSpoilers(selector_string, true, remove_parent);
  return $document.mousemove(function() {
    return debounce(function() {
      return searchForAndBlockSpoilers(selector_string, false, remove_parent);
    });
  });
};

searchForAndBlockSpoilers = (function(_this) {
  return function(feed_elements_selector, force_update, remove_parent) {
    var $new_feed_elems, last_feed_elem_text, new_last_text, new_length;
    $new_feed_elems = $(feed_elements_selector);
    if (remove_parent) {
      $new_feed_elems = $new_feed_elems.parent();
    }
    if ($new_feed_elems.length === 0) {
      return;
    }
    new_length = $new_feed_elems.length;
    new_last_text = $new_feed_elems.last()[0].textContent;
    if (force_update || (new_length !== num_feed_elems) || (new_last_text !== last_feed_elem_text)) {
      cl("Updating potential spoilers, previously '" + num_feed_elems + "', now '" + new_length + "'.");
      last_feed_elem_text = new_last_text;
      num_feed_elems = new_length;
      return $new_feed_elems.each(function() {
        var matchedSpoiler;
        if (this.className.search(/glamoured/) > -1) {
          return;
        }
        matchedSpoiler = this.textContent.match(settings.spoiler_words_regex);
        if (matchedSpoiler !== null) {
          return blockElement($(this), matchedSpoiler[0]);
        }
      });
    }
  };
})(this);

blockElement = function($element, blocked_word) {
  var $contentWrapper, $info, capitalized_spoiler_words;
  incrementBadgeNumber();
  if (settings.destroy_spoilers) {
    $element.remove();
    return;
  }
  $element.addClass('glamoured');
  $contentWrapper = $('<div class="content-wrapper glamoured-active" />').append($element.children()).appendTo($element);
  capitalized_spoiler_words = blocked_word.capitalizeFirstLetter();
  cl("Found spoiler for: '" + capitalized_spoiler_words + "'.");
  if (settings.show_specific_words) {
    $info = $("<h2 class='spoiler-info " + (this.smaller_font_mode ? 'small' : '') + " " + (this.reddit_mode ? 'redditized' : '') + "'> Spoiler about \"" + capitalized_spoiler_words + "\"</h2>");
  } else {
    $info = $();
  }
  $element.prepend($info);
  return $contentWrapper.on('click', function(ev) {
    var specific_words_for_confirm;
    ev.stopPropagation();
    ev.preventDefault();
    if (settings.warn_before_reveal) {
      specific_words_for_confirm = settings.show_specific_words ? " about '" + capitalized_spoiler_words + "'" : "";
      if (!confirm("Show spoiler" + specific_words_for_confirm + "?")) {
        return;
      }
    }
    $contentWrapper.removeClass('glamoured-active');
    return $info.addClass('revealed');
  });
};

initialize = (function(_this) {
  return function() {
    var url;
    url = window.location.href.toLowerCase();
    if (url.indexOf('facebook') > -1) {
      return initiateSpoilerBlocking(FACEBOOK_FEED_ELEMENTS_SELECTOR);
    } else if (url.indexOf('twitter') > -1) {
      _this.smaller_font_mode = true;
      return initiateSpoilerBlocking(TWITTER_FEED_ELEMENTS_SELECTOR);
    } else if (url.indexOf('news.google') > -1) {
      _this.smaller_font_mode = true;
      return initiateSpoilerBlocking(GOOGLE_NEWS_FEED_ELEMENTS_SELECTOR, true);
    } else if (url.indexOf('reddit.com') > -1 || url.indexOf('127.0.0.1') > -1) {
      _this.reddit_mode = true;
      if (url.search(GOT_SUBREDDITS_REGEX) === -1) {
        return initiateSpoilerBlocking(REDDIT_FEED_ELEMENTS_SELECTOR);
      }
    } else if (url.indexOf('avclub.com') > -1) {
      _this.smaller_font_mode = true;
      return initiateSpoilerBlocking(AVCLUB_FEED_ELEMENTS_SELECTOR);
    } else if (url.indexOf('slack.com') > -1) {
      _this.smaller_font_mode = true;
      return initiateSpoilerBlocking(SLACK_FEED_ELEMENTS_SELECTOR);
    } else if (url.indexOf('feedly.com') > -1) {
      _this.smaller_font_mode = true;
      return initiateSpoilerBlocking(FEEDLY_ELEMENTS_SELECTOR);
    } else if (url.indexOf('plus.google.com') > -1) {
      return initiateSpoilerBlocking(GOOGLE_PLUS_ELEMENTS_SELECTOR);
    } else if (url.indexOf('youtube.com') > -1) {
      _this.smaller_font_mode = true;
      return initiateSpoilerBlocking(YOUTUBE_ELEMENTS_SELECTOR);
    } else if (url.indexOf('buzzfeed.com') > -1) {
      _this.smaller_font_mode = true;
      return initiateSpoilerBlocking(BUZZFEED_ELEMENTS_SELECTOR);
    } else if (url.indexOf('gizmodo.co') > -1) {
      return initiateSpoilerBlocking(GIZMODO_ELEMENTS_SELECTOR);
    } else if (url.indexOf('tumblr.com') > -1) {
      return initiateSpoilerBlocking(TUMBLR_ELEMENTS_SELECTOR);
    }
  };
})(this);
