const CHANNEL_ID = '146182128',
    CLIENT_ID = 'mufc734wg7hma7lab5tvvmn6i662j4',
    INTERVAL = 1000 * 30, // 30 second interval
    DEFAULT_ICON_PATH = './icons/128.png',
    LIVE_ICON_PATH = './icons/128-green.png',
    soundEffect = new Audio('online.mp3'),
    lastNotification = null;

let currentIconPath = DEFAULT_ICON_PATH;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var response = {};
    for (var i = 0; i < request.items.length; i++) {
        response[request.items[i]] = JSON.parse(localStorage[request.items[i]]);
    }
    sendResponse({
        data: response
    });
});

chrome.notifications.onClicked.addListener(function(notificationId) {
    if (notificationId == 'liveNotification') {
        chrome.tabs.create({ url: 'https://www.twitch.tv/streamersconnected' });
        chrome.notifications.clear(notificationId);
    }
});

var showNotification = function() {
    var time = /(..)(:..)/.exec(new Date());
    var hour = time[1] % 12 || 12;
    var period = time[1] < 12 ? 'AM' : 'PM';
    if (((Date.now() - lastNotification) >= (1000 * 60 * 30)) && (lastNotification !== null)) {
        return;
    }
    lastNotification = Date.now();
    if (JSON.parse(localStorage.isActivated) === true) {
        chrome.notifications.create('liveNotification', {
            type: 'basic',
            title: 'Live! (' + hour + time[2] + ' ' + period + ')',
            message: 'Streamers Connected has started streaming.',
            contextMessage: 'Streamers Connected',
            iconUrl: LIVE_ICON_PATH
        });
    }

    if (JSON.parse(localStorage.notificationSoundEnabled) === true) {
        if (localStorage.getItem('audio') === null) {
            var defaultSound = new Audio('online.mp3');
            var volume = (localStorage.notificationVolume / 100);
            defaultSound.volume = (typeof volume == 'undefined' ? 0.50 : volume);
            defaultSound.play();
        } else {
            var encodedAudio = localStorage.getItem('audio');
            var arrayBuffer = base64ToArrayBuffer(encodedAudio);
            createSoundWithBuffer(arrayBuffer);
        }
    }
};

var updateIcon = function() {
    const isLive = JSON.parse(localStorage.isLive) === true;
    const iconPath = isLive ? LIVE_ICON_PATH : DEFAULT_ICON_PATH;
    if (iconPath !== currentIconPath) {
        currentIconPath = iconPath;
        chrome.browserAction.setIcon({
            path: currentIconPath
        });
    }
};

var checkIfLive = function() {
    $.getJSON('https://api.twitch.tv/kraken/streams/' + 'STREAMERSCONNECTED', function(channel) {
        if (!channel["stream"] == null) {
            if (JSON.parse(localStorage.isLive) === false) {
                showNotification();
                localStorage.isLive = true;
            }
        } else {
            localStorage.isLive = false;
        }
        updateIcon();
    });
};

if (window.Notification) {
    setInterval(function() {
        checkIfLive();
    }, INTERVAL);
};

if (!localStorage.isLive) localStorage.isLive = false;
if (!localStorage.isActivated) localStorage.isActivated = true;
if (!localStorage.notificationSoundEnabled) localStorage.notificationSoundEnabled = true;
if (!localStorage.notificationVolume) localStorage.notificationVolume = 50;
if (!localStorage.showRecentTweet) localStorage.showRecentTweet = true;

checkIfLive();