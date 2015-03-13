/*! Hydro | hydroweb.co.nz */

require(['settings', 'dom/ready', 'dom/element', 'util/prefixClass', 'dom', 'util'], function(Settings, ready, $, prefixClass)
{
	// Set the document state to ready upon DOM ready
	if(Settings.injectClasses)
	{
		ready(function()
		{
			$(document.documentElement)
				.removeClass(prefixClass('state', 'loading'))
				.addClass(prefixClass('state', 'ready'));
		});
	}
});