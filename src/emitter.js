/**
 * Emitter
 *
 * TODO Allow adding AND removing of events WITHIN callbacks being triggered. So far only adding works.
 */
define(['class'], function(Class)
{
	/**
	 * Helper for dealing with an events string list
	 *
	 * @param events
	 * @param fn
	 */
	function eachEvent(events, fn)
	{
		events = events.split(/\s+/);

		for(var i = 0; i < events.length; i++)
		{
			var event = events[i].split('.');

			if(!event) continue;

			event = events[i].split('.');
			var eventName = event[0];
			var eventSpace = event[1];

			if(!eventName && !eventSpace) continue;

			fn(eventName, eventSpace);
		}
	}

	/**
	 * Helper for building a new event list without the specified caller/namespace
	 *
	 * @param events
	 * @param caller
	 * @param namespace
	 * @returns {Array}
	 */
	function removeEvent(events, caller, namespace)
	{
		if(!events) return;

		var newEvents = [];
		for(var i = 0; i < events.length; i++)
		{
			var test = true;
			if(caller)    test = test && (events[i] !== caller);
			if(namespace) test = test && (events[i].__ns__ !== namespace);

			if(test) newEvents.push(events[i]);
		}
		return newEvents;
	}

	return Class({

		/**
		 *
		 * @param events
		 * @param caller
		 */
		on: function(events, caller)
		{
			this._events = this._events || {};

			var that = this;
			eachEvent(events, function(event, namespace)
			{
				if(!that._events[event])
					that._events[event] = [];

				caller.__ns__ = namespace;

				var eventsList = that._events[event];
				eventsList.push(caller);
			});
		},

		/**
		 *
		 * @param events
		 * @param caller
		 */
		one: function(events, caller)
		{
			caller.__one__ = true;
			this.on(events, caller);
		},

		/**
		 *
		 * @param events
		 * @param caller
		 */
		off: function(events, caller)
		{
			if(!this._events) return;

			var that = this;
			eachEvent(events, function(event, namespace)
			{
				if(event)
				{
					that._events[event] =
						removeEvent(that._events[event], caller, namespace);
				}
				else
				{
					for(var k in that._events) if(that._events.hasOwnProperty(k))
					{
						that._events[k] =
							removeEvent(that._events[k], caller, namespace);
					}
				}
			});
		},

		/**
		 *
		 * @param event
		 * @param args...
		 */
		trigger: function(event /*, args...*/)
		{
			if(!this._events || !this._events[event])
				return;

			var args = Array.prototype.slice.call(arguments, 1);

			var events = this._events[event];
			var newEvents = [];

			// Assign new events before the loop as events may add other events within them
			// This way they do not get overwritten.
			this._events[event] = newEvents;

			for(var i = 0; i < events.length; i++)
			{
				var response = events[i].apply(this, args);

				if(!events[i].__one__ && response !== false)
					newEvents.push(events[i]);
			}
		}

	});
});