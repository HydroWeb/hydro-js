define(['util/acceptValue'], function(acceptValue)
{
	var units = 'px em rem % s ms deg rad dpi dppx'.split(' ');
	var testUnit = new RegExp('([0-9.]+)(' + units.join('|') + ')$');

	/**
	 * Unit Number
	 *
	 * @param number
	 * @param unit
	 * @constructor
	 */
	function UnitNumber(number, unit)
	{
		this.number = number;
		this.unit = acceptValue(unit, units, 'px');
	}

	var methods = UnitNumber.prototype;

	/**
	 *
	 * @returns {string}
	 */
	methods.toString = function()
	{
		return this.number + '' + this.unit;
	};

	/**
	 *
	 * @returns {*}
	 */
	methods.toNumber = function()
	{
		// Percentages are more mathematically useful when they're a decimal
		if(this.unit == '%')
			return this.number / 100;

		// Convert to milliseconds; useful as all JS timing functions require millisecond inputs
		if(this.unit == 's')
			return this.number * 1000;

		return this.number;
	};

	/**
	 *
	 * @param unit
	 * @returns {boolean}
	 */
	methods.is = function(unit)
	{
		return this.unit == unit;
	};

	/**
	 *
	 * @returns {UnitNumber}
	 */
	methods.toEm = function()
	{
		// This is assuming a lot... maybe check to see if this works in all browsers?
		var base = Math.round(parseFloat(getComputedStyle(document.documentElement).fontSize));

		switch(this.unit)
		{
			case 'em':
			case 'rem':
				return new UnitNumber(this.number, 'em');
				break;

			case 'px':
				return new UnitNumber(this.number / base, 'em');
				break;

			case '%':
				return new UnitNumber(this.number / 100, 'em');
				break;

			default:
				// throw new TypeError('Cannot convert unit of type ' + this.unit + ' to em.');
				return false;
		}
	};

	/**
	 *
	 * @returns {UnitNumber}
	 */
	methods.toPixel = function()
	{
		// This is assuming a lot... maybe check to see if this works in all browsers?
		var base = Math.round(parseFloat(getComputedStyle(document.documentElement).fontSize));

		switch(this.unit)
		{
			case 'px':
				return new UnitNumber(this.number, 'px');
				break;

			case 'em':
			case 'rem':
				return new UnitNumber(this.number * base, 'px');
				break;

			case '%':
				return new UnitNumber(this.number / 100 * base, 'px');
				break;

			default:
				throw new Error('Cannot convert unit of type ' + this.unit + ' to pixel.');
		}
	};

	UnitNumber.units = units;

	/**
	 *
	 * @param value
	 * @param defaultUnit
	 * @returns {*}
	 */
	UnitNumber.parse = function(value, defaultUnit)
	{
		if(value instanceof UnitNumber) return value;

		// If the value is just a number, append the default unit
		if(!isNaN(value))
			value = value + '' + defaultUnit;

		var match = value.match(testUnit);

		// If the value didn't match the expected format, then there's nothing we can do.
		if(!match) return false;

		var unit = match[2];
		var number = parseFloat(match[1]);

		// The regular expression for matching numbers is not perfect so one last check...
		if(isNaN(number)) return false;

		return new UnitNumber(number, unit);
	};

	return UnitNumber;
});