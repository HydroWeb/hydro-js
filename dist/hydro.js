;(function(window, undefined)
{
	var Hydro = {version: '0.0.1', initialised: false};

	Hydro.init = function(expose)
	{/*! almond 0.3.0 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved. */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
	var main, req, makeMap, handlers,
		defined = {},
		waiting = {},
		config = {},
		defining = {},
		hasOwn = Object.prototype.hasOwnProperty,
		aps = [].slice,
		jsSuffixRegExp = /\.js$/;

	function hasProp(obj, prop) {
		return hasOwn.call(obj, prop);
	}

	/**
	 * Given a relative module name, like ./something, normalize it to
	 * a real name that can be mapped to a path.
	 * @param {String} name the relative name
	 * @param {String} baseName a real name that the name arg is relative
	 * to.
	 * @returns {String} normalized name
	 */
	function normalize(name, baseName) {
		var nameParts, nameSegment, mapValue, foundMap, lastIndex,
			foundI, foundStarMap, starI, i, j, part,
			baseParts = baseName && baseName.split("/"),
			map = config.map,
			starMap = (map && map['*']) || {};

		//Adjust any relative paths.
		if (name && name.charAt(0) === ".") {
			//If have a base name, try to normalize against it,
			//otherwise, assume it is a top-level require that will
			//be relative to baseUrl in the end.
			if (baseName) {
				//Convert baseName to array, and lop off the last part,
				//so that . matches that "directory" and not name of the baseName's
				//module. For instance, baseName of "one/two/three", maps to
				//"one/two/three.js", but we want the directory, "one/two" for
				//this normalization.
				baseParts = baseParts.slice(0, baseParts.length - 1);
				name = name.split('/');
				lastIndex = name.length - 1;

				// Node .js allowance:
				if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
					name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
				}

				name = baseParts.concat(name);

				//start trimDots
				for (i = 0; i < name.length; i += 1) {
					part = name[i];
					if (part === ".") {
						name.splice(i, 1);
						i -= 1;
					} else if (part === "..") {
						if (i === 1 && (name[2] === '..' || name[0] === '..')) {
							//End of the line. Keep at least one non-dot
							//path segment at the front so it can be mapped
							//correctly to disk. Otherwise, there is likely
							//no path mapping for a path starting with '..'.
							//This can still fail, but catches the most reasonable
							//uses of ..
							break;
						} else if (i > 0) {
							name.splice(i - 1, 2);
							i -= 2;
						}
					}
				}
				//end trimDots

				name = name.join("/");
			} else if (name.indexOf('./') === 0) {
				// No baseName, so this is ID is resolved relative
				// to baseUrl, pull off the leading dot.
				name = name.substring(2);
			}
		}

		//Apply map config if available.
		if ((baseParts || starMap) && map) {
			nameParts = name.split('/');

			for (i = nameParts.length; i > 0; i -= 1) {
				nameSegment = nameParts.slice(0, i).join("/");

				if (baseParts) {
					//Find the longest baseName segment match in the config.
					//So, do joins on the biggest to smallest lengths of baseParts.
					for (j = baseParts.length; j > 0; j -= 1) {
						mapValue = map[baseParts.slice(0, j).join('/')];

						//baseName segment has  config, find if it has one for
						//this name.
						if (mapValue) {
							mapValue = mapValue[nameSegment];
							if (mapValue) {
								//Match, update name to the new value.
								foundMap = mapValue;
								foundI = i;
								break;
							}
						}
					}
				}

				if (foundMap) {
					break;
				}

				//Check for a star map match, but just hold on to it,
				//if there is a shorter segment match later in a matching
				//config, then favor over this star map.
				if (!foundStarMap && starMap && starMap[nameSegment]) {
					foundStarMap = starMap[nameSegment];
					starI = i;
				}
			}

			if (!foundMap && foundStarMap) {
				foundMap = foundStarMap;
				foundI = starI;
			}

			if (foundMap) {
				nameParts.splice(0, foundI, foundMap);
				name = nameParts.join('/');
			}
		}

		return name;
	}

	function makeRequire(relName, forceSync) {
		return function () {
			//A version of a require function that passes a moduleName
			//value for items that may need to
			//look up paths relative to the moduleName
			var args = aps.call(arguments, 0);

			//If first arg is not require('string'), and there is only
			//one arg, it is the array form without a callback. Insert
			//a null so that the following concat is correct.
			if (typeof args[0] !== 'string' && args.length === 1) {
				args.push(null);
			}
			return req.apply(undef, args.concat([relName, forceSync]));
		};
	}

	function makeNormalize(relName) {
		return function (name) {
			return normalize(name, relName);
		};
	}

	function makeLoad(depName) {
		return function (value) {
			defined[depName] = value;
		};
	}

	function callDep(name) {
		if (hasProp(waiting, name)) {
			var args = waiting[name];
			delete waiting[name];
			defining[name] = true;
			main.apply(undef, args);
		}

		if (!hasProp(defined, name) && !hasProp(defining, name)) {
			throw new Error('No ' + name);
		}
		return defined[name];
	}

	//Turns a plugin!resource to [plugin, resource]
	//with the plugin being undefined if the name
	//did not have a plugin prefix.
	function splitPrefix(name) {
		var prefix,
			index = name ? name.indexOf('!') : -1;
		if (index > -1) {
			prefix = name.substring(0, index);
			name = name.substring(index + 1, name.length);
		}
		return [prefix, name];
	}

	/**
	 * Makes a name map, normalizing the name, and using a plugin
	 * for normalization if necessary. Grabs a ref to plugin
	 * too, as an optimization.
	 */
	makeMap = function (name, relName) {
		var plugin,
			parts = splitPrefix(name),
			prefix = parts[0];

		name = parts[1];

		if (prefix) {
			prefix = normalize(prefix, relName);
			plugin = callDep(prefix);
		}

		//Normalize according
		if (prefix) {
			if (plugin && plugin.normalize) {
				name = plugin.normalize(name, makeNormalize(relName));
			} else {
				name = normalize(name, relName);
			}
		} else {
			name = normalize(name, relName);
			parts = splitPrefix(name);
			prefix = parts[0];
			name = parts[1];
			if (prefix) {
				plugin = callDep(prefix);
			}
		}

		//Using ridiculous property names for space reasons
		return {
			f: prefix ? prefix + '!' + name : name, //fullName
			n: name,
			pr: prefix,
			p: plugin
		};
	};

	function makeConfig(name) {
		return function () {
			return (config && config.config && config.config[name]) || {};
		};
	}

	handlers = {
		require: function (name) {
			return makeRequire(name);
		},
		exports: function (name) {
			var e = defined[name];
			if (typeof e !== 'undefined') {
				return e;
			} else {
				return (defined[name] = {});
			}
		},
		module: function (name) {
			return {
				id: name,
				uri: '',
				exports: defined[name],
				config: makeConfig(name)
			};
		}
	};

	main = function (name, deps, callback, relName) {
		var cjsModule, depName, ret, map, i,
			args = [],
			callbackType = typeof callback,
			usingExports;

		//Use name if no relName
		relName = relName || name;

		//Call the callback to define the module, if necessary.
		if (callbackType === 'undefined' || callbackType === 'function') {
			//Pull out the defined dependencies and pass the ordered
			//values to the callback.
			//Default to [require, exports, module] if no deps
			deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
			for (i = 0; i < deps.length; i += 1) {
				map = makeMap(deps[i], relName);
				depName = map.f;

				//Fast path CommonJS standard dependencies.
				if (depName === "require") {
					args[i] = handlers.require(name);
				} else if (depName === "exports") {
					//CommonJS module spec 1.1
					args[i] = handlers.exports(name);
					usingExports = true;
				} else if (depName === "module") {
					//CommonJS module spec 1.1
					cjsModule = args[i] = handlers.module(name);
				} else if (hasProp(defined, depName) ||
					hasProp(waiting, depName) ||
					hasProp(defining, depName)) {
					args[i] = callDep(depName);
				} else if (map.p) {
					map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
					args[i] = defined[depName];
				} else {
					throw new Error(name + ' missing ' + depName);
				}
			}

			ret = callback ? callback.apply(defined[name], args) : undefined;

			if (name) {
				//If setting exports via "module" is in play,
				//favor that over return value and exports. After that,
				//favor a non-undefined return value over exports use.
				if (cjsModule && cjsModule.exports !== undef &&
					cjsModule.exports !== defined[name]) {
					defined[name] = cjsModule.exports;
				} else if (ret !== undef || !usingExports) {
					//Use the return value from the function.
					defined[name] = ret;
				}
			}
		} else if (name) {
			//May just be an object definition for the module. Only
			//worry about defining if have a module name.
			defined[name] = callback;
		}
	};

	requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
		if (typeof deps === "string") {
			if (handlers[deps]) {
				//callback in this case is really relName
				return handlers[deps](callback);
			}
			//Just return the module wanted. In this scenario, the
			//deps arg is the module name, and second arg (if passed)
			//is just the relName.
			//Normalize module name, if it contains . or ..
			return callDep(makeMap(deps, callback).f);
		} else if (!deps.splice) {
			//deps is a config object, not an array.
			config = deps;
			if (config.deps) {
				req(config.deps, config.callback);
			}
			if (!callback) {
				return;
			}

			if (callback.splice) {
				//callback is an array, which means it is a dependency list.
				//Adjust args if there are dependencies
				deps = callback;
				callback = relName;
				relName = null;
			} else {
				deps = undef;
			}
		}

		//Support require(['a'])
		callback = callback || function () {};

		//If relName is a function, it is an errback handler,
		//so remove it.
		if (typeof relName === 'function') {
			relName = forceSync;
			forceSync = alt;
		}

		//Simulate async callback;
		if (forceSync) {
			main(undef, deps, callback, relName);
		} else {
			//Using a non-zero value because of concern for what old browsers
			//do, and latest browsers "upgrade" to 4 if lower value is used:
			//http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
			//If want a value immediately, use require('id') instead -- something
			//that works in almond on the global level, but not guaranteed and
			//unlikely to work in other AMD implementations.
			setTimeout(function () {
				main(undef, deps, callback, relName);
			}, 4);
		}

		return req;
	};

	/**
	 * Just drops the config on the floor, but returns req in case
	 * the config return value is used.
	 */
	req.config = function (cfg) {
		return req(cfg);
	};

	/**
	 * Expose module registry for debugging and tooling
	 */
	requirejs._defined = defined;

	define = function (name, deps, callback) {

		//This module may not have dependencies
		if (!deps.splice) {
			//deps is not an array, so probably means
			//an object literal or factory function for
			//the value. Adjust args.
			callback = deps;
			deps = [];
		}

		if (!hasProp(defined, name) && !hasProp(waiting, name)) {
			waiting[name] = [name, deps, callback];
		}
	};

	define.amd = {
		jQuery: true
	};
}());
/**
 * Hydro.Settings
 */
 
