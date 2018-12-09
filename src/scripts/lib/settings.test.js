
chrome = {
    storage: {
        onChanged: {
            addListener: jest.fn()
        },
        sync: {
            set: jest.fn(),
            get: jest.fn(e => {
                return {
                    isBlockingEnabled: true,
                    hideTips: true,
                    sites: [
                        getTestObj(Site)
                    ]
                };
            }),
        },
    }
}

helpers = require('./helpers');
const models = require('./models');
Subscription = models.Subscription;
Spoiler = models.Spoiler;
Site = models.Site
Settings = require('./settings').Settings;

function getTestObj(className, data = {}) {
    let def;
    let now = Date.now().toString();

    switch (className) {
        case Spoiler:
            def = {
                isRegex: false,
                spoiler: 'test-spoiler-' + now
            }
            break;

        case Site:
            def = {
                urlRegex: 'test-site-' + now,
                selector: 'test-selector-' + now
            }

        break;

        case Subscription:
            def = {
                url: 'http://test-subscription-url-' + now,
                useSites: true,
                useSpoilers: true,
                content: {
                    sites: [
                        getTestObj(Site)
                    ],
                    spoilers: [
                        getTestObj(Spoiler)
                    ]
                }
            }
        break;
    }

    return className.factory({...def, ...data});
}

test('Spoilers is merged from subs', () => {
    let settings = new Settings({
        subscriptions: [
            Subscription.factory({
                useSpoilers: true,
                content: {
                    spoilers: [{
                        spoiler: 'test-subscription-spoiler'
                    }]
                }
            })
        ],
        spoilers: [
            Spoiler.factory({spoiler: 'test-spoiler'})
        ]
    });

    expect(settings.mergedSpoilers.length).toBe(2);

    expect(settings.mergedSpoilers).toContainEqual(
        Spoiler.factory({spoiler: 'test-spoiler'}),
        Spoiler.factory({spoiler: 'test-subscription-spoiler'})
    );
});

test('Sites is merged from subs', () => {
    let settings = new Settings({
        subscriptions: [
            Subscription.factory({
                useSites: true,
                content: {
                    sites: [{
                        urlRegex: 'test-subscription-site',
                        selector: 'test-subscription-selector'
                    }]
                }
            })
        ],
        sites: [
            Site.factory({
                urlRegex: 'test-site',
                selector: 'test-selector'
            })
        ]
    });

    expect(settings.mergedSites.length).toBe(2);

    expect(settings.mergedSites).toContainEqual(
        Site.factory({
            urlRegex: 'test-site',
            selector: 'test-selector'
        }),
        Site.factory({
            urlRegex: 'test-subscription-site',
            selector: 'test-subscription-selector'
        })
    );
});

test('All spoilers regex does not return all matcher', () => {
    let settings = new Settings({});
    expect(settings.spoilersRegex).toBe(false);
});

test('All sites regex does not return all matcher', () => {
    let settings = new Settings({});
    expect(settings.sitesRegex).toBe(false);
});

test('Spoiler regex updates when new spoiler is added', () => {
    let settings = new Settings({
        spoilers: [
            Spoiler.factory({spoiler: 'test-spoiler'})
        ]
    });

    expect(settings.spoilersRegex).toEqual(/\btest-spoiler\b/iu);

    settings.spoilers.push(Spoiler.factory({
        spoiler: 'new-spoiler'
    }));

    expect(settings.spoilers).toContainEqual(
        Spoiler.factory({spoiler: 'test-spoiler'}),
        Spoiler.factory({spoiler: 'new-spoiler'})
    );

    expect(settings.spoilersRegex).toEqual(/\btest-spoiler\b|\bnew-spoiler\b/iu);
});

test('Site regex updates when new site is added', () => {
    let settings = new Settings({
        sites: [
            Site.factory({urlRegex: 'test-site'})
        ]
    });

    expect(settings.sitesRegex).toEqual(/\btest-site\b/iu);

    settings.sites.push(Site.factory({
        urlRegex: 'new-site'
    }));

    expect(settings.sites).toContainEqual(
        Site.factory({urlRegex: 'test-site'}),
        Site.factory({urlRegex: 'new-site'})
    );

    expect(settings.sitesRegex).toEqual(/\btest-site\b|\bnew-site\b/iu);
});

test('Site and spoilers regex updates when new subscription is added', () => {
    let settings = new Settings({});

    expect(settings.spoilersRegex).toEqual(false);
    expect(settings.sitesRegex).toEqual(false);

    settings.subscriptions.push(Subscription.factory({
        useSpoilers: true,
        useSites: true,
        content: {
            spoilers: [{
                spoiler: 'test-subscription-spoiler'
            }],
            sites: [{
                urlRegex: 'test-subscription-site'
            }]
        }
    }));

    expect(settings.sitesRegex).toEqual(/\btest-subscription-site\b/iu);
    expect(settings.spoilersRegex).toEqual(/\btest-subscription-spoiler\b/iu);
});


