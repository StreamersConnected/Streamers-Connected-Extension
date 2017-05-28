window.addEventListener('load', function() {
    options.isActivated.checked = JSON.parse(localStorage.isActivated)
    options.notificationSoundEnabled.checked = JSON.parse(localStorage.notificationSoundEnabled);
    options.notificationVolume.value = JSON.parse(localStorage.notificationVolume);
    options.showRecentTweet.checked = JSON.parse(localStorage.showRecentTweet);
    options.addChatBadges.checked = JSON.parse(localStorage.addChatBadges);

    options.isActivated.onchange = function() {
        localStorage.isActivated = options.isActivated.checked;
    };

    options.notificationSoundEnabled.onchange = function() {
        localStorage.notificationSoundEnabled = options.notificationSoundEnabled.checked;
    };

    options.notificationVolume.onchange = function() {
        localStorage.notificationVolume = options.notificationVolume.value;
    };

    options.showRecentTweet.onchange = function() {
        localStorage.showRecentTweet = options.showRecentTweet.checked;
    };

    options.addChatBadges.onchange = function() {
        localStorage.addChatBadges = options.addChatBadges.checked;
    };

    var audio = localStorage.getItem('audio');

    if (audio === null) {
        $('#currentSound').text('Current Sound: online.mp3');
    } else {
        $('#currentSound').text('Current Sound: ' + localStorage.getItem('audioName'));
    }

    $('.testNotification').click(function() {
        showTestNotification();
    });

    $('#newSound').change(function() {
        if (!hasExtension('newSound', ['.mp3', '.ogg', '.aac', '.wav', '.aiff', '.pcm', '.wma', '.alac', '.flac'])) {
            window.alert('Invalid file type');
        } else {
            var fileReader = new FileReader;
            fileReader.onload = function() {
                var arrayBuffer = this.result;
                var encodedAudio = arrayBufferToBase64(arrayBuffer);
                localStorage.setItem('audio', encodedAudio);
                var soundPath = newSound.value;
                var audioName = soundPath.replace(/^.*\\/, '');
                localStorage.setItem('audioName', audioName);
                $('#currentSound').text('currentSound: ' + localStorage.getItem('audioName'));
            }
            fileReader.readAsArrayBuffer(this.files[0]);
        }
    });
    reset.onclick = function() {
        localStorage.removeItem('audio');
        localStorage.removeItem('audioName');
        $('#currentSound').text('Current Sound: online.mp3');
    }
});

var showTestNotification = function() {
    var time = /(..)(:..)/.exec(new Date());
    var hour = time[1] % 12 || 12;
    var period = time[1] < 12 ? 'AM' : 'PM';
    if (JSON.parse(localStorage.isActivated) === true) {
        chrome.notifications.create('liveNotification', {
            type: 'basic',
            title: 'Test! (' + hour + time[2] + ' ' + period + ')',
            message: 'Test notification!',
            contextMessage: 'StreamersConnected',
            iconUrl: '../icons/64.png'
        });
    }
    if (JSON.parse(localStorage.notificationSoundEnabled) === true) {
        if (localStorage.getItem('audio') === null) {
            var defaultSound = new Audio('../online.mp3');
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

// Convert ArrayBuffer to Base64.
var arrayBufferToBase64 = function(arrayBuffer) {
    var binary = '';
    var bytes = new Uint8Array(arrayBuffer)
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Convert Base64 to ArrayBuffer.
var base64ToArrayBuffer = function(base64) {
    var binaryString = window.atob(base64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// Convert buffer into audio object.
var createSoundWithBuffer = function(buffer) {
    var context = new AudioContext();
    var audioSource = context.createBufferSource();
    var volumeNode = context.createGain();
    var volume = (localStorage.notificationVolume / 100);
    audioSource.connect(volumeNode);
    volumeNode.connect(context.destination);
    volumeNode.gain.value = (typeof volume == 'undefined' ? 0.50 : volume);
    context.decodeAudioData(buffer, function(res) {
        audioSource.buffer = res;
        audioSource.start(0);
    });
}

// Check for valid audio extensions.
var hasExtension = function(inputID, exts) {
    var fileName = document.getElementById(inputID).value;
    return (new RegExp('(' + exts.join('|').replace(/\./g, '\\.') + ')$')).test(fileName);
};