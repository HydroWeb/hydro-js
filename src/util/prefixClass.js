define(['settings'], function(settings)
{
	var prefixes = settings.classPrefix;

	return function(type, name, value) // TODO value
	{
		if(prefixes && prefixes.hasOwnProperty(type))
		{
			var prefix = prefixes[type];
			return name.replace(/[^\s]+/g, prefix + '$&')
		}

		return name;
	}
});