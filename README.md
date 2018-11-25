# Spoilers Slayer
An open-source browser extension to block spoilers.

Originally based on [Game of Spoils](https://github.com/stu-blair/game-of-spoils).

## Differences from Game of Spoils
* Removed superfluous fonts and long-winded block notifications (@todo but you can still enable them if you want).
* Simplified and improved UI
* Improved code readability and maintainability
* Switched to modern ES6 and SCSS


## Installation
@TODO Upload to stores


### Todo
- [X] Dom change events instead of tracking element content
- [X] Slider for opacity
- - [X] Disable animations checkbox
- [X] Quick add spoiler phrase on popup
- [X] Quick add site on popup?
- [ ] New example image
- [X] Less awful advanced settings interface
- - [ ] Better text explaining what to do
- - [X] Checkbox to mark spoilers as regexp
- [ ] On install tutorial
- [ ] Ability to disable on certain sites
- [X] Badge / popup counter for session and lifetime blocks
- - [X] Session badge
- - [X] Page badge
- - - [X] Add upper limit
- - [X] Lifetime badge
- - [X] Add config option
- - [ ] Make not flash when loading a site on the same domain (don't think this is possible)
- - [X] Don't update the badge while searching elements. Update it once at the end.
- - [ ] Don't register onTabChange event unless badge count is site / page based
- [X] Live update for settings changes (use on change event)
- - [X] Live updates for no-fx changes
- [X] Settings import and export
- [ ] Settings import from gists
- [X] Better way to add new site input in settings (tables are too slow for some reason)
- [ ] Opt-in analytics?
- [X] Remove jQuery req
- [ ] Add one-click legacy mode
- [ ] FF mobile?
- [ ] Categorize / tag sites and spoilers to allow export of single collection settings like Harry Potter
- [ ] Sort sites alphabetically
- [X] Don't block if parent has been glamoured and revealed.
- [X] Set global transition-duration time injected as setting, built into injected CSS and then use that value as a timeout to remove revealed and glamoured-active instead of waiting on unreliable animationend / transitionend
- [X] Add "global" mode that blocks full unknown sites if the body text matches any spoilers. (Not needed. Can just use body as the selector.)
- [ ] Don't redraw entire lists when adding / deleting
- [ ] Add flashes to newly added content instead of inputs on options page


### Known Bugs
- [X] Selectors MUST not have plain text nodes or the blocker jumbles the words.
- [X] Example text in popup is slightly off centered
- [X] Hovering over the spoiler text doesn't de-blur the spoiler
- - [X] Neither does clicking on it
- [ ] Popup spoiler blur checkbox has bad spacing in FF
- [ ] Retweeted content has the retweeted username bleed through the no-fx censor
- [X] Sometimes there can be embedded blocked elements
- [X] Reddit's up and down arrows don't change color for glamoured content. Probably need to move all the content back to its real parent on reveal.
- [X] The spoiler info pops out instead of fades on reveal in FF
- [X] position: static elements don't work great

### How to build from source
1. Clone the repo.
2. Run `npm install` to install dependencies.
3. Run `gulp` to setup watches that will automatically compile any changes you make from the `src` dir to the `build` directory.
4. To test the extension, go to the Chrome Extensions tab, click 'Load unpacked extension', and choose the `build` directory.