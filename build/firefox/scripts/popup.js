settings.load(function(stored) {
    console.log("Loaded settings for popup");
    console.log(stored);

    $('input[type=checkbox].popup-setting').each(function() {
        var $input = $(this);
        var name = $input.prop('name');

        if (stored.hasOwnProperty(name)) {
            console.log(`Settings ${name} to ${stored[name]}`);
            $input.prop('checked', stored[name]);
        }
    });

    $('body').on('change', 'input[type=checkbox].popup-setting', function() {
        var $input = $(this);
        var name = $input.prop('name');
        var checked = $input.prop('checked');

        console.log("Got settings changes for");
        console.log($input.attr('name'));
        console.log($input.prop('checked'));

        settings.set(name, checked);
    });

    // openOptionsPage();
    $('#open-options-page').on('click', openOptionsPage);

    // @todo why the timeout?
    setTimeout((function() {
        chrome.runtime.sendMessage({
            cmd: 'fetch-popup-total'
        }, function(response) {
            if (response.newTotal) {
                sessionSpoilersBlocked = response.newTotal;
                updateSessionSpoilersBlocked();
            }
        });
    }), 1);
});

// document.addEventListener('DOMContentLoaded', function() {
//     blockingEnabledToggle = document.getElementById('blocking-enabled-toggle');
//     showSpecificWordToggle = document.getElementById('show-specific-word-toggle');
//     destroySpoilersToggle = document.getElementById('destroy-spoilers-toggle');
//     warnBeforeReveal = document.getElementById('warn-before-reveal-toggle');
//     extraWordsHolder = document.getElementById('extra-words-to-block');
//     optionsPage = document.getElementById('options-page');

//     blockingEnabledToggle.addEventListener('change', storeUserPreferences);
//     showSpecificWordToggle.addEventListener('change', storeUserPreferences);
//     destroySpoilersToggle.addEventListener('change', storeUserPreferences);
//     warnBeforeReveal.addEventListener('change', storeUserPreferences);
//     extraWordsHolder.addEventListener('keyup', storeUserPreferences);
//     optionsPage.addEventListener('click', openOptionsPage);
//     loadUserPreferencesAndUpdate();
// });

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.cmd && request.cmd == newSpoilerBlocked) {
        updateSessionSpoilersBlocked();
    }
});

function updateSessionSpoilersBlocked() {
    $('#num-spoilers-prevented').html(`${sessionSpoilersBlocked} spoilers prevented in this session.`);
}

function openOptionsPage() {
    if (chrome.runtime.openOptionsPage) {
        return chrome.runtime.openOptionsPage(helpers.nullFunc);
    } else {
        return window.open(chrome.runtime.getURL('options.html'));
    }
}