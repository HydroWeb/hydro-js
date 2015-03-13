define(['util/camelcase'], function(camelcase)
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