let list = document.querySelector('ol');
let promptedDefaults = false;
list.classList.add('slideshow');

list.addEventListener('click', async e => {
    if (['H2', 'SMALL'].includes(e.target.nodeName)) {
        return;
    }
    let active = list.querySelector('li.active');

    for (const li of list.querySelectorAll('.spoiler-blocker-selector-preview')) {
        li.classList.remove('spoiler-blocker-selector-preview');
    }
    let next = active.nextElementSibling;

    if (!next) {
        if (!promptedDefaults) {
            promptedDefaults = true;
            if (confirm('Load default settings?')) {
                let defaults = {...Settings.defaultSettings, ...Settings.demoSettings};
                await saveSettings(defaults);
                await cmd('updateSubscriptions');
            }

            window.location = '/options.html';
        }
        return;
    }

    active.classList.remove('active');
    next.classList.add('active');
});

document.body.addEventListener('animationend', e => {
    if (e.target.matches('li.active .stacking > img:last-of-type')) {
        let parent = e.target.parentNode.parentNode;

        parent.classList.remove('active');
        // force redraw
        parent.getClientRects();
        parent.classList.add('active');
    }
});