export function getClasses(el) {
    return el.className.split(' ').filter(v => v.trim() !== '');
}

export function setClasses(el, classes) {
    // use a set to make it unique
    // ...except babel doesn't support it.
    // let newClasses = [...new Set(classes)];
    let newClasses = [];
    for (let cls of classes) {
        if (!newClasses.includes(cls)) {
            newClasses.push(cls);
        }
    }

    el.className = newClasses.join(' ');
}

export function addClass(el, cls) {
    let classes = getClasses(el);
    classes.push(cls);
    setClasses(el, classes);
}

export function removeClass(el, cls) {
    let classes = getClasses(el);
    let i = classes.indexOf(cls);

    if (i > 0) {
        classes.splice(i, 1);
        setClasses(el, classes);
    }
}

export function addFlash(el, type = 'fail') {
    el.addEventListener(
        'animationend',
        e => {
            removeClass(el, 'save-fail');
            removeClass(el, 'save-success');
        },
        {once: true}
    );

    addClass(el, `save-${type}`);
}