import _ from 'underscore';
import toastr from 'toastr';

Template.livechatTriggersForm.helpers({
	name() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		return trigger && trigger.name;
	},
	description() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		return trigger && trigger.description;
	},
	enabled() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		return trigger && trigger.enabled;
	},
	conditions() {
		return Template.instance().conditions.get();
	},
	actions() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		if (!trigger) {
			return [];
		}

		return trigger.actions;
	}
});

Template.livechatTriggersForm.onCreated(function() {
	this.conditions = new ReactiveVar([]);

	this.subscribe('livechat:triggers', FlowRouter.getParam('_id'));

	this.autorun(() => {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		if (trigger) {
			// to be backward compatible with conditions that exist prior to this update
			// the system has to attribute a new id to these objects
			if (trigger.conditions.length === 1) {
				trigger.conditions[0].id = 1;
			}

			this.conditions.set(trigger.conditions);
		} else {
			this.conditions.set([{id:1, name:'page-url', value:''}]);
		}
	});
});

Template.livechatTriggersForm.events({
	'click button.add-condition'(e, instance) {
		e.preventDefault();
		const newConditions = instance.conditions.get();
		const idArray = newConditions.map(function(o) { return o.id; });
		idArray.push(1);
		const newId = Math.max.apply(Math, idArray);

		const emptyCondition = {id: newId + 1, name:'page-url', value:''};
		newConditions.push(emptyCondition);
		instance.conditions.set(newConditions);
	},
	'click .remove-condition'(e, instance) {
		e.preventDefault();

		let newConditions = instance.conditions.get();
		newConditions = _.reject(newConditions, (condition) => { return condition.id === this.id; });
		instance.conditions.set(newConditions);
	},
	'change .trigger-condition'(e, instance) {
		const newName = e.currentTarget.value;

		const newConditions = instance.conditions.get();
		const index = newConditions.findIndex(i => i.id === this.id);
		newConditions[index].name = newName;
		instance.conditions.set(newConditions);
	},
	'submit #trigger-form'(e, instance) {
		e.preventDefault();
		const $btn = instance.$('button.save');

		const oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		const data = {
			_id: FlowRouter.getParam('_id'),
			name: instance.$('input[name=name]').val(),
			description: instance.$('input[name=description]').val(),
			enabled: instance.$('input[name=enabled]:checked').val() === '1' ? true : false,
			conditions: instance.conditions.get(),
			actions: []
		};

		$('.each-action').each(function() {
			if ($('.trigger-action', this).val() === 'send-message') {
				data.actions.push({
					name: $('.trigger-action', this).val(),
					params: {
						name: $('[name=send-message-name]', this).val(),
						msg: $('[name=send-message-msg]', this).val()
					}
				});
			} else {
				data.actions.push({
					name: $('.trigger-action', this).val(),
					value: $(`.${ $('.trigger-action', this).val() }-value`).val()
				});
			}
		});

		Meteor.call('livechat:saveTrigger', data, function(error/*, result*/) {
			$btn.html(oldBtnValue);
			if (error) {
				return handleError(error);
			}

			FlowRouter.go('livechat-triggers');

			toastr.success(t('Saved'));
		});
	},

	'click button.back'(e/*, instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-triggers');
	}
});
