define(['class'], function(Class)
{
	/**
	 *
	 * @param condition
	 * @returns {Boolean}
	 */
	function testCondition(condition)
	{
		var result;

		if(condition instanceof RegExp)
		{
			result = condition.test(value);
			condition.lastIndex = 0;
		}
		else
		{
			switch(typeof condition)
			{
				case 'function':
					result = condition(value);
					break;

				case 'object':
					result = condition.hasOwnProperty(value);
					break;

				case 'string':
					result = (condition.indexOf(value) > -1);
					break;

				default:
					result = (condition === value)
			}
		}

		return result;
	}

	/**
	 * Finite State Machine
	 * TODO Perhaps make it O(n) not O(nm)
	 */
	var FSM = Class({

		/**
		 *
		 * @param json
		 */
		init: function(json)
		{
			if(!(this instanceof FSM))
				return FSM.parse(json);

			this.states = {};
			this.fsms = {};
			this.finalStates = {};
		},

		/**
		 *
		 * @param state
		 */
		start: function(state)
		{
			this.startState = state;
		},

		/**
		 *
		 * @param state
		 * @param callback
		 */
		final: function(state, callback)
		{
			this.finalStates[state] = callback || true;
		},

		/**
		 *
		 * @param fromState
		 * @param condition
		 * @param toState
		 * @param callback
		 */
		trans: function(fromState, condition, toState, callback)
		{
			if(!this.states.hasOwnProperty(fromState))
				this.states[fromState] = [];

			var state = this.states[fromState];

			state.push({
				to: toState,
				condition: condition,
				callback: callback
			});
		},

		/**
		 *
		 * @param state
		 * @param fsm
		 */
		map: function(state, fsm)
		{
			this.fsms[state] = fsm;
		},

		/**
		 *
		 * @param input
		 * @param start
		 * @param end
		 * @returns {number}
		 */
		walk: function(input, start, end)
		{
			start = start || 0;
			end   = end   || input.length;

			this.currState = this.startState;

			for(var i = start; i < end; i++)
			{
				var fsm = this.fsms[this.currState];
				if(fsm)
				{
					i = fsm.walk(input, Math.max(start, i - 1));
					if(i >= end) break;
				}

				var value = input[i];
				var state = this.states[this.currState] || [];

				var found = false;
				var finalTrans = false;

				for(var j = 0; j < state.length && !found; j++)
				{
					var trans = state[j];

					// Postpone to last
					if(trans.condition === true)
					{
						finalTrans = trans;
						continue;
					}

					var condition = testCondition(trans.condition);

					if(condition)
					{
						if(typeof trans.callback == 'function')
							condition = (trans.callback(value, i) !== false);
					}

					if(condition)
					{
						this.currState = trans.to;
						found = true;
					}
				}

				if(finalTrans)
				{
					if(typeof finalTrans.callback == 'function')
						finalTrans.callback(value, i);

					this.currState = finalTrans.to;
					found = true;
					i--;
				}

				if(!found) break;
			}

			if(!this.finalStates.hasOwnProperty(this.currState))
			{
				this.report(input, i);
			}

			return i;
		},

		/**
		 *
		 * @param input
		 */
		run: function(input)
		{
			var lastIndex = this.walk(input);

			if(lastIndex !== input.length)
			{
				this.report(input, lastIndex);
			}
			else
			{
				var fsc = this.finalStates[this.currState];
				if(typeof fsc == 'function') fsc();
			}
		},

		/**
		 *
		 * @param input
		 * @param index
		 */
		report: function(input, index)
		{
			var firstHalf = input.substr(0, index);
			var secondHalf = input.substr(index);

			var firstLines = firstHalf.split(/[\n\r]/);
			var secondLines = secondHalf.split(/[\n\r]/);

			var lastFirstLine = firstLines[firstLines.length - 1];
			var firstSecondLine = secondLines[0];

			var arrow = [];
			for(var i = 0; i < lastFirstLine.length; i++) arrow.push('-');
			arrow.push('^');

			throw new Error([
				'Parsing error, unexpected character at line ' + firstLines.length + ' character ' + (lastFirstLine.length + 1),
				lastFirstLine + firstSecondLine,
				arrow.join('')
			].join('\n'));
		}
	});

	/**
	 *
	 * @param json
	 * @returns {FSM}
	 */
	FSM.parse = function(json)
	{
		var fsm = new FSM();

		for(var method in json) if(json.hasOwnProperty(method))
		{
			var value = json[method];
			switch(method)
			{
				case 'start':
					fsm.start(value);
					break;

				case 'final':
				case 'trans':
				case 'map':
					for(var i = 0; i < value.length; i++)
						fsm[method].apply(fsm, value[i]);
					break;
			}
		}

		return fsm;
	};

	return FSM;
});