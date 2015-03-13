		Hydro.Class = require('class');
		Hydro.Emitter = require('emitter');
		Hydro.Settings = require('settings');
		Hydro.DOM = require('dom');
		Hydro.Util = require('util');

		Hydro.requirejs = requirejs;
		Hydro.require = require;
		Hydro.define = define;

		if(expose)
		{
			window.requirejs = Hydro.requirejs;
			window.require = Hydro.require;
			window.define = Hydro.define;
		}

		Hydro.initialised = true;
	};

	window.Hydro = Hydro;

}(window));