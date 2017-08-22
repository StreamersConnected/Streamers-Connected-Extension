var teamMembers = [];
var roles = [];
var CLIENT_ID = 'mufc734wg7hma7lab5tvvmn6i662j4';
const badgeUrl = chrome.extension.getURL("icons/chat-badge-square.png");
const rolesUrl = "https://extension.streamersconnected.tv/roles.txt";

console.log('SC EXTENSION: Starting');
updateTeamList();
var chatCheck = setInterval(checkChatExists, 5000);
var teamCheck = setInterval(updateTeamList, 1000 * 60 * 15)

function checkChatExists() {
	console.log('SC EXTENSION: checking if chat has loaded')
	if ($('.js-chat-messages').length && teamMembers.length && roles.length) {
		console.log('SC EXTENSION: chat loaded; initializing badges/roles')
		clearInterval(chatCheck);
		init();
	}
}

function init() {
	console.log('SC EXTENSION: in init')
	chrome.runtime.sendMessage({
		items: ['addChatBadges', 'addChatRoles']
	}, function (response) {
		if (response.data['addChatBadges']) {
			console.log('SC EXTENSION: Badges enabled')
			initBadgeProcessing();
		}
		if (response.data['addChatRoles']) {
			console.log('SC EXTENSION: Roles enabled')
			initRoleProcessing();
		}
	});
}

function initBadgeProcessing() {
	console.log('SC EXTENSION: Initializing badge processing')
	var messages = $('.message-line:not(.sc-team-badge-processed)');
	console.log('SC EXTENSION: ' + messages.length + ' messages found, processing for badges');
	$.each(messages, function (index, value) {
		processLineForBadge(value);
	});
	initBadgeObserver();
}

function initRoleProcessing() {
	var messages = $('.message-line:not(.sc-team-role-processed)');
	$.each(messages, function (index, value) {
		processLineForRole(value);
	});
	initRoleObserver();
}

function processLineForBadge(element) {
	var processId = Date.now();
	console.log('SC EXTENSION: Processing element for badge (' + processId + ')')
	var poster = $(element).find('.from')[0];
	if (!poster) {
		console.log('SC EXTENSION: No poster found for badge (' + processId + ')')
		return;
	}
	var username = poster.textContent;
	if (!username) {
		console.log('SC EXTENSION: No username found for badge (' + processId + ')')
		return;
	}
	if (userInTeam(username)) {
		console.log('SC EXTENSION: User ' + username + ' found for badge (' + processId + ')')
		var useFFZ = $(element).find('.indicator').length > 0;
		var destination = $(element).find('.badges');
		var badgeHtml = useFFZ ? getFFZBadgeHtml() : getVanillaBadgeHtml();
		destination.append(badgeHtml);
	} else {
		console.log('SC EXTENSION: User ' + username + ' not in team (' + processId + ')')
	}
	console.log('SC EXTENSION: Badge processing complete (' + processId + ')')
	$(element).addClass('sc-team-badge-processed');
}

function processLineForRole(element) {
	var processId = Date.now();
	console.log('SC EXTENSION: Processing element for role (' + processId + ')')
	var poster = $(element).find('.from')[0];
	if (!poster) {
		console.log('SC EXTENSION: No poster found for role (' + processId + ')')
		return;
	}
	var username = poster.textContent;
	if (!username) {
		console.log('SC EXTENSION: No username found for role (' + processId + ')')
		return;
	}
	var userRole = getRoleForUser(username);
	var ffzEnabled = $(element).find('.indicator').length > 0;
	var bttvEnabled = $(element).find('.timestamp').css('float') === 'none';
	if (userRole) {
		console.log('SC EXTENSION: User role ' + userRole.role + ' found for ' + username + ' (' + processId + ')')
		var shouldFloat = ffzEnabled || bttvEnabled ? false : true;
		var roleHtml = getVanillaRoleHtml(userRole, shouldFloat);
		$(roleHtml).insertBefore($(element).find('.badges'));
	} else {
		console.log('SC EXTENSION: User role not found for ' + username + ' (' + processId + ')');
	}
	console.log('SC EXTENSION: Role processing complete (' + processId + ')')
	$(element).addClass('sc-team-role-processed');
}

