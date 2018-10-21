$siteRow = $("<tr>" +
    "<td><a class='remove-row icon solid'>X</a> <td><input type='text' name='url_regexp' /></td>" +
    "<td><input type='text' name='selector' /></td> </tr>"
);

$spoilerRow = $("<tr>" +
    "<td><a class='remove-row icon solid'>X</a> <td><input type='text' name='spoiler' /></td></tr>"
);

settings.load(function(prefs) {
    var $spoilers = $('#spoilers');
    var $sites = $('#sites');

    updateInputs(prefs.spoilers, $spoilers);
    updateInputs(prefs.sites, $sites);

    $('body').on('change', 'input', function(e) {
        saveSettings();
        // var $table = $(this).parents('table');
        // var settingsName = $table.data('settingsName');
        // if (!settingsName) {
        //     return;
        // }

        // var data = tableToJson($table);

        // if (data) {
        //     settings.set(settingsName, data);
        // }
    });

    $('.new-row').on('click', function(e) {
        var $row = $(this).data('rowType') == 'site' ? $siteRow : $spoilerRow;
        $(this).parents('table').find('tr').first().after($row.clone());
    });

    $('.remove-row').on('click', function(e) {
        $(this).parents('tr').first().remove();
        saveSettings();
    });

    $('#reset-to-default-sites').on('click', function(e) {
        if (!confirm('Are you use you want to reset all sites to the defaults?')) {
            return false;
        }

        settings.set('sites', settings.ogSites);
        prefs.sites = settings.ogSites;
        $sites.find('tr').not(':first').remove();

        updateInputs(settings.ogSites, $sites);
    });


    $('#reset-to-default-spoilers').on('click', function(e) {
        if (!confirm('Are you use you want to reset all spoilers to the defaults?')) {
            return false;
        }

        settings.set('spoilers', settings.ogSpoilers);
        prefs.spoilers = settings.ogSpoilers;
        $spoilers.find('tr').not(':first').remove();

        updateInputs(settings.ogSpoilers, $spoilers);
    });
});

tableToJson = function($table) {
    var data;
    data = [];

    $table.children('tbody').children('tr').each(function(i, tr) {
        var datum, has;
        has = false;
        datum = {};
        $(tr).find('input').each(function(i, input) {
            has = true;
            datum[$(input).attr('name')] = $(input).val();
        });
        if (has) {
            data.push(datum);
        }
    });
    return data;
};

function updateInputs(data, $root) {
    var $row, j, len, datum;

    for (j = 0, len = data.length; j < len; j++) {
        datum = data[j];
        $row = ($root.data('settingsName') == 'sites' ? $siteRow : $spoilerRow).clone();

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
        var data = tableToJson($('#' + section));
        if (data) {
            settings.set(section, data);
        }
    }
}