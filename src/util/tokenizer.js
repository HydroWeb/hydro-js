define(['class', 'emitter'], function(Class, Emitter)
{
	function Token(type, value)
	{
		this.type = type;
		this.value = value;
	}

	var Consumer = Emitter.extend({
		
		init: function()
		{
			this.rules = {};
		},

		rule: function(name, exp, callback)
		{
			if(typeof exp == 'string')
			{
				var value = exp;

				exp = {
					test: function(compare)
					{
						return (value == compare);
					}
				};
			}

			this.rules[name] = exp;

			if(callback)
				this.on('rule.' + name, callback);
		},

		_getRule: function(char)
		{
			var rules = this.rules;
			for(var name in rules) if(rules.hasOwnProperty(name))
			{
				var exp = rules[name];
				if(exp.test(char)) return name;
			}

			return false;
		},

		consume: function(tokenizer)
		{
			var output = [];
			var current;

			while(true)
			{
				current = tokenizer.char();

				var ruleName = this._getRule(current);
				if(ruleName === false) break;

				this.trigger('rule.' + ruleName, {char: current});

				output.push(char);

				tokenizer.tick();
			}

			return (!output.length ? false : output.join(''));
		}
	});

	var Tokenizer = Consumer.extend({

		init: function(source)
		{
			Consumer.fn.init.call(this);

			this.source = source;
			this.index = 0;
		},

		char: function()
		{
			return this.source.charAt(this.index);
		},

		consume: function()
		{
			return Consumer.fn.consume.call(this, this);
		},

		tick: function()
		{
			this.index++;
		},

		eof: function()
		{
			return this.index >= (this.source.length - 1);
		}
	});

	Tokenizer.Consumer = Consumer;

	return Tokenizer;
});