function updateTeamList() {
	console.log('SC EXTENSION: Updating team list')
	$.ajax({
		url: 'https://api.twitch.tv/kraken/teams/streamersconnected',
		type: 'GET',
		dataType: 'json',
		success: function (data) {
			console.log('SC EXTENSION: ' + data.users.length + 'team members found');
			teamMembers = data.users;
		},
		error: function (error, status, data) {
			console.log(error);
			console.log(status);
			console.log(data);
		},
		beforeSend: setHeader
	});
	$.ajax({
		url: rolesUrl,
		async: false,
		success: function (data) {
			console.log('SC EXTENSION: roles retrieved');
			roles = [];
			rolesRaw = data.split("\n");
			console.log('SC EXTENSION: ' + rolesRaw.length + ' roles found');
			$.each(rolesRaw, function (index, value) {
				console.log('SC EXTENSION: processing role ' + value);
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
			console.log('SC EXTENSION: ' + roles.length + ' roles processed');
		}
	});
}

function setHeader(xhr) {
	xhr.setRequestHeader('Client-ID', CLIENT_ID);
	xhr.setRequestHeader('Accept', 'application/vnd.twitchtv.v5+json');
}

function initBadgeObserver() {
	console.log('SC EXTENSION: Initializing badge observer');
	var target = document.getElementsByClassName('js-chat-messages');
	console.log('SC EXTENSION: ' + target.length + ' target found for badge observer');
	var observer = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			if (!mutation.target) {
				return;
			}
			if (!$(mutation.target).hasClass('message-line')) {
				return;
			}
			if ($(mutation.target).hasClass('sc-team-badge-processed')) {
				return;
			}
			console.log('SC EXTENSION: badge mutation observer found a target');
			processLineForBadge(mutation.target);
		});
	});
	var config = {
		childList: true,
		subtree: true
	};
	$.each(target, function (index, value) {
		console.log('SC EXTENSION: observing badge target ' + index);
		observer.observe(value, config);
	});
}

function initRoleObserver() {
	console.log('SC EXTENSION: Initializing role observer');
	var target = document.getElementsByClassName('js-chat-messages');
	console.log('SC EXTENSION: ' + target.length + ' target found for role observer');
	var observer = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			if (!mutation.target) {
				return;
			}
			if (!$(mutation.target).hasClass('message-line')) {
				return;
			}
			if ($(mutation.target).hasClass('sc-team-role-processed')) {
				return;
			}
			console.log('SC EXTENSION: role mutation observer found a target');
			processLineForRole(mutation.target);
		});
	});
	var config = {
		childList: true,
		subtree: true
	};
	$.each(target, function (index, value) {
		console.log('SC EXTENSION: observing role target ' + index);
		observer.observe(value, config);
	});
}

function userInTeam(username) {
	console.log('SC EXTENSION: checking user ' + username + ' in team');
	username = username.toLowerCase();
	return teamMembers.some(function (value) {
		return value.display_name.toLowerCase() == username.toLowerCase();
	});
}

function getRoleForUser(username) {
	console.log('SC EXTENSION: checking user ' + username + ' has role');
	username = username.toLowerCase();
	var role = null;
	$.each(roles, function (index, value) {
		if (value.username.toLowerCase() == username) {
			role = value;
		}
	});
	return role;
}

function getVanillaRoleHtml(role, shouldFloat) {
	console.log('SC EXTENSION: retrieving vanilla role HTML (shouldFloat = ' + shouldFloat + ')');
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
		$.each(styles, function (index, value) {
			html += value
		});
		html += '"'
	}
	html += '>' + role.role + '</div>';
	return html;
}

function getFFZBadgeHtml() {
	console.log('SC EXTENSION: retrieving FFZ badge HTML');
	return '<div class="badge html-tooltip sc-team-ffz" original-title="StreamersConnected Team" style="background: url(\'' + badgeUrl + '\')"></div>';
}

function getVanillaBadgeHtml() {
	console.log('SC EXTENSION: retrieving vanilla badge HTML');
	return '<span class="balloon-wrapper float-left">' +
		'<a href="https://twitch.amazon.com/prime" rel="noopener noreferrer" target="_blank">' +
		'<img src="' + badgeUrl + '" alt="streamersconnected" class="badge">' +
		'</a>' +
		'<div class="balloon balloon--tooltip balloon--up">StreamersConnected Team</div>' +
		'</span>';
}
