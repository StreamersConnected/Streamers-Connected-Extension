var CHANNEL_ID = '146182128',
    CLIENT_ID = 'mufc734wg7hma7lab5tvvmn6i662j4';

$(function() {
    $('.popupchat').click(function() {
        window.open('https://www.twitch.tv/streamersconnected/chat?popout=', 'Streamers Connected Chat', 'width=550,height=800');
    });
    $('.openOptions').click(function() {
        chrome.runtime.openOptionsPage();
    });
});

var liveCheck = function() {
    const bgPage = chrome.extension.getBackgroundPage();
    const check = bgPage.checkIfLive();
    $.get('http://107.170.95.160/live', function(data) {
        if (data['status'] === true) {
            $('.stream-offline').addClass('hidden');
            $('.stream-online').removeClass('hidden');
        } else {
            $('.stream-online').addClass('hidden');
            $('.stream-offline').removeClass('hidden');
        }
    });
};

var setLatestTweetVisibility = function() {
    if (JSON.parse(localStorage.showRecentTweet) === false) {
        $('<style type="text/css">html{height: 125px;}</style>').appendTo('head');
        return;
    }
    $('.tweet-container').removeClass('hidden');
};

document.addEventListener('DOMContentLoaded', function() {
    liveCheck();
    setLatestTweetVisibility();
});