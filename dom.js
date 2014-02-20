// 720 no sc0pe, get rekt skrub
(function($){

    var form = $('form.blink_form.featured.blink');

    if (form.length === 1) {
        var form_match = form.attr('id').match('_(.*?)$');
        var action_match = form.attr('action').match('^\/blink\/(.+?)\/buy');

        if (form_match.length === 2 && action_match.length === 2) {

            if(form_match[1] === action_match[1]) {
                // it appears we probably have a promo.
                var promo_blink_id = form_match[1];

                // send off its necessary data to the plugin
                var prize_name = form.find('#promo_description h2').text().trim();
                var qty_match = prize_name.match('^(\\d) &times; (.*?)$');

                if(!!qty_match && qty_match.length === 3) {
                    var qty = qty_match[1];
                    var prize_name = qty_match[2];
                } else {
                    var qty = 1;
                }

                var blink_data = {
                    url: 'http://cogdev.net' + form.attr('action'),
                    blink_id: promo_blink_id,
                    prize: {
                        name: prize_name,
                        qty: qty,
                        description: form.find('#promo_description div.span-10').text().trim(),
                        image_url: form.find('#promo_description img').attr('src')
                    }
                }

                chrome.runtime.sendMessage({method: "seen", value: blink_data }, function(response){});
            }
        }

    }
})(jQuery);
