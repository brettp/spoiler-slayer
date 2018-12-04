const models = require('./models');

test('isGitHubRevision() finds revision URLs', () => {
    let urls = [
        'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354/23a931b6806762dca30364b0b984a28a010c805e',
        'https://gist.github.com/brettp/0e3e61b22c930b429670ac94de605c57/5681c48ca7a3b06a3dd1d8b56372f47fb39e863a',
        'https://gist.github.com/brettp/0e3e61b22c930b429670ac94de605c57/5681c48ca7a3b06a3dd1d8b56372f47fb39e863a/',
        'https://gist.githubusercontent.com/brettp/0e3e61b22c930b429670ac94de605c57/5681c48ca7a3b06a3dd1d8b56372f47fb39e863a',
        'https://gist.githubusercontent.com/brettp/0e3e61b22c930b429670ac94de605c57/5681c48ca7a3b06a3dd1d8b56372f47fb39e863a/',
        'https://gist.githubusercontent.com/brettp/0e3e61b22c930b429670ac94de605c57/raw/2bdf2137ad5ec584705094482728701e45719ce1/doctor_who.js',
        'https://gist.githubusercontent.com/brettp/0e3e61b22c930b429670ac94de605c57/raw/5681c48ca7a3b06a3dd1d8b56372f47fb39e863a/doctor_who.js',
    ];

    for (const url of urls) {
        expect(models.Subscription.isGitHubRevision(url)).toBe(true);
    }

    urls = [
        'https://gist.githubusercontent.com/brettp/0e3e61b22c930b429670ac94de605c57/raw/',
        'https://google.com',
        'https://gist.github.com/brettp/0e3e61b22c930b429670ac94de605c57/raw'
    ]

    for (const url of urls) {
        expect(models.Subscription.isGitHubRevision(url)).toBe(false);
    }
});

test('Finds subscribable URLs', () => {
    let urls = [
        'https://gist.github.com/brettp/0e3e61b22c930b429670ac94de605c57',
        'https://gist.github.com/brettp/0e3e61b22c930b429670ac94de605c57/',
        'https://gist.github.com/brettp/0e3e61b22c930b429670ac94de605c57/raw',

        // these are subscribable, but the content needs checked on load because the filename must match
        'https://gist.github.com/brettp/0e3e61b22c930b429670ac94de605c57/raw/filename.js',
        'https://gist.githubusercontent.com/brettp/0e3e61b22c930b429670ac94de605c57/raw/5681c48ca7a3b06a3dd1d8b56372f47fb39e863a/doctor_who.js',
        'https://gist.githubusercontent.com/brettp/97b82250323d0b8b3e29e2c833da2354/raw/23a931b6806762dca30364b0b984a28a010c805e/Game%2520of%2520Thrones.js'
    ];

    for (const url of urls) {
        expect(models.Subscription.isSubscribableUrl(url)).toBe(true);
    }
});

test("Doesn't find unsubscribable URLs", () => {
    let urls = [
        'https://gist.github.com/brettp/0e3e61b22c930b429670ac94de605c57/5681c48ca7a3b06a3dd1d8b56372f47fb39e863a',
        'https://gist.github.com/brettp/0e3e61b22c930b429670ac94de605c57/5681c48ca7a3b06a3dd1d8b56372f47fb39e863a/',
        'https://google.com',
        'https://gist.github.com/brettp',
        'https://gitlab.com/users/brett-profitt/snippets'
    ];

    for (const url of urls) {
        expect(models.Subscription.isSubscribableUrl(url)).toBe(false);
    }
});

test('Normalizes URLs', () => {
    let urls = {
        'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354/edit': false,
        'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354': 'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354',
        'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354/': 'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354',
        'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354/raw': 'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354',

        'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354/56c897b62df3f45071f7e343f920167b6c336641':
           false,
        'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354/56c897b62df3f45071f7e343f920167b6c336641/':
            false,

        'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354/raw/56c897b62df3f45071f7e343f920167b6c336641/':
            'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354/56c897b62df3f45071f7e343f920167b6c336641',

        'https://gist.githubusercontent.com/brettp/97b82250323d0b8b3e29e2c833da2354/raw/23a931b6806762dca30364b0b984a28a010c805e/Game%2520of%2520Thrones.js':
            'https://gist.githubusercontent.com/brettp/97b82250323d0b8b3e29e2c833da2354/23a931b6806762dca30364b0b984a28a010c805e',

        'https://gitlab.com/snippets/1783775/edit': false,
        'https://gitlab.com/snippets/1783775/': 'https://gitlab.com/snippets/1783775',
    };

    for(const [url, expected] of Object.entries(urls)) {
        expect(models.Subscription.normalizeUrl(url)).toBe(expected);
    }
});

test('Returns Unnamed List', () => {
    let sub = models.Subscription.factory({
        url: 'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354'
    });

    expect(sub.exportName).toBe('Unnamed List');
});


test('Returns Unnamed List after update', () => {
    let sub = models.Subscription.factory({
        url: 'https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354'
    });

    sub.update();

    expect(sub.exportName).toBe('Unnamed List');
});