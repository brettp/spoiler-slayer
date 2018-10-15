first_feed_elem_text = null
num_feed_elems       = null
@smaller_font_mode   = false
@reddit_mode         = false
settings =
  show_specific_words: true
  spoiler_words_regex: null
  destroy_spoilers:    false
  warn_before_reveal:  false
$document = $(document)

$document.ready ->
  chrome.runtime.sendMessage { userPreferencesRequested: true }, (response) =>
    settings.show_specific_words  = response.showSpecificWordEnabled
    settings.destroy_spoilers     = response.destroySpoilers
    settings.warn_before_reveal   = response.warnBeforeReveal
    extra_words_to_block = response.extraWordsToBlock
                                   .split(',')
                                   .map((word) -> word.trim().escapeRegex())
                                   .filter((word) -> !!word)
    settings.spoiler_words_regex = new RegExp(SPOILER_WORDS_LIST.concat(extra_words_to_block).join('|'), 'i')
    initialize() if response.blockingEnabled


incrementBadgeNumber = ->
  chrome.runtime.sendMessage { incrementBadge: true }, (->)


initiateSpoilerBlocking = (selector_string, remove_parent) ->
  searchForAndBlockSpoilers selector_string, true, remove_parent
  $document.mousemove ->
    debounce -> searchForAndBlockSpoilers(selector_string, false, remove_parent)


searchForAndBlockSpoilers = (feed_elements_selector, force_update, remove_parent) =>
  $new_feed_elems = $(feed_elements_selector)
  $new_feed_elems = $new_feed_elems.parent() if remove_parent
  return if $new_feed_elems.length == 0
  new_length    = $new_feed_elems.length
  new_last_text = $new_feed_elems.last()[0].textContent
  if force_update || (new_length != num_feed_elems) || (new_last_text != last_feed_elem_text)
    cl "Updating potential spoilers, previously '#{num_feed_elems}', now '#{new_length}'."
    last_feed_elem_text = new_last_text
    num_feed_elems      = new_length
    $new_feed_elems.each ->
      # Ignore elements that are already glamoured or already designated safe
      return if @className.search(/glamoured/) > -1
      # Search textContent of the element to see if it contains any spoilers
      matchedSpoiler = @textContent.match settings.spoiler_words_regex
      if matchedSpoiler != null
        blockElement $(this), matchedSpoiler[0]

blockElement = ($element, blocked_word) ->
  incrementBadgeNumber()
  if settings.destroy_spoilers
    $element.remove()
    return

  # track the items we already looked at
  $element.addClass 'glamoured'

  # move all content into a new div so we can blur
  # but keep the info text clear without doing silly stuff
  $contentWrapper = $('<div class="content-wrapper glamoured-active" />')
  .append($element.children())
  .appendTo($element)

  #$($('.thing')[7]).addClass('asdf'); $('#header').append($('.asdf')); $('.asdf').css('filter'); $('.asdf').addClass('glamoured-active')
  #h = $('#header'); c = $('.link.thing').not('.glamoured').first().addClass('glamoured'); w = $('<div>'); c.prepend(w); w.append(c.children()); w.css('blur', ''); setTimeout( function() { w.addClass('glamoured-active') });

  capitalized_spoiler_words = blocked_word.capitalizeFirstLetter()
  cl "Found spoiler for: '#{capitalized_spoiler_words}'."

  if settings.show_specific_words
    $info = $("<h2 class='spoiler-info #{if @smaller_font_mode then 'small' else ''} #{if @reddit_mode then 'redditized' else ''}'>
              Spoiler about \"#{capitalized_spoiler_words}\"</h2>")
  else
    $info = $()

  # force read CSS value to make transition work
  # $info.css('opacity');
  $element.prepend($info)

  $contentWrapper.on 'click', (ev) ->
    ev.stopPropagation()
    ev.preventDefault()

    if settings.warn_before_reveal
      specific_words_for_confirm = if settings.show_specific_words then " about '#{capitalized_spoiler_words}'" else ""
      return unless confirm "Show spoiler#{specific_words_for_confirm}?"

    $contentWrapper.removeClass 'glamoured-active'
    $info.addClass 'revealed'

# Initialize page-specific spoiler-blocking, if page is supported
initialize = =>
  url = window.location.href.toLowerCase()

  for info in SELECTORS
    cl info
    if new RegExp(info.regexp).test(url)
      initiateSpoilerBlocking info.selector
      return

  return

  if url.indexOf('facebook') > -1
    initiateSpoilerBlocking FACEBOOK_FEED_ELEMENTS_SELECTOR

  else if url.indexOf('twitter') > -1
    @smaller_font_mode = true
    initiateSpoilerBlocking TWITTER_FEED_ELEMENTS_SELECTOR

  else if url.indexOf('news.google') > -1
    @smaller_font_mode = true
    initiateSpoilerBlocking GOOGLE_NEWS_FEED_ELEMENTS_SELECTOR, true

  else if url.indexOf('reddit.com') > -1 || url.indexOf('127.0.0.1') > -1
    @reddit_mode = true
    if url.search(GOT_SUBREDDITS_REGEX) == -1
      initiateSpoilerBlocking REDDIT_FEED_ELEMENTS_SELECTOR

  else if url.indexOf('avclub.com') > -1
    @smaller_font_mode = true
    initiateSpoilerBlocking AVCLUB_FEED_ELEMENTS_SELECTOR

  else if url.indexOf('slack.com') > -1
    @smaller_font_mode = true
    initiateSpoilerBlocking SLACK_FEED_ELEMENTS_SELECTOR

  else if url.indexOf('feedly.com') > -1
    @smaller_font_mode = true
    initiateSpoilerBlocking FEEDLY_ELEMENTS_SELECTOR

  else if url.indexOf('plus.google.com') > -1
    initiateSpoilerBlocking GOOGLE_PLUS_ELEMENTS_SELECTOR

  else if url.indexOf('youtube.com') > -1
    @smaller_font_mode = true
    initiateSpoilerBlocking YOUTUBE_ELEMENTS_SELECTOR

  else if url.indexOf('buzzfeed.com') > -1
    @smaller_font_mode = true
    initiateSpoilerBlocking BUZZFEED_ELEMENTS_SELECTOR

  else if url.indexOf('gizmodo.co') > -1
    initiateSpoilerBlocking GIZMODO_ELEMENTS_SELECTOR

  else if url.indexOf('tumblr.com') > -1
    initiateSpoilerBlocking TUMBLR_ELEMENTS_SELECTOR