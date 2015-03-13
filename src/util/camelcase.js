define(function()
{
	var rep = function(all, letter)
	{
		return letter.toUpperCase();
	};

	var revRep = function(letter)
	{
		return '-' + letter.toLowerCase();
	};

	function camelcase(string, reverse)
	{
		if(reverse)
		{
			return string.replace(/[A-Z]/g, revRep);
		}

		return string.replace(/[-_]([a-z])/ig, rep);
	}

	camelcase.undo = function(string)
	{
		return camelcase(string, true);
	};

	return camelcase;
});