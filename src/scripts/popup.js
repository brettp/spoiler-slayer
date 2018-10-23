(async function init() {
    let settings = await cmd('getSettings');
    if (!settings) {
        settings = await cmd('getDefaultSettings');
    }

    loadSettings(settings);
    $('body').on('input change', 'input, select', saveSetting);

    // openOptionsPage();
    $('#open-options-page').on('click', openOptionsPage);

    // disable options when needed
    $('body').on('input', '[name=destroySpoilers]', function() {
        $('[name=showSpecificSpoiler], [name=warnBeforeReveal], ' +
                '[name=heavyBlur], [name=hoverBlur], [name=blurSpoilers]')
            .attr('disabled', $(this).prop('checked'));
    });

    $('body').on('input', '[name=blurSpoilers]', function() {
        $('[name=heavyBlur], [name=hoverBlur]').attr('disabled', !$(this).prop('checked'));
    });

    // register quick adds
    $('body').on('click', '#quick-add-site, #quick-add-spoiler', function() {
        console.log('clicked?', $(this).attr('href'));
        $($(this).attr('href')).toggleClass('none');
    });

    $('body').on('submit', '#quick-add-spoiler-form', saveQuickAdd);
})();

function loadSettings(settings) {
    $('input,select').each(function() {
        var $input = $(this);
        var name = $input.prop('name');

        if (settings.hasOwnProperty(name)) {
            if ($input.attr('type') == 'checkbox') {
                $input.prop('checked', settings[name]);
            } else {
                $input.val(settings[name]);
            }
        }
    });

    // disable if needed
    let $destroySpoilers = $('[name=destroySpoilers]');
    $('[name=showSpecificSpoiler], [name=warnBeforeReveal], ' +
            '[name=heavyBlur], [name=hoverBlur], [name=blurSpoilers]')
        .attr('disabled', $destroySpoilers.prop('checked'));

    let $blurSpoilers = $('[name=blurSpoilers]');
    $('[name=heavyBlur], [name=hoverBlur]').attr('disabled', ($destroySpoilers.prop('checked') || !$blurSpoilers.prop('checked')));

    // force setting up styles since the content init func is never called for this page
    setupStyles();
    updateExample();
}

function saveSetting() {
    var $input = $(this);

    if ($input.hasClass('no-auto-save')) {
        return;
    }

    var name = $input.prop('name');
    var val = ($input.attr('type') == 'checkbox') ? $input.prop('checked') : $input.val();

    setSetting(name, val);

    if ($('.spoiler-info').hasClass('revealed') || ($input.attr('type') != 'range' && name != 'blurSpoilers')) {
        updateExample();
    }
}

async function saveQuickAdd(e) {
    e.preventDefault();
    var $this = $(this);
    var $input = $(this).find('input');
    var spoilers = $input.val().trim().split(',');
    var cleaned = [];

    for (let str of spoilers) {
        if (str.trim()) {
            cleaned.push(str.trim());
        }
    }

    if (cleaned.length > 0) {
        var cur = await getSetting('spoilers');

        for (let spoiler of cleaned) {
            cur.unshift({
                'spoiler': spoiler
            });
        }

        setSetting('spoilers', cur);
        $input.addClass('saved-success');
        $this[0].reset();
    } else {
        $input.addClass('saved-fail');
    }

    // remove the class so we can add again if needed
    setTimeout(function() {
        $input.removeClass('saved-fail').removeClass('saved-success');
    }, 1000);

    return false;

}

// settingsx.load(function(stored) {
//     // @todo why the timeout?
//     setTimeout((function() {
//         chrome.runtime.sendMessage({
//             cmd: 'fetch-popup-total'
//         }, function(response) {
//             if (response.newTotal) {
//                 sessionSpoilersBlocked = response.newTotal;
//                 updateSessionSpoilersBlocked();
//             }
//         });
//     }), 1);
// });

async function updateExample() {
    var $exTpl = $('.content-template');
    var $ex = $exTpl.clone().removeClass('content-template').addClass('glamoured');

    console.log("Updating example");
    $('.example').html($ex);

    if (await getSetting('blockingEnabled')) {
        blockElement($ex, 'Dumbledore', await cmd('getSettings'));
    }
}

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