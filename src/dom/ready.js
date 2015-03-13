/**
 * Hydro.DOM.Ready
 * 
 * A simple cross-browser event handler for detecting when the DOM is ready.
 */

define(function()
{
	var list = [];

	/**
	 * Call all queued functions.
	 */
	function trigger()
	{
		for(var i = 0, l = list.length; i < l; ++i)
		{
			list[i]();
		}
		list = [];
	}

	/**
	 * Clean-up method for dom ready events
	 */
	function detach()
	{
		if(document.addEventListener)
		{
			document.removeEventListener("DOMContentLoaded", completed, false);
			window.removeEventListener("load", completed, false);
		}
		else
		{
			document.detachEvent("onreadystatechange", completed);
			window.detachEvent("onload", completed);
		}
	}

	/**
	 * The ready event handler and self cleanup method
	 */
	function completed()
	{
		// readyState === "complete" is good enough for us to call the dom ready in oldIE
		if(document.addEventListener || event.type === "load" || document.readyState === "complete")
		{
			detach();
			trigger();
		}
	}

	// Standards-based browsers support DOMContentLoaded
	if(document.addEventListener)
	{
		// Use the handy event callback
		document.addEventListener("DOMContentLoaded", completed, false);

		// A fallback to window.onload, that will always work
		window.addEventListener("load", completed, false);
	}
	// If IE event model is used
	else
	{
		// Ensure firing before onload, maybe late but safe also for iframes
		document.attachEvent("onreadystatechange", completed);

		// A fallback to window.onload, that will always work
		window.attachEvent("onload", completed);

		// If IE and not a frame
		// continually check to see if the document is ready
		var top = false;

		try
		{
			top = window.frameElement == null && document.documentElement;
		}
		catch(e) {}

		if(top && top.doScroll)
		{
			(function doScrollCheck()
			{
				try
				{
					// Use the trick by Diego Perini
					// http://javascript.nwbox.com/IEContentLoaded/
					top.doScroll("left");
				}
				catch(e)
				{
					return setTimeout(doScrollCheck, 50);
				}

				// detach all dom ready events
				detach();

				// and execute any waiting functions
				trigger();
			})();
		}
	}

	/**
	 * Ready
	 *
	 * The function to add your callbacks.
	 *
	 * @param fn (Function)
	 *   The function that will be called when the DOM is ready. If the DOM is ready prior to adding a
	 *   callback, the callback will be invoked instantly.
	 */
	return function(fn)
	{
		list.push(fn);

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if(document.readyState === "complete")
		{
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout(trigger);
		}
	};
});