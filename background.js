const CHANNEL_ID = '146182128',
    CLIENT_ID = 'mufc734wg7hma7lab5tvvmn6i662j4',
    INTERVAL = 1000 * 30, // 30 second interval
    DEFAULT_ICON_PATH = './icons/128.png',
    LIVE_ICON_PATH = './icons/128-green.png';
var soundEffect = new Audio('online.mp3'),
    lastNotification = null;

let currentIconPath = DEFAULT_ICON_PATH;

chrome.notifications.onClicked.addListener(clearNotification);

function clearNotification(notificationId) {
    if (notificationId == 'liveNotification') {
        chrome.tabs.create({
            url: 'https://www.twitch.tv/streamersconnected'
        });
        chrome.notifications.clear(notificationId);
    }
}

function showNotification() {
    var time = /(..)(:..)/.exec(new Date());
    var hour = time[1] % 12 || 12;
    var period = time[1] < 12 ? 'AM' : 'PM';
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

var checkIfLive = function(callback) {
    $.ajax({
        url: 'https://api.twitch.tv/kraken/streams/' + CHANNEL_ID,
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            var isLive = processTwitchResponseSuccess(data);
            if (callback) {
                callback(isLive);
            }
        },
        beforeSend: setHeader
    });
}

function setHeader(xhr) {
    xhr.setRequestHeader('Client-ID', CLIENT_ID);
    xhr.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json');
}

function processTwitchResponseSuccess(channel) {
    var isLive = false;
    if (channel["stream"] !== null) {
        if (JSON.parse(localStorage.isLive) === false) {
            showNotification();
        }
        isLive = true;
    }
    localStorage.isLive = isLive;
    updateIcon();
    return isLive;
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
if (!localStorage.addChatBadges) localStorage.addChatBadges = true;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var response = {};
    for (var i = 0; i < request.items.length; i++) {
        response[request.items[i]] = JSON.parse(localStorage[request.items[i]]);
    }
    sendResponse({
        data: response
    });
});

checkIfLive();