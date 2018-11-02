$siteTpl = $("<tr>" +
    "<td><a class='remove-row'><i class='fa fa-trash fader'></i></a> <td><input autocomplete='off' type='text' name='urlRegex' /></td>" +
    "<td><input type='text' name='selector' /></td> </tr>"
);

$spoilerTpl = $('#spoiler-template').clone().prop('id', '').removeClass('none');
$spoilerTpl.find('input').removeClass('no-auto-save');

let $spoilers = $('#spoilers');
let $sites = $('#sites');
console.log(chrome);

async function init() {
    updateInputsFromSettings();

    $('body').on('change', 'input', function(e) {
        let $input = $(this);
        if ($input.hasClass('no-auto-save')) {
            return;
        }
        saveSettings();
    });

    $('.new-row').on('click', function(e) {
        let $tpl = $(this).data('rowType') == 'site' ? $siteTpl : $spoilerTpl;
        let $row = $tpl.clone();
        $(this).parents('table').find('tr').first().after($row);
        $row.find('input:first').focus();
    });

    $('body').on('change', 'input[name=is-regex]', e => {
        let $this = $(e.target);
        let $inputLabel = $this.parents('label').prev();

        if ($this.prop('checked')) {
            $inputLabel.addClass('is-regex');
        } else {
            $inputLabel.removeClass('is-regex');
        }
    });

    $('body').on('click', '.remove-row', function(e) {
        $(this).parents('tr').first().remove();
        saveSettings();
    });

    $('body').on('click', '.remove-li', function(e) {
        $(this).parents('li').first().remove();
        saveSettings();
    });

    $('#reset-to-default-sites').on('click', function(e) {
        if (!confirm('Are you use you want to reset all sites to the defaults?')) {
            return false;
        }

        setSetting('sites', ogSites);
        $sites.find('tr').not(':first').remove();

        updateInputs(ogSites, $sites);
    });


    $('#reset-to-default-spoilers').on('click', function(e) {
        if (!confirm('Are you use you want to reset all spoilers to the defaults?')) {
            return false;
        }

        let spoilers = ogSpoilers.map(val => {
            return {
                spoiler: val
            };
        });

        setSetting('spoilers', spoilers);
        $spoilers.find('li').not(':first').remove();

        updateInputs(spoilers, $spoilers);
    });

    $('#export').on('click', handleExport);

    $('#import').on('click', async () => {
        $('#file-import').click();
    });

    $('.file-upload').on('submit', handleFileUpload);

    $('body').on('submit', '#new-spoiler', saveNewSpoiler);
    $('body').on('input', '#new-spoiler input[type=text]', checkNewSpoiler);

    // @todo pull out into helpers?
    // remove warning classes on quick adds
    $('body').on('animationend', '.save-flasher', (e) => {
        $(e.target).removeClass('save-fail save-success');
    });

}

init();

async function updateInputsFromSettings() {
    let spoilers = await getSetting('spoilers');
    let sites = await getSetting('sites');

    spoilers.sort((a, b) => {
        if (a.spoiler == 'asdf' || b.spoiler == 'asdf') {
            // debugger;
        }
        console.log("Sorting", a.spoiler, b.spoiler);
        // make empty lines be on top
        if (!a.spoiler || !b.spoiler) {
            return 1;
        }

        let r = a.spoiler.toLowerCase() <= b.spoiler.toLowerCase();
        console.log(r);
    });
    console.log(spoilers);

    updateInputs(spoilers, $spoilers);
    updateInputs(sites, $sites);
}

async function saveNewSpoiler(e) {
    e.preventDefault();
    let data = new FormData(e.target);
    let spoiler = {};

    for (let input of data) {
        switch (input[0]) {
            case 'isRegex':
                spoiler[input[0]] = !!parseInt(input[1]);
                break;

            default:
                spoiler[input[0]] = input[1];
                break;
        }
    }

    if (spoiler.spoiler) {
        let spoilers = await cmd('getSetting', 'spoilers');
        spoilers.push(spoiler);
        await setSetting('spoilers', spoilers);

        updateInputsFromSettings();
    }
}

function checkNewSpoiler(e) {
    let $input = $(e.target);
}

async function handleExport(e) {
    let settings = await cmd('getSettings');
    let exports = {
        sites: settings.sites,
        spoilers: settings.spoilers
    };
    let json = JSON.stringify(exports, null, 2);
    console.log(json);

    let file = new Blob([json], {
        type: "application/json"
    });

    let now = new Date();
    // dates in JS are awful.
    // let filename = now.toISOString().replace('T', '-').replace('Z', ' ').replace(':', );
    let filename = 'Spoiler Settings ' + now.toISOString().split('T')[0];
    var url = URL.createObjectURL(file);

    chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
    });
}

async function handleFileUpload(e) {
    e.preventDefault();
    let $form = $(this);
    let $fileInput = $form.find('input[type=file]');
    let reader = new FileReader();
    let file = e.currentTarget[0].files.item(0);
    var $spoilers = $('#spoilers');
    var $sites = $('#sites');

    reader.readAsBinaryString(file);
    reader.onloadend = async function() {
        let obj = JSON.parse(this.result);
        // @todo validate!
        if (obj.sites) {
            setSetting('sites', obj.sites);
        }

        if (obj.spoilers) {
            setSetting('spoilers', obj.spoilers);
        }

        var s = await getSetting('spoilers');
        updateInputs(s, $spoilers);
        var sites = await getSetting('sites');
        updateInputs(sites, $sites);
    }

    return false;
}

function tableToJson($table) {
    var data = [];

    $table.children('tbody').children('tr').each(function(i, tr) {
        var datum, has;
        has = false;
        datum = {};
        $(tr).find('input').not('.no-auto-save').each(function(i, input) {
            has = true;
            datum[$(input).attr('name')] = $(input).val();
        });
        if (has) {
            data.push(datum);
        }
    });
    return data;
};

function listToJson($list) {
    var data = [];

    $list.children('li').each((i, li) => {
        var datum = {},
            has = false;

        $(li).find('input').not('.no-auto-save').each(function(i, input) {
            has = true;
            datum[$(input).attr('name')] = $(input).val();
        });

        if (has) {
            data.push(datum);
        }
    });
    return data;
}

function updateInputs(data, $root) {
    var $row, j, len, datum;
    if (!data) {
        return;
    }

    for (j = 0, len = data.length; j < len; j++) {
        datum = data[j];
        $row = ($root.data('settingsName') == 'sites' ? $siteTpl : $spoilerTpl).clone();
        $row.removeClass('none').prop('id', '');

        if (typeof datum === 'object') {
            for (var k in datum) {
                $row.find(`[name=${k}]`).val(datum[k]);
            }
        } else {
            $row.find('input').val(datum);
        }

        $root.append($row);
    }
}

function saveSettings() {
    var sections = [
        'spoilers',
        'sites'
    ];

    for (var section of sections) {
        let data, $el = $(`#${section}`);

        switch ($el.prop('tagName')) {
            case 'TABLE':
                data = tableToJson($el);
                break;

            case 'UL':
            case 'OL':
                data = listToJson($el);
                break;

            default:
                data = elementsToJson($el);
        }


        if (data) {
            setSetting(section, data);
        }
    }
}
