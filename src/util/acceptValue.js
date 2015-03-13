define(function()
{
	// // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
	// Polyfill for IE8
	var indexOf = Array.prototype.indexOf || function(searchElement, fromIndex)
	{
		if(this == null) throw new TypeError('"this" is null or not defined');

		var k;
		var O = Object(this);
		var len = O.length >>> 0;

		if(len === 0) return -1;

		var n = +fromIndex || 0;
		if(Math.abs(n) === Infinity) n = 0;

		if (n >= len) return -1;

		k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

		while (k < len)
		{
			var kValue;
			if(k in O && O[k] === searchElement) return k;
			k++;
		}

		return -1;
	};

	var isArray = Array.isArray || function(a)
	{
		return Object.prototype.toString.call(a) == '[object Array]';
	};

	/**
	 * vals can be a string of words separated by spaces, an array of strings, or a plain object
	 */
	return function(val, vals, dflt)
	{
		if(val === false) return dflt;

		var hasVal = false;

		if(typeof vals == 'string')
		{
			hasVal = (' ' + vals + ' ').indexOf(' ' + val + ' ') > -1;
		}
		else if(isArray(vals))
		{
			hasVal = indexOf.call(vals, val) > -1;
		}
		else if(vals)
		{
			hasVal = vals.hasOwnProperty(val);
		}

		return hasVal ? val : dflt;
	};
});