define('settings',{
	// Whether or not to set class names to elements that are used with Hydro JS modules. Setting to false will
	// stop elements from receiving class names such as “is-open” or “m-toggler”.
	injectClasses: true,

	// The CSS class name prefixes. See the Hydro CSS documentation for an understanding of the methodology.
	// docs.hydroframework.com/hydro-css
	classPrefix: {

		// When used in conjunction with Hydro CSS, this determines whether to fetch the class prefix settings
		// from the stylesheet instead.
		Import: true,

		// The module class name prefix.
		module: '',

		// The parameter class name prefix.
		parameter: '-',

		// The value class name prefix.
		value: '-',

		// The state class name prefix.
		state: 'is-',

		// The feature class name prefix.
		feature: 'has-',

		// The featureless class name prefix.
		featureless: 'no-'
	},

	// The default animation settings. These are applied to modules if an animation property is set but no
	// duration and/or timing function.
	animate: {

		// If a number is set, this is taken as the number of milliseconds. If a string is set, it is expected
		// to take the format of a number with a “ms” or “s” suffix.
		duration: 200,

		// The timing function of the transition. Can be any type of valid CSS timing function.
		timing: 'ease-in-out'
	}
});
/**
 * Hydro.DOM.Ready
 * 
 * A simple cross-browser event handler for detecting when the DOM is ready.
 */