test('Real settings matches cached after update', () => {
    let settings = new Settings({});

    settings.subscriptions.push(Subscription.factory({
        useSpoilers: true,
        content: {
            spoilers: [{
                spoiler: 'test-subscription-spoiler'
            }]
        }
    }));

    expect(settings.cached.subscriptions).toContainEqual(Subscription.factory({
        useSpoilers: true,
        content: {
            spoilers: [{
                spoiler: 'test-subscription-spoiler'
            }]
        }
    }));

    expect(settings.cached.subscriptions).toEqual(settings.subscriptions);

    settings.subscriptions.splice(0, 1);

    expect(settings.cached.subscriptions.length).toEqual(0);
});

test('allSettings() returns correctly after change', () => {
    let settings = new Settings({});

    expect(settings.allSettings.subscriptions.length).toEqual(0);

    settings.subscriptions.push(Subscription.factory({
        useSpoilers: true,
        content: {
            spoilers: [{
                spoiler: 'test-subscription-spoiler'
            }]
        }
    }));

    expect(settings.allSettings.subscriptions).toContainEqual(Subscription.factory({
        useSpoilers: true,
        content: {
            spoilers: [{
                spoiler: 'test-subscription-spoiler'
            }]
        }
    }));

    expect(settings.allSettings.subscriptions).toEqual(settings.subscriptions);

    settings.subscriptions.splice(0, 1);

    expect(settings.allSettings.subscriptions.length).toEqual(0);
});


test('Proxied objects proxy', () => {
    let settings = new Settings({});

    expect(settings.subscriptions).toEqual([]);
    expect(settings.cached.subscriptions).toEqual([]);

    settings.subscriptions.push(Subscription.factory({
        useSpoilers: true,
        content: {
            spoilers: [{
                spoiler: 'test-subscription-spoiler'
            }]
        }
    }));

    expect(settings.subscriptions).toContainEqual(Subscription.factory({
        useSpoilers: true,
        content: {
            spoilers: [{
                spoiler: 'test-subscription-spoiler'
            }]
        }
    }));

    expect(settings.cached.subscriptions).toContainEqual(Subscription.factory({
        useSpoilers: true,
        content: {
            spoilers: [{
                spoiler: 'test-subscription-spoiler'
            }]
        }
    }));

    settings.subscriptions.splice(0, 1);

    expect(settings.subscriptions).toEqual([]);
    expect(settings.cached.subscriptions).toEqual([]);
});


test('Setting directly updates cached', () => {
    let settings = new Settings({});

    expect(settings.subscriptions.length).toEqual(0);

    settings.subscriptions = [
        Subscription.factory({
            useSpoilers: true,
            content: {
                spoilers: [{
                    spoiler: 'test-subscription-spoiler'
                }]
            }
        })
    ];

    expect(settings.subscriptions).toContainEqual(Subscription.factory({
        useSpoilers: true,
        content: {
            spoilers: [{
                spoiler: 'test-subscription-spoiler'
            }]
        }
    }));

    expect(settings.cached.subscriptions).toContainEqual(Subscription.factory({
        useSpoilers: true,
        content: {
            spoilers: [{
                spoiler: 'test-subscription-spoiler'
            }]
        }
    }));

    settings.subscriptions = [];

    expect(settings.subscriptions).toEqual([]);
    expect(settings.cached.subscriptions).toEqual([]);
});

test('SSSes are iterable', () => {
    let settings = new Settings({
        spoilers: [
            getTestObj(Spoiler)
        ],
        sites: [
            getTestObj(Site)
        ],
        subscriptions: [
            getTestObj(Subscription)
        ]
    });


    expect(settings.spoilers[Symbol.iterator]).toBeInstanceOf(Function);
    expect(settings.spoilers.length).toBe(1);

    expect(settings.sites[Symbol.iterator]).toBeInstanceOf(Function);
    expect(settings.sites.length).toBe(1);

    expect(settings.subscriptions[Symbol.iterator]).toBeInstanceOf(Function);
    expect(settings.subscriptions.length).toBe(1);
});

// there is not a reliable way to test if an object is a proxy
// test('SSSs are saved as arrays', () => {
//     chrome.storage.sync.set = function(settings) {
//         expect(Array.isArray(settings.subscriptions)).toBeTruthy();
//     }

//     let settings = new Settings();
//     let sub = getTestObj(Subscription);
//     settings.subscriptions = [sub];

//     expect(chrome.storage.sync.set).toHaveBeenLastCalledWith({
//         subscriptions: [
//             sub
//         ]
//     }, helpers.nullFunc);
// });

// test('Factory returns working promise', () => {
//     chrome.storage.sync.get = jest.fn();

