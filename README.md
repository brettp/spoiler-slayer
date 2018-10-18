# Spoiler Slayer
## The Game of Thrones Spoiler Blocker -- an open-source Chrome extension

### Get the current version
@TODO Upload to stores


### Todo
- [X] Dom change events instead of tracking element content
- [X] Slider for opacity
- - [X] Disable animations checkbox
- - [ ] Fix slightly off centered example text
- [ ] Quick add spoiler phrase on popup
- [ ] Less awful advanced settings interface
- - [ ] Better text explaining what to do
- - [ ] Checkbox to mark spoilers as regexp expressions
- [ ] Opt-in analytics?
- [ ] Badge / popup counter for session and lifetime blocks
- [X] Live update for settings changes (use on change event)
- - [ ] Live updates for no-blur changes
- [ ] Settings import and export
- [ ] Settings import from gists
- [ ] Better way to add new sites (tables are too slow for some reason)
- [ ] Remove jQuery req?


### Bugs
- [ ] Hovering over the spoiler text doesn't de-blur the spoiler
- [ ] Retweeted content has the retweeted username bleed through the no-blur censor
- [ ] Sometimes there can be embedded blocked elements

### How to get setup
1. Clone the repo.
2. Run `npm install` to install dependencies.
3. Run `gulp` to setup watches that will automatically compile any changes you make from the `src` dir to the `build` directory.
4. To test the extension, go to the Chrome Extensions tab, click 'Load unpacked extension', and choose the `build` directory.