define('dom/ready',[],function()
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
define('util/camelcase',[],function()
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
/**
 * Hydro.DOM.Element
 * 
 * A jQuery-like DOM element wrapper that adds methods and extra functionality. In contrast to jQuery, the
 * element method only deals with single elements. This module is not intended to be a replacement for jQuery,
 * as it is mostly for internal use. However it works quite well for basic DOM querying and modification.
 */

define('dom/element',['util/camelcase'], function(camelcase)
{
	var classList = !!document.documentElement.classList;

	/**
	 * Element (constructor)
	 * The constructor for the DOM.Element class. This can be called with or without prefixing it with “new”.
	 *
	 * @param el (String | Element | DOM.Element)
	 *   The element to wrap. A string will be treated as a selector and query the DOM for a single element.
	 *   Passing an instance of a DOM.Element will simply return that instance.
	 */
	var Element = function(el)
	{
		if(el instanceof Element)
			return el;

		if(!(this instanceof Element))
			return new Element(el);

		if(typeof el === 'string')
			el = document.querySelector(el);

		// (Element) The raw DOM element.
		this.element = el;

		// (Element) Shorthand for the element property.
		this.el = el;
	};

	var fn = Element.prototype;
	Element.fn = fn;

	/**
	 * Window
	 *
	 * Gets the window that an element belongs to.
	 *
	 * @returns Window
	 */
	fn.window = function()
	{
		var el = this.el;
		if(!el) return false;

		var doc = el.ownerDocument;
		return doc.defaultView || doc.parentWindow;
	};

	/**
	 * Is Visible
	 *
	 * Checks if an element is visible on the screen (has a width and height greater than zero).
	 *
	 * @returns Boolean
	 */
	fn.isVisible = function()
	{
		var el = this.el;
		return !!(el && el.offsetWidth && el.offsetHeight);
	};

	/**
	 * In Document
	 *
	 * Checks if an element is in the document.
	 *
	 * @returns Boolean
	 */
	fn.inDocument = function()
	{
		return !!this.el && this.el.ownerDocument.body.contains(this.el);
	};

	/**
	 * Is Displayed
	 *
	 * Checks if an element is in the document and has a display style other than none.
	 *
	 * @returns Boolean
	 */
	fn.isDisplayed = function()
	{
		return !!this.el && this.inDocument() && this.window().getComputedStyle(this.el).display != 'none';
	};

	/**
	 * Repaint
	 *
	 * Causes a layout redraw for an element.
	 */
	fn.repaint = function()
	{
		this.el && this.el.offsetWidth;
		return this;
	};

	/**
	 * Add Class
	 * 
	 * Adds one or more class names to an element.
	 * 
	 * @param value (String)
	 *   The class name(s) to add to the element. Multiple classes can be added by separating them with a space.
	 */
	fn.addClass = classList ? function(value)
	{
		if(this.el)
		{
			if(value.indexOf(' ') > -1)
			{
				var values = value.split(/\s+/);
				for(var i = 0; i < values.length; i++)
				{
					value = values[i];
					if(value) this.el.classList.add(value);
				}
			}
			else
			{
				this.el.classList.add(value);
			}
		}

		return this;
	} :
	function(value)
	{
		if(this.el)
		{
			var classes = this.el.className;
			var testRe = new RegExp('\\b' + value + '\\b');

			if(!testRe.test(classes))
				this.el.className += ' ' + value;
		}

		return this;
	};

	/**
	 * Remove Class
	 * 
	 * Removes one or more class names from an element.
	 * 
	 * @param value (String)
	 *   The class name(s) to remove from the element. Multiple classes can be removed by separating them with
	 *   a space.
	 */
	fn.removeClass = classList ? function(value)
	{
		if(this.el)
		{
			if(value.indexOf(' ') > -1)
			{
				var values = value.split(/\s+/);
				for(var i = 0; i < values.length; i++)
				{
					value = values[i];
					if(value) this.el.classList.remove(value);
				}
			}
			else
			{
				this.el.classList.remove(value);
			}
		}

		return this;
	} :
	function(value)
	{
		if(this.el)
		{
			var classes = this.el.className;
			var testRe = new RegExp('\\b' + value + '\\b');

			if(!testRe.test(classes))
				this.el.className = classes.replace(testRe, '');
		}

		return this;
	};

	/**
	 * Has Class
	 *
	 * Checks if an element has the class specified.
	 * 
	 * @param value (String)
	 *   The name of the class to check for on the element. Cannot contain spaces; must be a single class name.
	 */
	fn.hasClass = classList ? function(value)
	{
		return !!this.el && this.el.classList.contains(value);
	} :
	function(value)
	{
		if(this.el)
		{
			var classes = this.el.className;
			var testRe = new RegExp('\\b' + value + '\\b');

			return testRe.test(classes);
		}

		return false;
	};

	/**
	 *
	 * @returns {{top: number, left: number}}
	 */
	fn.offset = function()
	{
		var win = this.window();
		var docElm = this.el.ownerDocument.documentElement;

		var box = this.el.getBoundingClientRect();

		return {
			top:  box.top  + (win.pageYOffset || docElm.scrollTop ) - (docElm.clientTop  || 0),
			left: box.left + (win.pageXOffset || docElm.scrollLeft) - (docElm.clientLeft || 0)
		};
	};

	/**
	 * Attribute
	 *
	 * Gets and sets an attribute on an element. If a value is not set (aka. undefined) then the attribute’s
	 * value is returned. If a value is null, the attribute is removed from the element. Otherwise the value
	 * is set to the attribute.
	 *
	 * @param name (String)
	 *   The name of the attribute. The attribute can be dash-separated or camel cased. For example,
	 *   “data-attribute” and “dataAttribute” are equivalent.
	 * @param value (String) (Optional)
	 *   The value to be set to the attribute.
	 * @returns String | DOM.Element
	 */
	fn.attr = function(name, value)
	{
		var el = this.el;
		var attrName = camelcase.undo(name);

		if(typeof value === 'undefined')
		{
			return (el.getAttribute(attrName) || el[attrName]);
		}

		if(value === null)
		{
			el.removeAttribute(attrName);
		}
		else
		{
			el.setAttribute(attrName, value);
		}

		return this;
	};

	// Expose module
	return Element;
});
define('util/prefixClass',['settings'], function(settings)
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
/**
 * Class
 * A class initialiser for Javascript
 *
 * Based upon John Resigs "Simple Javascript Inheritance"
 * http://is.gd/5Js7qK
 *
 * TODO Implements
 */
define('class',[],function()
{
	// Setting up...
	var classID     = 0;
	var instanceID  = 0;
	var initFlag    = true;
	var initDefault = function() {};
	var returnTrue  = function() { return true; };
	var returnFalse = function() { return false; };
	var extendFn    = function(newMethods)
	{
		newMethods.Extends = this;
		return Class(newMethods);
	};

	var Class = function(newMethods)
	{
		// Create the new class
		var newClass = function Class()
		{
			if(initFlag)
			{
				if(isBase)
					throw new Error('Base class cannot be instantiated');

				//this.classID = newClass.classID;
				//this.instanceID = instanceID++;

				this.init.apply(this, arguments);
			}
		};

		// Can be initialized with a plain object or function
		switch(typeof newMethods)
		{
			case 'object': break;

			case 'function':
				var o = {};
				newMethods.call(o, newClass);
				newMethods = o;
				o = null;
				break;

			default:
				throw new TypeError('Class may only be created from a plain object or function');
		}

		var superClass = null;
		var isBase  = newMethods.Base  === true;
		var isFinal = newMethods.Final === true;
		var newProto;

		delete newMethods.Base;
		delete newMethods.Final;

		// Is this class extending another?
		if(typeof newMethods.Extends == 'function')
		{
			superClass = newMethods.Extends;

			if(superClass.isFinalClass && superClass.isFinalClass())
				throw new Error('Extending class is marked as final and may not be extended');

			// Extend the class onto the new prototype
			// Do not call the init(ializer)
			initFlag = false;
			newProto = new superClass();
			initFlag = true;
		}
		// Make sure that we don't unnecessarily overwrite the original prototype (faster lookup)
		else newProto = newClass.prototype || {};

		// Clean up methods
		delete newMethods.Extends;

		// Pass the newly defined methods over to the new prototype
		for(var methodName in newMethods) if(newMethods.hasOwnProperty(methodName))
		{
			newProto[methodName] = newMethods[methodName];
		}

		// If the new prototype does not have an init function, default it
		if(typeof newProto.init != 'function')
			newProto.init = initDefault;

		// Assignments
		newProto.constructor  = newClass;
		newClass.classID      = classID++;
		newClass.prototype    = newProto;
		newClass.fn           = newProto; // Shortcut for Class.prototype
		newClass.superClass   = superClass;
		newClass.isBaseClass  = isBase  ? returnTrue : returnFalse;
		newClass.isFinalClass = isFinal ? returnTrue : returnFalse;
		newClass.extend       = extendFn;

		// Class is packaged and ready to be posted!
		return newClass;
	};

	return Class;
});
/**
 * Emitter
 *
 * TODO Allow adding AND removing of events WITHIN callbacks being triggered. So far only adding works.
 */
define('emitter',['class'], function(Class)
{
	/**
	 * Helper for dealing with an events string list
	 *
	 * @param events
	 * @param fn
	 */
	function eachEvent(events, fn)
	{
		events = events.split(/\s+/);

		for(var i = 0; i < events.length; i++)
		{
			var event = events[i].split('.');

			if(!event) continue;

			event = events[i].split('.');
			var eventName = event[0];
			var eventSpace = event[1];

			if(!eventName && !eventSpace) continue;

			fn(eventName, eventSpace);
		}
	}

	/**
	 * Helper for building a new event list without the specified caller/namespace
	 *
	 * @param events
	 * @param caller
	 * @param namespace
	 * @returns {Array}
	 */
	function removeEvent(events, caller, namespace)
	{
		if(!events) return;

		var newEvents = [];
		for(var i = 0; i < events.length; i++)
		{
			var test = true;
			if(caller)    test = test && (events[i] !== caller);
			if(namespace) test = test && (events[i].__ns__ !== namespace);

			if(test) newEvents.push(events[i]);
		}
		return newEvents;
	}

	return Class({

		/**
		 *
		 * @param events
		 * @param caller
		 */
		on: function(events, caller)
		{
			this._events = this._events || {};

			var that = this;
			eachEvent(events, function(event, namespace)
			{
				if(!that._events[event])
					that._events[event] = [];

				caller.__ns__ = namespace;

				var eventsList = that._events[event];
				eventsList.push(caller);
			});
		},

		/**
		 *
		 * @param events
		 * @param caller
		 */
		one: function(events, caller)
		{
			caller.__one__ = true;
			this.on(events, caller);
		},

		/**
		 *
		 * @param events
		 * @param caller
		 */
		off: function(events, caller)
		{
			if(!this._events) return;

			var that = this;
			eachEvent(events, function(event, namespace)
			{
				if(event)
				{
					that._events[event] =
						removeEvent(that._events[event], caller, namespace);
				}
				else
				{
					for(var k in that._events) if(that._events.hasOwnProperty(k))
					{
						that._events[k] =
							removeEvent(that._events[k], caller, namespace);
					}
				}
			});
		},

		/**
		 *
		 * @param event
		 * @param args...
		 */
		trigger: function(event /*, args...*/)
		{
			if(!this._events || !this._events[event])
				return;

			var args = Array.prototype.slice.call(arguments, 1);

			var events = this._events[event];
			var newEvents = [];

			// Assign new events before the loop as events may add other events within them
			// This way they do not get overwritten.
			this._events[event] = newEvents;

			for(var i = 0; i < events.length; i++)
			{
				var response = events[i].apply(this, args);

				if(!events[i].__one__ && response !== false)
					newEvents.push(events[i]);
			}
		}

	});
});
define('util/support',['util/camelcase'], function(camelcase)
{
	var support = {
		_el: document.createElement('div'),
		_vendors: 'webkit moz ms o'.split(' '),
		_propCache: {},

		cssProperty: function(property, vendor)
		{
			property = camelcase(property);
			
			if(this._propCache.hasOwnProperty(property))
			{
				return this._propCache[property];
			}

			var cache;
			var style = this._el.style;

			if(typeof style[property] == 'string')
			{
				cache = property;
			}
			else if(vendor !== false)
			{
				var vendors = this._vendors;
				for(var i = 0; i < vendors.length; i++)
				{
					var ven = vendors[i];
					var prop = camelcase(ven + '-' + property);

					if(typeof style[prop] == 'string')
					{
						cache = prop;
						break;
					}
				}
			}
			else
			{
				cache = false;
			}

			this._propCache[property] = cache;
			return cache;
		},

		cssValue: function(property, values)
		{
			property = camelcase.undo(property);
			var css;

			if(typeof values == 'string')
			{
				css = property + ':' + values + ';';
			}
			else
			{
				css = [];
				for(var i = 0; i < values.length; i++)
				{
					css.push(property, ':', values[i], ';');
				}
				css = css.join('');
			}

			this._el.style.cssText = css;
			var hasSupport = !!this._el.style.length;
			this._el.style.cssText = '';

			return hasSupport;
		}
	};

	// TODO Test for all common ones
	var testProperties = [
		'transform',
		'transition'
	];

	for(var i = 0; i < testProperties.length; i++)
	{
		var prop = testProperties[i];
		support[prop] = support.cssProperty(prop);
	}

	support.transitionEnd = support.transition && (function(undefined)
	{
		var el = support._el;
		var transitions = {
			'transition': 'transitionend',
			'OTransition': 'otransitionend', // oTransitionEnd in very old Opera
			'MozTransition': 'transitionend',
			'WebkitTransition': 'webkitTransitionEnd'
		};

		for(var i in transitions)
		{
			if(transitions.hasOwnProperty(i) && el.style[i] !== undefined)
				return transitions[i];
		}

		return false;
	}());

	return support;
});
define('util/acceptValue',[],function()
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
define('util/unitNumber',['util/acceptValue'], function(acceptValue)
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
/**
 * Hydro.DOM.Animator
 *
 * A base class for controlling visual states and the transitions between them on an element. It leverages CSS
 * transitions to animate between the states and provides better, more robust control than native transition
 * tools. It supports transitioning to and from auto widths and heights.
 *
 * If CSS transitions are not supported in a browser then no animation takes place, but states will still be
 * switched.
 *
 * A state consists of a unique name, and an object of style properties with values. When a state is set, the
 * new styles on that state are applied to the element, and the old states styles are removed. Any other style
 * properties applied to the element via stylesheets are always applied, unless overridden by a state.
 */

define('dom/animator',['emitter', 'util/support', 'dom/element', 'util/camelcase', 'util/unitNumber'], function(Emitter, Supports, $, camelcase, UnitNumber)
{
	// Transition style properties and events
	var trans     = Supports.transition;
	var transProp = trans;
	var transDur  = trans;
	var transTime = trans;
	var transEnd  = Supports.transitionEnd;

	if(trans)
	{
		transProp += 'Property';
		transDur  += 'Duration';
		transTime += 'TimingFunction';
	}

	/**
	 * Applies an object of styles to an element
	 *
	 * @param element
	 * @param styles
	 */
	function applyStyles(element, styles)
	{
		for(var name in styles) if(styles.hasOwnProperty(name))
		{
			var value = styles[name];

			if(typeof value == 'function')
			{
				value = value.call(element);
			}

			var fn = applyStyles[name];
			if(fn)
			{
				fn(element, value);
			}
			else
			{
				element.style[name] = value;
			}
		}
	}

	/**
	 * Returns the width/height of an element
	 * TODO Weird issue in Firefox where widths/heights only start transitioning after every other has completed... in certain situations
	 *
	 * @param element
	 * @param styles
	 * @returns {*}
	 */
	function getDimensions(element, styles)
	{
		if(!styles)
		{
			return {
				width:  element.offsetWidth,
				height: element.offsetHeight
			};
		}

		var style = element.style;
		var priorStyles = style.cssText;

		style.cssText = '';

		applyStyles(element, styles);

		var dimensions = getDimensions(element);

		style.cssText = priorStyles;
		return dimensions;
	}

	/**
	 * Sets the width/height of an element
	 *
	 * @param element
	 * @param dimensions
	 */
	function setDimensions(element, dimensions)
	{
		var style = element.style || element;
		style.width  = dimensions.width + 'px';
		style.height = dimensions.height + 'px';
	}

	/**
	 *
	 * @param element
	 * @param computed
	 * @param property
	 */
	function applyComputed(element, computed, property)
	{
		var styles = element.style || element;
		var value = computed[property];

		// Apply the value if it's not an empty string
		if(value)
		{
			styles[property] = value;
		}
		// Otherwise we're probably dealing with Firefox, in which case...
		// Empty string means it's a shorthand property, and Firefox doesn't output computed styles for shorthand
		// properties. That means needing to scan all of the other properties to apply the "long"-hand properties.
		// Eg. "border" property is encountered. Apply all "border-left-width", "border-left-style", ... etc. instead.
		else
		{
			// The computed property object is part array, part plain object. Values at indexes store property names,
			// which exist as keys on the object. The values at these keys are the property values.
			// From experimentation, it seems that the properties stored in indexes are only "long"-hand properties.
			for(var i = 0; i < computed.length; i++)
			{
				var key = computed[i];
				if(key.indexOf(property) == 0)
				{
					value = computed[key];
					if(value) styles[key] = value;
				}
			}
		}
	}


	/**
	 * Animator class
	 */
	return Emitter.extend({

		/**
		 * Handling the end of a state transition
		 *
		 * @param e
		 * @private
		 */
		transitionEnd: function(e)
		{
			var element = this.element;
			var state = this.states[this.currentState];

			var styles = {width: '', height: ''};

			if(state.hasOwnProperty('width'))  styles.width  = state.width;
			if(state.hasOwnProperty('height')) styles.height = state.height;

			applyStyles(element, styles);

			this.trigger('animateComplete');
		},

		/**
		 * Constructor
		 *
		 * @param element
		 */
		init: function(element)
		{
			this.$element = $(element);
			this.element = this.$element.el;
			this.states = {};
			this.currentState = false;

			if(trans)
			{
				var that = this;
				this.listening = true;
				this.listener = function(e)
				{
					// Account for parent/child element transition end events
					if(e.target != this) return;

					if(that.listening)
					{
						that.transitionEnd.call(that, e);
						that.listening = false;
					}
				};

				this.element.addEventListener(transEnd, this.listener);
			}
		},

		/**
		 * Helper function that finds and sets the transition properties to the element.
		 *
		 * @param recache - Whether to recache by looking up each property.
		 */
		setProperties: function(recache)
		{
			if(!trans) return;

			var style = this.element.style;

			if(recache !== false || !this.properties)
			{
				var properties = [];
				properties.lookup = {};

				for(var i in this.states) if(this.states.hasOwnProperty(i))
				{
					var state = this.states[i];
					for(var k in state) if(state.hasOwnProperty(k))
					{
						if(!properties.lookup[k])
						{
							properties.lookup[k] = true;
							properties.push( camelcase(k, true) );
						}
					}
				}

				this.properties = properties;
			}

			style[transProp] = this.properties.join(',');
		},

		/**
		 * Sets the transition duration
		 *
		 * @param duration
		 */
		setDuration: function(duration)
		{
			if(!trans) return;

			if(duration)
				this.duration = UnitNumber.parse(duration, 'ms');

			if(this.duration)
				this.element.style[transDur] = this.duration.toString();
		},

		/**
		 * Sets the timing function of the transition
		 *
		 * @param timing
		 */
		setTiming: function(timing)
		{
			if(!trans) return;

			if(timing)
				this.timing = timing;

			if(this.timing)
				this.element.style[transTime] = this.timing;
		},

		/**
		 * Adds a state of styles
		 *
		 * @param name
		 * @param properties
		 */
		addState: function(name, properties)
		{
			this.states[name] = properties || {};
			this.setProperties();

			this.trigger('addState', {state: name});
		},

		/**
		 * Removes a state by it's name
		 *
		 * @param name
		 */
		removeState: function(name)
		{
			delete this.states[name];
			this.setProperties();

			this.trigger('removeState', {state: name});
		},

		/**
		 * Sets the current state.
		 *
		 * @param name
		 * @param animate
		 */
		setState: function(name, animate)
		{
			// Default to false
			animate = (animate !== false);

			var state = this.states[name];
			var element = this.element;
			var $element = this.$element;
			var startDimensions;
			var endDimensions;
			var startStyles;
			var k;

			var prevState = this.currentState;
			this.currentState = name;
			this.listening = true;

			if(animate && $element.isDisplayed())
			{
				var propLookup = this.properties.lookup;
				var targetDimensions = propLookup.width || propLookup.height;
				// TODO better target detection - Lookup if at any point a width or height has to transition from auto to a fixed value... may be difficult

				if(targetDimensions)
				{
					startStyles = {};

					if(prevState)
					{
						var currState = this.states[prevState];
						for(k in currState) if(currState.hasOwnProperty(k))
						{
							// I'll be honest, I'm not totally sure why this if
							// statement fixed some weird bug in IE, I might be
							// able to find out why if I tried, but it's working
							// so what's the point?
							if(k != 'width' && k != 'height')
								startStyles[k] = currState[k];
						}
					}

					var computed = getComputedStyle(element);

					var lookup = this.properties.lookup;
					for(k in lookup) if(lookup.hasOwnProperty(k))
					{
						// Ignore width and height because we get/set them independently
						// This is because getComputedProperties() in IE returns widths
						// and heights based on the content box model, even when it's
						// been changed.
						if(k != 'width' && k != 'height')
							applyComputed(startStyles, computed, k);
					}

					startDimensions = getDimensions(element);
					endDimensions = getDimensions(element, state);
				}

				element.style.cssText = '';

				if(targetDimensions)
				{
					setDimensions(element, startDimensions);
					applyStyles(element, startStyles);

					$element.repaint();

					element.style.cssText = '';
				}

				this.setProperties(false);
				this.setDuration();
				this.setTiming();
			}
			else
			{
				element.style.cssText = '';
			}

			applyStyles(element, state);

			if(endDimensions)
				setDimensions(element, endDimensions);

			this.trigger('setState', {state: name, prevState: prevState});
		}
	});
});
define('dom/toggler',['settings', 'dom/element', 'dom/animator', 'util/prefixClass', 'util/camelcase'], function(Settings, $, Animator, prefixClass, camelcase)
{
	var defaultDuration = Settings.animate.duration;
	var defaultTiming   = Settings.animate.timing;

	// Prefixed classes for adding to and removing from the element being toggled
	var classes = {
		all:     prefixClass('state', 'open opening closing closed'),
		open:    prefixClass('state', 'open'),
		opening: prefixClass('state', 'opening'),
		closed:  prefixClass('state', 'closed'),
		closing: prefixClass('state', 'closing')
	};

	/**
	 * Animatable property definitions
	 */
	var Animate = {

		/**
		 * Opacity
		 * Fade in and out
		 */
		opacity: {
			close: { opacity: 0 }
		},

		/**
		 * Width
		 */
		width: {
			close: {
				width: 0,
				paddingLeft:     0, paddingRight:     0,
				borderLeftWidth: 0, borderRightWidth: 0,
				marginLeft:      0, marginRight:      0
			}
		},

		/**
		 * Height
		 */
		height: {
			close: {
				height: 0,
				paddingTop:     0, paddingBottom:     0,
				borderTopWidth: 0, borderBottomWidth: 0,
				marginTop:      0, marginBottom:      0
			}
		}
	};

	/**
	 * 
	 * @param $element
	 * @param cls
	 */
	function setClass($element, cls)
	{
		if(Settings.injectClasses)
		{
			$element
				.removeClass(classes.all)
				.addClass(classes[cls]);
		}
	}

	/**
	 *
	 * @param $element
	 * @param on
	 */
	function setDisplay($element, on)
	{
		$element.el.style.display = (on === false ? 'none' : '');

		// Probably overkill but it'll keep some obscure, nasty bugs at bay
		$element.repaint();
	}

	/**
	 * Toggler class
	 */
	var Toggler = Animator.extend({

		/**
		 *
		 * @param e
		 */
		transitionEnd: function(e)
		{
			if(!this._open && this.display) setDisplay(this.$element, false);

			setClass(this.$element, this._open ? 'open' : 'closed');
			this.trigger(this._open ? 'openComplete' : 'closeComplete');

			Animator.fn.transitionEnd.call(this, e);
		},

		/**
		 *
		 * @param element
		 * @param open
		 */
		init: function(element, open)
		{
			// Default to true
			open = (open !== false);

			Animator.fn.init.call(this, element);

			this.setDisplayToggle(true);
			this.toggle(open);
		},

		/**
		 *
		 * @param display
		 */
		setDisplayToggle: function(display)
		{
			this.display = !!display;
		},

		/**
		 * TODO Support multiple types!
		 * @param type
		 * @param duration
		 * @param timing
		 */
		setAnimate: function(type, duration, timing)
		{
			duration = duration || this.duration || defaultDuration;
			timing   = timing   || this.timing   || defaultTiming;

			var animateProps = this.constructor.animate || Animate;
			var isType = typeof type;

			type = isType == 'string' ? camelcase(type) : type;

			if(isType == 'object')
			{
				this.animate = type;
			}
			else if(isType == 'string' && animateProps.hasOwnProperty(type))
			{
				this.animate = animateProps[type];
			}
			else
			{
				throw new Error('No animation type "' + type + '" exists.')
			}

			this.states.open  = this.animate.open  || {};
			this.states.close = this.animate.close || {};

			this.setProperties();
			this.setDuration(duration);
			this.setTiming(timing);

			// Reset toggled state
			var isOpen = this._open;
			this._open = null;
			this.toggle(isOpen, false);
		},

		/**
		 *
		 * @param animate
		 */
		open: function(animate)
		{
			if(this._open === true) return;

			// Default to true
			animate = (animate !== false);

			this._open = true;

			if(this.display) setDisplay(this.$element, true);

			if(this.animate)
			{
				this.setState('open', animate);

				if(animate)
				{
					setClass(this.$element, 'opening');
					this.trigger('openStart');
				}
				else
				{
					setClass(this.$element, 'open');
					this.trigger('openComplete');
				}
			}
			else
			{
				setClass(this.$element, 'open');
				this.trigger('openComplete');
			}
		},

		/**
		 *
		 * @param animate
		 */
		close: function(animate)
		{
			if(this._open === false) return;

			// Default to true
			animate = (animate !== false);

			this._open = false;

			if(this.animate)
			{
				this.setState('close', animate);

				if(animate)
				{
					setClass(this.$element, 'closing');
					this.trigger('closeStart');
				}
				else
				{
					if(this.display) setDisplay(this.$element, false);
					setClass(this.$element, 'closed');
					this.trigger('closeComplete');
				}
			}
			else
			{
				if(this.display) setDisplay(this.$element, false);
				setClass(this.$element, 'closed');
				this.trigger('closeComplete');
			}
		},

		/**
		 *
		 * @param open
		 * @param animate
		 */
		toggle: function(open, animate)
		{
			open = typeof open == 'boolean' ? open : !this._open;

			if(open)
			{
				this.open(animate);
			}
			else
			{
				this.close(animate);
			}
		},

		/* TODO
		sync: function(toggler)
		{

		},

		unsync: function(toggler)
		{

		}
		*/
	});

	Toggler.animate = Animate;

	return Toggler;
});
define('dom/selector',['settings', 'dom/element', 'emitter', 'dom/toggler', 'util/prefixClass'], function(Settings, $, Emitter, Toggler, prefixClass)
{
	// Prefixed classes for adding to and removing from the element being selected
	var classes = {
		selected: prefixClass('state', 'selected')
	};

	/**
	 *
	 * @param toggler
	 * @param selected
	 */
	function setClass(toggler, selected)
	{
		if(Settings.injectClasses)
		{
			if(toggler)
			{
				if(selected)
					toggler.$element.addClass(classes.selected);
				else
					toggler.$element.removeClass(classes.selected);
			}
		}
	}

	/**
	 * Selector
	 */
	return Emitter.extend({

		/**
		 *
		 */
		init: function()
		{
			this.togglers = {};
			this.selected = false;
			this.chain = false;
		},

		setAnimate: function(type, duration, timing)
		{
			this.animate = [type, duration, timing];
		},

		/**
		 *
		 * @param name
		 * @param toggler
		 * @param selected
		 */
		addToggler: function(name, toggler, selected)
		{
			// Default to false
			selected = (selected === true);

			toggler.toggle(selected, false);
			this.togglers[name] = toggler;

			if(selected)
				this.select(name, false);
		},

		/**
		 *
		 * @param name
		 * @param element
		 * @param selected
		 */
		addElement: function(name, element, selected)
		{
			// Default to false
			selected = (selected === true);

			var toggler = new Toggler(element, selected);

			if(this.animate)
			{
				// Could use .apply() but this is more explicit and obvious
				toggler.setAnimate(
					this.animate[0],
					this.animate[1],
					this.animate[2]
				);
			}

			this.addToggler(name, toggler, selected);
		},

		/**
		 *
		 * @param name
		 */
		removeToggler: function(name)
		{
			delete this.togglers[name];

			if(this.selected === name)
				this.selected = false;
		},

		/**
		 *
		 * @param name
		 */
		removeElement: function(name)
		{
			this.removeToggler(name);
		},

		/**
		 *
		 * @param chain
		 */
		setChain: function(chain)
		{
			this.chain = !!chain;
		},

		/**
		 *
		 * @param name
		 * @param animate
		 */
		select: function(name, animate)
		{
			// Default to true
			animate = (animate !== false);

			var prevToggler = this.togglers[this.selected];
			var nextToggler = this.togglers[name];

			this.selected = name;

			setClass(prevToggler, false);
			setClass(nextToggler, true);

			if(prevToggler)
			{ 
				prevToggler.close(animate);

				if(nextToggler)
				{
					if(animate && this.chain)
					{
						prevToggler.one('closeComplete', function()
						{
							nextToggler.open();
						});
					}
					else
					{
						nextToggler.open(animate);
					}
				}
			}
			else if(nextToggler)
			{
				nextToggler.open(animate);
			}

			this.trigger('select', {selected: this.selected});
		},

		/**
		 *
		 * @param name
		 * @returns {boolean}
		 */
		isSelected: function(name)
		{
			return this.selected === name;
		}

	});
});
define('util/frame',[],function()
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
define('dom/anchor',['dom/element', 'emitter', 'util/frame', 'util/acceptValue', 'util/support'], function($, Emitter, Frame, acceptValue, Supports)
{
	var applyPosition;

	if(Supports.transform)
	{
		applyPosition = function(element, x, y)
		{
			x |= 0;
			y |= 0;

			var style = element.style;

			style.left = 0;
			style.top = 0;
			style.transform = 'translate(' + x + 'px,' + y + 'px)';
		};
	}
	else
	{
		applyPosition = function(element, x, y)
		{
			x |= 0;
			y |= 0;

			var style = element.style;

			style.left = x + 'px';
			style.top = y + 'px';
		};
	}

	/**
	 * Anchor Panel
	 * TODO Setting anchor dimensions (x, y, x&y)
	 * TODO Setting anchor to mouse
	 */
	return Emitter.extend({

		/**
		 *
		 * @param element
		 * @param target
		 */
		init: function(element, target)
		{
			this.$element = $(element);
			this.element = this.$element.el;

			this.element.style.position = 'absolute';

			this.setTarget(target);
			this.setPosition();
			this.setAlignment();
			this.setOffset();

			this.start();
		},

		/**
		 *
		 */
		start: function()
		{
			if(this.started) return;
			this.started = true;

			var that = this;
			this.interval = Frame.interval(function()
			{
				that.update();
			});
		},

		/**
		 *
		 */
		stop: function()
		{
			if(!this.started) return;
			this.started = false;

			Frame.cancel(this.interval);
		},

		/**
		 *
		 * @param extraX
		 * @param extraY
		 */
		update: function(extraX, extraY)
		{
			// If the element is invisible then don't bother
			if(!this.$element.isVisible() || !this.$target.isVisible()) return;

			// Setting up

			var targetPos    = this.$target.offset();
			var targetX      = targetPos.left;
			var targetY      = targetPos.top;
			var targetWidth  = this.target.offsetWidth;
			var targetHeight = this.target.offsetHeight;
			var anchorWidth  = this.element.offsetWidth;
			var anchorHeight = this.element.offsetHeight;

			// Basic panel positioning - start at the target then apply any offsets

			var anchorX = targetX + this.offsetX + (extraX | 0);
			var anchorY = targetY + this.offsetY + (extraY | 0);

			// Alignment

			var isVertical = this.position == 'top' || this.position == 'bottom';

			var elementOffset = this.elementAlign * (isVertical ? anchorWidth : anchorHeight);
			var targetOffset  = this.targetAlign  * (isVertical ? targetWidth : targetHeight);

			if(isVertical)
				anchorX += (targetOffset - elementOffset);
			else
				anchorY += (targetOffset - elementOffset);

			// Positioning

			switch(this.position)
			{
				default:
				case 'top':
					anchorY -= anchorHeight;
					break;
				case 'bottom':
					anchorY += targetHeight;
					break;
				case 'left':
					anchorX -= anchorWidth;
					break;
				case 'right':
					anchorX += targetWidth;
					break;
			}

			// Apply the position

			applyPosition(this.element,
				Math.round(anchorX),
				Math.round(anchorY)
			);

			// Ensure that even when the element is within a different positioning context,
			// the panel still lines up with the target element.

			// It's better to do it this way as it prevents unnecessary layout thrashing.
			// Previously I was resetting it's position back to (0,0) and reading back the
			// position to use as an offset.

			// This implementation only writes back if it has to, meaning it doesn't have
			// to cause a second layout redraw every frame if it doesn't have to.

			var newAnchorPosition = this.$element.offset();
			var newAnchorX = newAnchorPosition.left;
			var newAnchorY = newAnchorPosition.top;

			// Give it a 1px leeway.
			if(Math.abs(newAnchorX - anchorX) > 1 || Math.abs(newAnchorY - anchorY) > 1)
			{
				anchorX += (anchorX - newAnchorX);
				anchorY += (anchorY - newAnchorY);

				applyPosition(this.element,
					Math.round(anchorX),
					Math.round(anchorY)
				);
			}
		},

		/**
		 *
		 * @param target
		 */
		setTarget: function(target)
		{
			this.$target = $(target);
			this.target  = this.$target.e;
		},

		/**
		 *
		 * @param position
		 */
		setPosition: function(position)
		{
			this.position = acceptValue(position, 'top bottom left right', 'top');
		},

		/**
		 *
		 * @param align
		 */
		setAlignment: function(align)
		{
			this.setElementAlignment(align);
			this.setTargetAlignment(align);
		},

		/**
		 *
		 * @param align
		 */
		setElementAlignment: function(align)
		{
			if(typeof align != 'number')
			{
				align = acceptValue(align, 'start center end', 'center');
				align = ({start: 0, center: .5, end: 1})[align];
			}

			this.elementAlign = align;
		},

		/**
		 *
		 * @param align
		 */
		setTargetAlignment: function(align)
		{
			if(typeof align != 'number')
			{
				align = acceptValue(align, 'start center end', 'center');
				align = ({start: 0, center: .5, end: 1})[align];
			}

			this.targetAlign = align;
		},

		/**
		 *
		 * @param x
		 * @param y
		 */
		setOffset: function(x, y)
		{
			this.setOffsetX(x);
			this.setOffsetY(y);
		},

		/**
		 *
		 * @param x
		 */
		setOffsetX: function(x)
		{
			this.offsetX = x | 0;
		},

		/**
		 *
		 * @param y
		 */
		setOffsetY: function(y)
		{
			this.offsetY = y | 0;
		}
	})
});
define('dom',['require','dom/ready','dom/element','dom/animator','dom/toggler','dom/selector','dom/anchor'],function(require)
{
	return {
		Ready:    require('dom/ready'),
		Element:  require('dom/element'),
		Animator: require('dom/animator'),
		Toggler:  require('dom/toggler'),
		Selector: require('dom/selector'),
		Anchor:   require('dom/anchor')
	};
});
define('util',['require','util/acceptValue','util/camelcase','util/prefixClass','util/support','util/frame','util/unitNumber'],function(require)
{
	return {
		acceptValue:    require('util/acceptValue'),
		camelcase:      require('util/camelcase'),
		prefixClass:    require('util/prefixClass'),
		support:        require('util/support'),
		frame:          require('util/frame'),
		unitNumber:     require('util/unitNumber')
		//parser:         require('util/parser')
	};
});
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