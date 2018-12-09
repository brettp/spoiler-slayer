// call this manually first to set early.
var debug = false;

if (chrome.storage) {
    chrome.storage.sync.get(
        {
            debug: false,
        },
        res => {
            debug = res;
        }
    );

    chrome.storage.onChanged.addListener(changes => {
        if (changes.name == 'debug') {
            debug = changes.debug.newValue;
        }
    });
}

async function sendMsg(msg) {
    return new Promise(res => {
        chrome.runtime.sendMessage(msg, ret => {
            res(ret);
        });
    });
};

async function getSetting(name) {
    return await cmd('getSetting', name);
}

async function setSetting(name, val) {
    return await cmd('setSetting', {
        name: name,
        value: val,
    });
}

async function saveSettings(settings) {
    return await cmd('saveSettings', settings);
}

async function cmd(cmd, data) {
    return await msg({
        cmd: cmd,
        data: data,
    });
}

async function msg(msg) {
    if (debug) {
        let stack = new Error().stack.split('\n');
        let newStack = [];
        stack.shift();

        for (let line of stack) {
            if (!/helpers.js/.test(line)) {
                newStack.push(line.trim());
            }
        }
        msg.stack = newStack;
    }

    return sendMsg(msg);
}
