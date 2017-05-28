var teamMembers = [];
var roles = [];
var CLIENT_ID = 'mufc734wg7hma7lab5tvvmn6i662j4';
const badgeUrl = chrome.extension.getURL("icons/chat-badge-square.png");
const rolesUrl = "https://tempstorage52817.file.core.windows.net/test/roles.txt?st=2017-05-28T18%3A53%3A00Z&se=2017-05-29T18%3A53%3A00Z&sp=r&sv=2015-12-11&sr=f&sig=4kxyP7LsrHuvm1CenW%2B2TDs03nuFp75R%2BB%2Fz5g4xM%2Fs%3D";
var chatCheck = setTimeout(checkChatExists, 5000);
chrome.runtime.sendMessage({
    items: ['addChatBadges']
}, function(response) {
    if (response.data['addChatBadges']) {
        handleChatBadges();
    } else {
        clearTimeout(chatCheck);
    }
});

function handleChatBadges() {
    updateTeamList();
    setTimeout(updateTeamList, 1000 * 60 * 15);
}

function checkChatExists() {
    if ($('.js-chat-messages').length) {
        clearTimeout(chatCheck);
        observeChat();
    }
}

function updateTeamList() {
    $.ajax({
        url: 'https://api.twitch.tv/kraken/teams/streamersconnected',
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            teamMembers = data.users;
        },
        beforeSend: setHeader
    });
    $.ajax({
        url: rolesUrl,
        async: false,
        success: function(data) {
            roles = [];
            rolesRaw = data.split("\n");
            $.each(rolesRaw, function(index, value) {
                if (!value) {
                    return;
                }
                var split = value.split("|");
                var role = {
                    "username": split[0],
                    "role": split[1],
                    "color": split[2]
                }
                roles.push(role)
            });
        }
    });
}

function setHeader(xhr) {
    xhr.setRequestHeader('Client-ID', CLIENT_ID);
    xhr.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json');
}

function observeChat() {
    var target = document.getElementsByClassName('js-chat-messages');
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (!mutation.target) {
                return;
            }
            if (!$(mutation.target).hasClass('message-line')) {
                return;
            }
            if ($(mutation.target).hasClass('sc-team-badge-processed')) {
                return;
            }
            var poster = $(mutation.target).find('.from')[0];
            if (!poster) {
                return;
            }
            var username = poster.textContent;
            if (!username) {
                return;
            }
            if (userInTeam(username)) {
                var useFFZ = $(mutation.target).find('.indicator').length > 0;
                var destination = $(mutation.target).find('.badges');
                var badgeHtml = useFFZ ? getFFZBadgeHtml() : getVanillaBadgeHtml();
                destination.append(badgeHtml);
            }
            var userRole = getRoleForUser(username);
            if (userRole) {
                var shouldFloat = useFFZ ? true : false;
                var roleHtml = getVanillaRoleHtml(userRole, shouldFloat);
                $(roleHtml).insertBefore($(mutation.target).find('.badges'));
            }
            $(mutation.target).addClass('sc-team-badge-processed');
        });
    });
    var config = {
        childList: true,
        subtree: true
    };
    $.each(target, function(index, value) {
        observer.observe(value, config);
    });
}

function userInTeam(username) {
    username = username.toLowerCase();
    return teamMembers.some(function(value) {
        return value.display_name.toLowerCase() == username.toLowerCase();
    });
}

function getRoleForUser(username) {
    username = username.toLowerCase();
    var role = null;
    $.each(roles, function(index, value) {
        if (value.username.toLowerCase() == username) {
            role = value;
        }
    });
    return role;
}

function getVanillaRoleHtml(role, shouldFloat) {
    var html = '<div class="sc-extension-role-title"';
    var styles = [];
    if (shouldFloat) {
        styles.push("float: left;")
    }
    if (role.color) {
        styles.push("background-color:" + role.color + ';');
    }
    if (styles.length > 0) {
        html += ' style="';
        $.each(styles, function(index, value) {
            html += value
        });
        html += '"'
    }
    html += '>' + role.role + '</div>';
    return html;
}

function getFFZBadgeHtml() {
    return '<div class="badge html-tooltip sc-team-ffz" original-title="StreamersConnected Team" style="background: url(\'' + badgeUrl + '\')"></div>';
}

function getVanillaBadgeHtml() {
    return '<span class="balloon-wrapper float-left">' +
        '<a href="https://twitch.amazon.com/prime" rel="noopener noreferrer" target="_blank">' +
        '<img src="' + badgeUrl + '" alt="streamersconnected" class="badge">' +
        '</a>' +
        '<div class="balloon balloon--tooltip balloon--up">StreamersConnected Team</div>' +
        '</span>';
}