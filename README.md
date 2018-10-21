# Spoiler Slayer
An open-source browser extension to block spoilers.

Originally based on [Game of Spoils](https://github.com/stu-blair/game-of-spoils).

## Differences from Game of Spoils
* Removed superfluous fonts and long-winded block notifications (but you can still enable them if you want).
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
- [ ] Quick add site on popup?
- [ ] New example image
- [ ] Less awful advanced settings interface
- - [ ] Better text explaining what to do
- - [ ] Checkbox to mark spoilers as regexp
- [ ] On install tutorial
- [ ] Disable on certain sites
- [ ] Badge / popup counter for session and lifetime blocks
- [X] Live update for settings changes (use on change event)
- - [X] Live updates for no-fx changes
- [ ] Settings import and export
- [ ] Settings import from gists
- [ ] Better way to add new sites in settings (tables are too slow for some reason)
- [ ] Opt-in analytics?
- [ ] Remove jQuery req?
- [ ] Add one-click legacy mode
- [ ] FF mobile?
- [ ] Disable right click on popup


### Known Bugs
- [X] Example text in popup is slightly off centered
- [X] Hovering over the spoiler text doesn't de-blur the spoiler
- - [X] Neither does clicking on it
- [ ] Retweeted content has the retweeted username bleed through the no-fx censor
- [ ] Sometimes there can be embedded blocked elements

### How to build from source
1. Clone the repo.
2. Run `npm install` to install dependencies.
3. Run `gulp` to setup watches that will automatically compile any changes you make from the `src` dir to the `build` directory.
4. To test the extension, go to the Chrome Extensions tab, click 'Load unpacked extension', and choose the `build` directory.