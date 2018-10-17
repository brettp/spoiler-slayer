# Spoiler Slayer
## The Game of Thrones Spoiler Blocker -- an open-source Chrome extension

### Get the current version
@TODO Upload to stores


### Todo
- [X] Dom change events instead of tracking element content
- [ ] Slider for opacity and to disable animations
- [ ] Less awful advanced settings interface
- - [ ] Better text explaining what to do
- - [ ] Checkbox to mark spoilers as regexp expressions
- [ ] Opt-in analytics?
- [ ] Badge / popup counter for session and lifetime blocks
- [ ] Live update for settings changes (use on change event)
- [ ] Settings import and export
- [ ] Settings import from gists
- [ ] Better way to enter sites (tables are too slow for some reason)
- [ ] Remove jQuery req?


### Bugs
- [ ] Hovering over the spoiler text doesn't de-blur the spoiler
- [ ]

### How to get setup
1. Clone the repo.
2. Run `npm install` to install dependencies.
3. Run `gulp` to setup watches that will automatically compile any changes you make from the `src` dir to the `build` directory.
4. To test the extension, go to the Chrome Extensions tab, click 'Load unpacked extension', and choose the `build` directory.
