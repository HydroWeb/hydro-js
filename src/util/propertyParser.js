/**
 * Property parser.
 *
 * Parses a CSS-like syntax of properties and their values.
 * TODO comma separated items
 * TODO @this
 * TODO Error reports
 */

define(['Class', 'util/fsm', 'util/camelcase', 'util/unitNumber'], function(Class, FSM, camelcase, UnitNumber)
{
	/**
	 * Function definitions
	 */

	var Functions = {

		/**
		 *
		 * @param value
		 */
		em: function(value)
		{
			if(!isNaN(value))
				return new UnitNumber(value, 'em');

			if(value instanceof UnitNumber)
				return value.toEm();

			throw new Error('4');
		},

		/**
		 *
		 * @param value
		 */
		px: function(value)
		{
			if(!isNaN(value))
				return new UnitNumber(value, 'px');

			if(value instanceof UnitNumber)
				return value.toPixel();

			throw new Error('5');
		}
	};


	/**
	 * Shortcuts
	 *
	 * @type {RegExp}
	 */
	var WS  = /[\s\t\n]/;     // Whitespace
	var A   = /[a-z]/i;       // Alphabet
	var N   = /[0-9]/;        // Number
	var C   = /:/;            // Colon
	var SC  = /;/;            // Semicolon
	var PS  = /[a-z\-_]/i;    // Property Start
	var PR  = /[a-z0-9\-_]/i; // Property
	var Q   = /'/;            // Quote
	var NQ  = /[^']/;         // NOT Quote
	var DQ  = /"/;            // Double quote
	var NDQ = /[^"]/;         // NOT Double quote
	var D   = /\./;           // Dot / Decimal point
	var P   = /%/;            // Percent
	var OB  = /\(/;           // Open bracket
	var CB  = /\)/;           // Closed bracket

	var PROPERTY = { toString: function() { return 'Property'; } };
	var VALUE    = { toString: function() { return 'Value'; } };
	var FUNCTION = { toString: function() { return 'Function'; } };

	// Values
	var LIST     = { toString: function() { return 'List'; } };
	var STRING   = { toString: function() { return 'String'; } };
	var NUMBER   = { toString: function() { return 'Number'; } };

	/**
	 *
	 * @returns {*}
	 */
	function peek(stack)
	{
		return stack[stack.length - 1];
	}

	/**
	 * Tokenizer
	 *
	 * @param input
	 * @returns {Array}
	 * @constructor
	 */
	function Tokenizer(input)
	{
		var tokenizer = new FSM(0);
		var stack = [];
		var tree = [];
		var token;

		stack.push(tree);

		var decimal;
		var unit;

		function startInteger(c)
		{
			unit = false;
			token = c | 0;
		}

		function buildInteger(c)
		{
			token = token * 10 + (c | 0);
		}

		function startString(c)
		{
			token = [c];
		}

		function buildString(c)
		{
			token.push(c);
		}

		function defineProperty()
		{
			var obj = {def: PROPERTY, prop: token, vals: []};
			tree.push(obj);
			stack.push(obj);
		}

		function definePropertyString()
		{
			token = token.join('');
			defineProperty();
		}

		function endProperty()
		{
			var obj = stack.pop();

			if(obj.def !== PROPERTY)
				throw new Error('More uhohs');
		}

		function getValueList()
		{
			var obj = peek(stack);
			if(!obj) throw new Error('Uh oh...');

			switch(obj.def)
			{
				case PROPERTY: return obj.vals; break;
				case FUNCTION: return obj.args; break;

				default: throw new Error('Uh oh...');
			}
		}

		function startDecimal()
		{
			decimal = 1;
		}

		function startOnlyDecimal()
		{
			token = 0;
			unit = false;
			startDecimal();
		}

		function startList()
		{
			token = [];
		}

		function startUnit(c)
		{
			unit = [c];
		}

		function buildUnit(c)
		{
			unit.push(c);
		}

		function defineString()
		{
			var obj = {def: VALUE, type: STRING, str: token.join('')};
			getValueList().push(obj);
		}

		function defineNumber()
		{
			var obj = {def: VALUE, type: NUMBER, num: token, unit: unit ? unit.join('') : false};
			getValueList().push(obj);
		}

		function defineNumberPercentage()
		{
			unit = ['%'];
			defineNumber();
		}

		function endFunction()
		{
			var obj = stack.pop();
			if(!obj) throw new Error('Uh oh...2');

			if(obj.def !== PROPERTY && obj.def !== FUNCTION)
				throw new Error('More uhohs2');
		}


		// Property/Index
		// ==============

		tokenizer.trans(0, WS, 0);
		tokenizer.trans(0, PS, 1, startString);
		tokenizer.trans(1, PR, 1, buildString);
		tokenizer.trans(0, N,  2, startInteger);
		tokenizer.trans(2, N,  2, buildInteger);
		tokenizer.trans(1, WS, 3, definePropertyString);
		tokenizer.trans(2, WS, 3, defineProperty);
		tokenizer.trans(3, WS, 3);
		tokenizer.trans(1, C,  4, definePropertyString);
		tokenizer.trans(2, C,  4, defineProperty);
		tokenizer.trans(3, C,  4);

		tokenizer.final(0);


		// Values
		// ======

		tokenizer.trans(4, WS, 4);
		tokenizer.trans(4, SC, 0, endProperty);
		tokenizer.trans(4, CB, 4, endFunction);

		// Each avenue must end with WS, CB or SC

		// Quoteless strings and functions

		tokenizer.trans(4, PS, 5, startString);
		tokenizer.trans(5, PR, 5, buildString);
		tokenizer.trans(5, OB, 4, function()
		{
			var obj = {def: FUNCTION, fn: token.join(''), args: []};
			getValueList().push(obj);
			stack.push(obj);
		});
		tokenizer.trans(5, WS,  4, defineString);
		tokenizer.trans(5, CB, 13, defineString);
		tokenizer.trans(5, SC, 14, defineString);

		// Numbers

		tokenizer.trans(4, N, 6, startInteger);
		tokenizer.trans(6, N, 6, buildInteger);
		tokenizer.trans(4, D, 7, startOnlyDecimal);
		tokenizer.trans(6, D, 7, startDecimal);
		tokenizer.trans(7, N, 7, function(c)
		{
			decimal *= 10;
			token = token + ((c | 0) / decimal);
		});
		tokenizer.trans(6, A,   8, startUnit);
		tokenizer.trans(7, A,   8, startUnit);
		tokenizer.trans(8, A,   8, buildUnit);
		tokenizer.trans(6, P,  11, defineNumberPercentage);
		tokenizer.trans(7, P,  11, defineNumberPercentage);
		tokenizer.trans(6, WS,  4, defineNumber);
		tokenizer.trans(7, WS,  4, defineNumber);
		tokenizer.trans(8, WS,  4, defineNumber);
		tokenizer.trans(6, CB, 13, defineNumber);
		tokenizer.trans(7, CB, 13, defineNumber);
		tokenizer.trans(8, CB, 13, defineNumber);
		tokenizer.trans(6, SC, 14, defineNumber);
		tokenizer.trans(7, SC, 14, defineNumber);
		tokenizer.trans(8, SC, 14, defineNumber);

		// Quoted strings

		tokenizer.trans( 4, Q,    9, startList);
		tokenizer.trans( 9, NQ,   9, buildString);
		tokenizer.trans( 4, DQ,  10, startList);
		tokenizer.trans(10, NDQ, 10, buildString);
		tokenizer.trans( 9, Q,   11, defineString);
		tokenizer.trans(10, DQ,  11, defineString);

		// End states

		tokenizer.trans(11, WS,  4);
		tokenizer.trans(11, CB, 13);
		tokenizer.trans(11, SC, 14);

		tokenizer.trans(13, true, 4, endFunction);

		tokenizer.trans(14, true, 0, endProperty);

		tokenizer.final( 4, endProperty);
		tokenizer.final( 5, defineString);
		tokenizer.final( 6, defineNumber);
		tokenizer.final( 7, defineNumberPercentage);
		tokenizer.final( 8, defineNumber);
		tokenizer.final(11, endProperty);
		tokenizer.final(13, endFunction);
		tokenizer.final(14, endProperty);


		// Run
		// ===

		tokenizer.run(input);

		return tree;
	}


	function parseValues(values)
	{
		var output = [];

		for(var i = 0; i < values.length; i++)
		{
			var value = values[i];
			var valueOutput;

			switch(value.def)
			{
				case FUNCTION: valueOutput = parseFunction(value); break;
				case VALUE: valueOutput = parseValue(value); break;
				default:
					// throw error
			}

			output.push(valueOutput);
		}

		return output;
	}

	function parseValue(value)
	{
		var output;

		switch(value.type)
		{
			case STRING: output = value.str; break;
			case NUMBER:
				if(value.unit)
					output = new UnitNumber(value.num, value.unit);
				else
					output = value.num;
				break;

			default:
				// throw
		}

		return output;
	}

	function parseFunction(func)
	{
		var name = camelcase(func.fn);

		if(!Functions.hasOwnProperty(name))
			throw new Error('No function "' + func.fn + '" exists.');

		var args = parseValues(func.args);

		return Functions[name].apply(window, args);
	}

	function Evaluator(tree)
	{
		var output = {};

		for(var i = 0; i < tree.length; i++)
		{
			var property = tree[i];
			var values = parseValues(property.vals);
			var name = camelcase(property.prop);

			output[name] = values;
		}

		return output;
	}

	function propertyParser(input)
	{
		return Evaluator(Tokenizer(input));
	}

	propertyParser.tokenizer = Tokenizer;
	propertyParser.evaluator = Evaluator;
	propertyParser.functions = Functions;

	return propertyParser;
});