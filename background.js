var BlinkUrl = 'http://cogdev.net/blink/';
var socket = io.connect('http://promoblink.herokuapp.com');

setInterval(function(){
    if(!socket.socket.connected && !socket.socket.connecting && !socket.socket.reconnecting) {
        socket.socket.connect();
    }    
}, 5000);

var chime = new Audio('chime.mp3');

var find_or_make_tab = function(url_suffix) {
    chrome.tabs.getAllInWindow(null, function(tabs){
        //find the first blink tab, switch to it
        for (var i=0; i < tabs.length; i++) {
            if(tabs[i].url.indexOf(BlinkUrl) === 0) {
                
                chrome.tabs.update(tabs[i].id, {selected: true});

                if(!url_suffix || typeof url_suffix == 'undefined') {
                    chrome.tabs.reload(tabs[i].id);
                } else {
                    chrome.tabs.update(tabs[i].id, {
                        url: blinkUrl + url_suffix
                    });
                }
                
                return;
            }
        }

        // "ill take a tab" - Homer
        if (!url_suffix || typeof url_suffix == 'undefined') {
            chrome.tabs.create({url: BlinkUrl });
        } else {
            chrome.tabs.create({url: BlinkUrl + url_suffix });
        }
    });
}

socket.on('seen', function(data){
    if (!!localStorage.getItem(data.url)) return;

    var prize_name = data.prize.name;

    if (data.prize.qty > 1) {
        prize_name = data.prize.qty + 'x ' + data.prize.name;
    } 

    if (data.prize.image_url.indexOf("//image.eveonline.com") !== 0)  {
        data.prize.image_url = chrome.extension.getURL('package_128.png');
    } else {
        data.prize.image_url = "http:" + data.prize.image_url;
    }

    var description = data.prize.description;

    if (typeof data.prize.jita_price == 'number') {
        description += "\nestimated Jita value: " + (data.prize.jita_price * data.prize.qty).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ISK';
    }
    
    var notification = {
        type: 'basic',
        title: prize_name,
        message: description,
        iconUrl: data.prize.image_url,
        isClickable: true
    }

    chrome.notifications.create(data.blink_id + '', notification, function(blink_id){});
    chime.play();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == 'seen')  {
        if(!localStorage.getItem(request.value.url)) {
            localStorage.setItem(request.value.url, JSON.stringify(request.value));
        }
    }
/*
    if (request.method  == 'hng') {
        socket.emit('seen', request.value);
    }
*/
    sendResponse({});
});

chrome.browserAction.onClicked.addListener(function(activeTab) {
    if(activeTab.url.indexOf(BlinkUrl) === 0) {
        chrome.tabs.update(activeTab.id, {
            url: BlinkUrl + '?act=home'
        });
    } else {
        find_or_make_tab();
    }
});

chrome.notifications.onClicked.addListener(function(blink_id){
    find_or_make_tab('?act=home#blink_' + blink_id);
});

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (details.method !== 'POST') return;

        var promo_data = localStorage.getItem(details.url);

        try {
            promo_data = JSON.parse(promo_data);
            if(!!promo_data) {
                socket.emit('seen', promo_data);
            }
        } catch (e) { console.log(e); }

    },
    {
        urls: ["*://cogdev.net/*", "*://*.cogdev.net/*"]
    }
);
