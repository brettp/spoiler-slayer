let list = document.querySelector('ol');
list.classList.add('slideshow');

list.addEventListener('click', e => {
    let active = list.querySelector('li.active');
    for (const li of list.querySelectorAll('.spoiler-blocker-selector-preview')) {
        li.classList.remove('spoiler-blocker-selector-preview');
    }
    active.classList.remove('active');
    let next = active.nextElementSibling;

    if (!next) {
        next = list.querySelector('li');
    }

    next.classList.add('active');
});