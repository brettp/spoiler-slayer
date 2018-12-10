let list = document.querySelector('ol');
let promptedDefaults = false;
list.classList.add('slideshow');

list.addEventListener('click', async e => {
    let active = list.querySelector('li.active');
    for (const li of list.querySelectorAll('.spoiler-blocker-selector-preview')) {
        li.classList.remove('spoiler-blocker-selector-preview');
    }
    active.classList.remove('active');
    let next = active.nextElementSibling;

    // loop to first, prompting to set defaults if haven't already
    if (!next) {
        if (!promptedDefaults) {
            promptedDefaults = true;
            if (confirm('Load default settings?')) {
                let defaults = {...Settings.defaultSettings, ...Settings.demoSettings};
                await saveSettings(defaults);
                await cmd('updateSubscriptions');
            }

            helpers.openOptionsPage();
            window.close();
        }
        return;
        // next = list.querySelector('li');
    }

    next.classList.add('active');
});