//     Settings.factory().then(res => {
//         console.log(res);
//         expect(0).toBe(1);
//         expect(chrome.storage.sync.get).toHaveBeenCalled();
//     })
// });

test('Merged values are updated after native value changes', () => {
    let settings = new Settings();

    expect(settings.mergedSpoilers.length).toBe(0);
    settings.spoilers.push(getTestObj(Spoiler));
    expect(settings.mergedSpoilers.length).toBe(1);

    expect(settings.sites.length).toBe(0);
    settings.sites.push(getTestObj(Site));
    expect(settings.sites.length).toBe(1);
});


test('Merges values if not SS objects', () => {
    let settings = new Settings({
        spoilers: [{
            spoiler: 'test-spoiler'
        }],
        sites: [{
            urlRegex: 'test-site',
            selector: 'test-selector'
        }],
        subscriptions: [{
            url: 'https://test.org',
            useSites: true,
            useSpoilers: true,
            content: {
                spoilers: [{
                    spoiler: 'sub-test-spoiler'
                }],
                sites: [{
                    urlRegex: 'sub-test-site',
                    selector: 'sub-test-selector'
                }]
            }
        }]
    });

    expect(settings.mergedSpoilers).toEqual([
        {spoiler: 'test-spoiler'},
        {spoiler: 'sub-test-spoiler'}
    ]);

    expect(settings.mergedSites).toEqual([
        {
            urlRegex: 'test-site',
            selector: 'test-selector'
        },
        {
            urlRegex: 'sub-test-site',
            selector: 'sub-test-selector'
        }
    ]);
});

test('Splice clears cache', () => {
    let settings = new Settings({
        debug: true,
        spoilers: [
            {spoiler: 'test-spoiler'},
            {spoiler: 'test-spoiler-2'},
            {spoiler: 'test-spoiler-3'}
        ],
        sites: [{
            urlRegex: 'test-site',
            selector: 'test-selector'
        }],
        subscriptions: [{
            url: 'https://test.org',
            useSites: true,
            useSpoilers: true,
            content: {
                spoilers: [{
                    spoiler: 'sub-test-spoiler'
                }],
                sites: [{
                    urlRegex: 'sub-test-site',
                    selector: 'sub-test-selector'
                }]
            }
        }]
    });

    // one from the middle
    settings.spoilers.splice(1, 1);

    expect(settings.mergedSpoilers.length).toBe(3);
    expect(settings.spoilersRegex).toEqual(
        /\btest-spoiler\b|\btest-spoiler-3\b|\bsub-test-spoiler\b/iu
    );

    // set to empty
    settings.spoilers.splice(0, 2);

    expect(settings.mergedSpoilers.length).toBe(1);
    expect(settings.spoilersRegex).toEqual(
        /\bsub-test-spoiler\b/iu
    );

    // remove sub
    settings.subscriptions.splice(0, 1);

    expect(settings.mergedSpoilers.length).toBe(0);
    expect(settings.spoilersRegex).toBeFalsy();

    expect(settings.mergedSites.length).toBe(1);
    expect(settings.sitesRegex).toEqual(
        /\btest-site\b/iu
    );

    settings.sites.splice(0, 1);
    expect(settings.mergedSites.length).toBe(0);
    expect(settings.sitesRegex).toBeFalsy();

});

test('Can add :not() to selectors', () => {
    let add = Settings.addNotToSelector;
    expect(add('.classname',  '.bad-class'))
        .toEqual('.classname:not(.bad-class)');

    expect(add('.classname, .and-another', '.bad-class'))
        .toEqual('.classname:not(.bad-class),.and-another:not(.bad-class)');

    expect(add('.classname:not(already-has-a-not)', '.bad-class'))
        .toEqual('.classname:not(already-has-a-not):not(.bad-class)');

    expect(add('[data-gonna-break="asdf,fdsa"]', '.bad-class'))
        .toEqual('[data-gonna-break="asdf,fdsa"]:not(.bad-class)');

    expect(add('["name"=\'asdf,fdsa\']', '.bad-class'))
        .toEqual('["name"=\'asdf,fdsa\']:not(.bad-class)');

    expect(add('[data-gonna-break="asdf,fdsa"],[name="gonna-work"]', '.bad-class'))
        .toEqual('[data-gonna-break="asdf,fdsa"]:not(.bad-class),[name="gonna-work"]:not(.bad-class)');

    expect(add('[data-gonna-break=\'asdf,fdsa\'],[name=\'gonna-work\']', '.bad-class'))
        .toEqual('[data-gonna-break=\'asdf,fdsa\']:not(.bad-class),[name=\'gonna-work\']:not(.bad-class)');

    expect(add('[data-gonna-break="asdf,fdsa"],[name=\'gonna-work\']', '.bad-class'))
        .toEqual('[data-gonna-break="asdf,fdsa"]:not(.bad-class),[name=\'gonna-work\']:not(.bad-class)');
});