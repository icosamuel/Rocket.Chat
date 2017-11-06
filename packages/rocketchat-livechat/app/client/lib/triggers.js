this.Triggers = (function() {
	let triggers = [];
	let initiated = false;
	let requests = [];
	let enabled = true;
	let language = 'en';

	const fire = function(trigger) {
		if (!enabled || Meteor.userId()) {
			return;
		}
		trigger.actions.forEach(function(action) {
			if (action.name === 'send-message') {
				// flag to skip the trigger if the action is 'send-message'
				trigger.skip = true;

				let roomId = visitor.getRoom();

				if (!roomId) {
					roomId = Random.id();
					visitor.setRoom(roomId);
				}

				Session.set('triggered', true);
				ChatMessage.insert({
					msg: action.params.msg,
					rid: roomId,
					u: {
						username: action.params.name
					}
				});

				parentCall('openWidget');
			}
		});
	};

	const processRequest = function(request) {
		if (!initiated) {
			return requests.push(request);
		}
		triggers.forEach(function(trigger) {
			if (trigger.skip) {
				return;
			}
			let validationToken = true;
			let delayTime = 0;
			trigger.conditions.forEach(function(condition) {
				switch (condition.name) {
					case 'page-url':
						if (request.location.href.match(new RegExp(condition.value)) == null) {
							validationToken = false;
						}
						break;

					case 'language':
						if (language !== condition.value) {
							validationToken = false;
						}
						break;

					case 'time-on-site':
						delayTime = condition.value;
						break;
				}
			});

			if (validationToken) {
				if (trigger.timeout) {
					clearTimeout(trigger.timeout);
				}
				if (delayTime > 0) {
					trigger.timeout = setTimeout(function() {
						fire(trigger);
					}, parseInt(delayTime) * 1000);
				} else {
					fire(trigger);
				}
			}
		});
	};

	const setTriggers = function(newTriggers) {
		triggers = newTriggers;
	};

	const init = function(lang = 'en') {
		initiated = true;
		language = lang;

		if (requests.length > 0 && triggers.length > 0) {
			requests.forEach(function(request) {
				processRequest(request);
			});

			requests = [];
		}
	};

	const setDisabled = function() {
		enabled = false;
	};

	const setEnabled = function() {
		enabled = true;
	};

	return {
		init,
		processRequest,
		setTriggers,
		setDisabled,
		setEnabled
	};
}());
