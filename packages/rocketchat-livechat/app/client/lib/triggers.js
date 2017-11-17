this.Triggers = (function() {
	let triggers = [];
	let initiated = false;
	let requests = [];
	let enabled = true;

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

			let triggerConditions = {
				pageUrl: null,
				language: null,
				timeOnSite: 1
			};
			trigger.conditions.forEach(function(condition) {
				switch (condition.name) {
					case 'page-url':
						triggerConditions.pageUrl = condition.value;
						break;

					case 'language':
						triggerConditions.language = condition.value;
						break;

					case 'time-on-site':
						triggerConditions.timeOnSite = Math.max(condition.value, 1);
						break;
				}
			});

			// test for url first, because it does not change with time
			if (triggerConditions.pageUrl === null || request.location.href.match(new RegExp(triggerConditions.pageUrl)) !== null) {
				if (trigger.timeout) {
					clearTimeout(trigger.timeout);
				}

				// set the timer (minimum of a second before triggering)
				trigger.timeout = setTimeout(function() {
					// test for language at this time because it can change asynchronously
					const language = Livechat.language.split('-').shift();
					if (triggerConditions.language === null || triggerConditions.language === language){
						fire(trigger);
					}
				}, parseInt(triggerConditions.timeOnSite) * 1000);
			}

		});
	};

	const setTriggers = function(newTriggers) {
		triggers = newTriggers;
	};

	const init = function() {
		initiated = true;

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
