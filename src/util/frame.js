define(function()
{
	var FPS = 1000 / 60;
	var interval;
	var request = window.requestAnimationFrame;
	var cancel  = window.cancelAnimationFrame ||
	              window.cancelRequestAnimationFrame;

	// Native vendor prefixed support
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var i = 0; i < vendors.length && !request; i++)
	{
		request = window[vendors[i] + 'RequestAnimationFrame'];
		cancel  = window[vendors[i] + 'CancelAnimationFrame'] ||
				  window[vendors[i] + 'CancelRequestAnimationFrame'];
	}

	// Function wrap the methods to preserve the window context (and add extra functionality)
	if(request)
	{
		// Just function wrapping
		var basicRequest = request;
		request = function(callback)
		{
			return basicRequest(callback);
		};

		// Checks if the "id" is a function with an ID property (see interval below)
		var basicCancel = cancel;
		cancel = function(id)
		{
			if(typeof id == 'function')
				id = id.__id__;

			basicCancel(id);
		};

		// Shortcut for creating an interval with animation frames
		// Returns a function that is responsible for self-requesting, with it's ID
		// being updated on the function itself (so it can be cancelled later on)
		interval = function(callback)
		{
			var wrapper = function()
			{
				wrapper.__id__ = basicRequest(wrapper);
				callback();
			};

			wrapper();
			return wrapper;
		};
	}
	// Set timeout/interval polyfill
	else
	{
		request = function(callback)
		{
			return setTimeout(callback, FPS);
		};

		cancel = function(id)
		{
			// Clear both as it is unknown what the ID is; interval or timeout
			// Pretty sure this is safe, the ID generation of intervals and
			// timeouts seem to be the same origin so there shouldn't be any
			// conflicts. Haven't tested this in IE8 though... TODO
			clearInterval(id);
			clearTimeout(id);
		};

		interval = function(callback)
		{
			return setInterval(callback, FPS);
		};
	}

	return {
		FPS:      FPS,
		request:  request,
		cancel:   cancel,
		interval: interval
	};
});