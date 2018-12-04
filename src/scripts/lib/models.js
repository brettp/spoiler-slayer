class SpoilerBlockerModel {
    static factory(info) {
        let obj = new this();

        for (const prop of this.mappedProps) {
            if (info.hasOwnProperty(prop)) {
                obj[prop] = info[prop];
            }
        }

        return obj;
    }
}

class Site extends SpoilerBlockerModel {
    static get mappedProps() {
        return [
            'urlRegex',
            'selector',
            'isRegex'
        ];
    }
}

class Spoiler extends SpoilerBlockerModel {
    static get mappedProps() {
        return [
            'spoiler',
            'isRegex'
        ];
    }
}

class Subscription extends SpoilerBlockerModel {
    async update() {
        this.lastUpdateAttempt = Date.now();

        try {
            // don't use await here so we can return a value (can't pass promises through msg api)
            let text = await helpers.httpGet(this.rawUrl);
            let remoteInfo = JSON.parse(text);
            this.content = remoteInfo;
            this.lastUpdate = Date.now();
            this.lastUpdateSuccess = true;
            this.lastError = false;

            return true;
        } catch (e) {
            this.lastUpdateSuccess = false;
            this.lastError = e.message ? e.message : e;

            return false;
        }
    }

    set url(url) {
        let newUrl = Subscription.isGitHubRawUrl(url) ? url : Subscription.normalizeUrl(url);

        if (!newUrl) {
            return false;
        }

        Object.defineProperty(this, 'url', {
            configurable: true,
            enumerable: true,
            value: newUrl.toString()
        });
    }

    get rawUrl() {
        return Subscription.normalizeUrl(this.url, true);
    }

    get spoilers() {
        if (!this.content || !this.content.spoilers) {
            return [];
        }

        let spoilers = helpers.objsToModels(this.content.spoilers, 'spoilers');
        Object.defineProperty(this, 'spoilers', {
            value: spoilers,
            enumerable: false
        });

        return spoilers;
    }

    get sites() {
        if (!this.content || !this.content.sites) {
            return [];
        }

        let sites = helpers.objsToModels(this.content.sites, 'sites');
        Object.defineProperty(this, 'sites', {
            value: sites,
            enumerable: false
        });

        return sites;
    }

    get exportName() {
        return this.content && this.content.exportName ? this.content.exportName : 'Unnamed List';
    }

    get comment() {
        return this.content && this.content.comment ? this.content.comment : '';
    }

    static isGitHubRawUrl(url) {
        return (
            /github/.test(url) &&
            (/\/raw\/?$/.test(url) || /\/raw\//.test(url))
        );
    }

    static isSubscribableUrl(url) {
        url = url.toString();
        return (
            (
                /https:\/\/gist\.github\.com/.test(url) ||
                /https:\/\/gist\.githubusercontent\.com/.test(url) ||
                /https:\/\/(www\.)?gitlab\.com\/snippets/.test(url)
            )
            && !/\/edit\/?$/.test(url)
            && (!Subscription.isGitHubRevision(url) || Subscription.isGitHubRawUrl(url))
        );
    }

    /**
     * Can't predict non-raw revision URLs, so they aren't subscribable
     * The URLs for raw revisions require the filename, but the normal URLs don't
     *
     * @param {String} url
     */
    static isGitHubRevision(url) {
        url = new URL(url.toString());

        // must be github
        if (!/github/.test(url.hostname)) {
            return false;
        }

        // ends in /raw, so it's the latest
        // (revision urls require a filename)
        if (/^\/([^\/]+)\/([a-z0-9]+)\/raw\/?$/.test(url.pathname)) {
            return false;
        }

        // is either /brettp/123/456
        // or /brettp/123/raw/456
        return (
            /^\/([^\/]+)\/([a-z0-9]+)\/([a-z0-9]+)\/?$/.test(url.pathname) ||
            /^\/([^\/]+)\/([a-z0-9]+)\/([a-z0-9]+)\/(.+)$/.test(url.pathname)
        );
    }

    static getGitHubCurrentUrl(url) {
        let parts = Subscription.getUrlParts(url);

        let paths = [parts.username, parts.id]
        url = new URL(url.toString());

        return url.protocol + '//' + url.host + '/' + paths.join('/');
    }

    static normalizeUrl(url, raw = false) {
        url = new URL(url.toString().trim());
        if (!Subscription.isSubscribableUrl(url)) {
            return false;
        }

        let paths = [];
        let parts = Subscription.getUrlParts(url);

        if (parts.hostname.includes('github')) {
            if (!parts.username && !parts.id) {
                return false;
            }

            paths = paths.concat([parts.username, parts.id]);

            if (raw) {
                paths.push('raw');
            }

            if (parts.rev) {
                paths.push(parts.rev);
            }

            if (raw && parts.filename) {
                paths.push(parts.filename);
            }
        } else {
            paths = paths.concat(['snippets', parts.id]);
            if (raw) {
                paths.push('raw');
            }
        }

        return url.protocol + '//' + url.host + '/' + paths.join('/');
    }

    static getUrlParts(url) {
        url = new URL(url.toString());
        let parts = {
            hostname: url.hostname
        };

        if (url.hostname.includes('github')) {
            /*
            // base
            https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354

            // raw latest
            https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354/raw

            // revision
            https://gist.github.com/brettp/97b82250323d0b8b3e29e2c833da2354/56c897b62df3f45071f7e343f920167b6c336641

            // raw revision (correct filename is REQUIRED)
            https://gist.githubusercontent.com/brettp/97b82250323d0b8b3e29e2c833da2354/raw/23a931b6806762dca30364b0b984a28a010c805e/Game%2520of%2520Thrones.js
            */

            let rgs = [
                // raw revision
                /\/([a-z0-9]+)\/([a-z0-9]+)\/raw\/([a-z0-9]+)\/(.*)$/,

                // latest raw
                /\/([a-z0-9]+)\/([a-z0-9]+)\/raw\/?/,

                // revision
                /\/([a-z0-9]+)\/([a-z0-9]+)\/([a-z0-9]+)\/?/,

                // latest
                /\/([a-z0-9]+)\/([a-z0-9]+)\/?/,
            ];

            for (const rg of rgs) {
                let matches = rg.exec(url.pathname);
                if (matches) {
                    [, parts.username, parts.id, parts.rev, parts.filename] = matches;
                    break;
                }
            }
        } else if (url.hostname.includes('gitlab')) {
            // gitlab doesn't support snippet history in CE edition as of Dec 2018
            let matches = /snippets\/([0-9]+)\/?/.exec(url.pathname);

            if (matches) {
                parts.id = matches[1];
            }
        }

        return parts;
    }

    static get mappedProps() {
        return [
            'content',
            'url',
            'useSites',
            'useSpoilers',
            'lastUpdate',
            'lastUpdateAttempt',
            'lastUpdateSuccess',
            'lastError',
            'comment'
        ];
    }

    static factory(info) {
        let sub = super.factory(info);

        if (sub.content && sub.content.spoilers) {
            sub.content.spoilers = helpers.objsToModels(sub.content.spoilers, 'spoilers');
        }

        if (sub.content && sub.content.sites) {
            sub.content.sites = helpers.objsToModels(sub.content.sites, 'sites');
        }

        return sub;
    }
}

if (typeof require !== 'undefined') {
    module.exports = {
        Subscription: Subscription,
    }
}