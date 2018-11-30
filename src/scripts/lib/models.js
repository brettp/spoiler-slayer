class SpoilerBlockerModel {
    static factory(info) {
        let obj = new this();

        for (const prop of this.mappedProps) {
            obj[prop] = info[prop];
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
        if (url && url[url.length - 1] != '/') {
            url += '/';
        }

        Object.defineProperty(this, 'url', {
            configurable: true,
            enumerable: true,
            value: url
        });
    }

    get rawUrl() {
        return this.url + 'raw';
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
            'lastError'
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