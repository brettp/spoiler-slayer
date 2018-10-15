# Ensures that a function called repeatedly only occurs a max of every 150 milliseconds
# (Used for checking for spoilers as the user scrolls)
debounce_timeout = null
debounce = (fn_to_debounce) ->
  return unless debounce_timeout == null
  debounce_timeout = setTimeout (->
    fn_to_debounce()
    debounce_timeout = null
  ), 150

# Pure-javascript (no jQuery) method of detecting if an element has a certain class
hasClass = (element, className) ->
  if element.classList
    element.classList.contains className
  else
    !!element.className.match(new RegExp("(\\s|^)#{className}(\\s|$)"))

# Pure-javascript (no jQuery) method of add a class to an element
addClass = (element, className) ->
  if element.classList
    element.classList.add className
  else unless hasClass(element, className)
    element.className += " #{className}"

String::capitalizeFirstLetter = ->
  @charAt(0).toUpperCase() + @slice(1)

String::escapeRegex = ->
  @.replace /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"

# Loads user preferences from chrome storage, setting default values
# if any preferences are undefined
loadUserPreferences = (callback) =>
   chrome.storage.sync.get null, (result) =>
      cl result
    callback() if callback


storeUserPreferences = =>
  settings = {
    blockingEnabled: @blockingEnabledToggle.checked
    showSpecificWordEnabled: @showSpecificWordToggle.checked
    destroySpoilers: @destroySpoilersToggle.checked
    warnBeforeReveal: @warnBeforeReveal.checked
    extraWordsToBlock: @extraWordsHolder.value,
  }
  cl "Storing user preferences: #{settings}"
  chrome.storage.sync.set settings, (response) ->
    chrome.runtime.sendMessage { userPreferencesUpdated: true }, (->)

# --------------------------------------- #
# Debugging
# --------------------------------------- #

# Change this to 'true' to enable debugging output
GAME_O_SPOILERS_DEBUG_MODE = true

if GAME_O_SPOILERS_DEBUG_MODE
  log_timeout = undefined
  $('body').append '<div class="debug-floaty-thingy" ></div>'
  $log = $('body > .debug-floaty-thingy')

cl = (log_line) ->
  return unless GAME_O_SPOILERS_DEBUG_MODE
  console.log log_line
  $log.text log_line
  $log.addClass 'show'
  clearTimeout log_timeout
  log_timeout = setTimeout((->
    $log.removeClass 'show'
  ), 2000)


