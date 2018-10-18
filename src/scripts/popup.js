settings.load(function(stored) {
    // load settings
    $('input').each(function() {
        var $input = $(this);
        var name = $input.prop('name');

        if (stored.hasOwnProperty(name)) {
            if ($input.attr('type') == 'checkbox') {
                $input.prop('checked', stored[name]);
            } else {
                $input.val(stored[name]);
            }
        }
    });

    // disable if needed
    let $destroySpoilers = $('[name=destroySpoilers]');
    $('[name=showSpecificSpoiler], [name=warnBeforeReveal], ' +
            '[name=heavyBlur], [name=hoverBlur], [name=blurSpoilers]')
        .attr('disabled', $destroySpoilers.prop('checked'));

    console.log("it checked is", $('[name=blurSpoilers]').prop('checked'));
    let $blurSpoilers = $('[name=blurSpoilers]');
    $('[name=heavyBlur], [name=hoverBlur]').attr('disabled', ($destroySpoilers.prop('checked') || !$blurSpoilers.prop('checked')));

    updateExample();

    // save settings
    $('body').on('input', 'input', function() {
        var $input = $(this);
        var name = $input.prop('name');
        var val = ($input.attr('type') == 'checkbox') ? $input.prop('checked') : $input.val();

        settings.set(name, val);

        updateExample();
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

    // disable options when needed
    $('body').on('input', '[name=destroySpoilers]', function() {
        $('[name=showSpecificSpoiler], [name=warnBeforeReveal], ' +
                '[name=heavyBlur], [name=hoverBlur], [name=blurSpoilers]')
            .attr('disabled', $(this).prop('checked'));
    });

    $('body').on('input', '[name=blurSpoilers]', function() {
        $('[name=heavyBlur], [name=hoverBlur]').attr('disabled', !$(this).prop('checked'));
    });
});

function updateExample() {
    var $exTpl = $('.content-template');
    var $ex = $exTpl.clone().removeClass('content-template');

    console.log("Updating example");
    $('.example').html($ex);

    if (settings.get('blockingEnabled')) {
        blockElement($ex, 'Dumbledore');
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