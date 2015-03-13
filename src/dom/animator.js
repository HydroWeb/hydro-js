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

define(['emitter', 'util/support', 'dom/element', 'util/camelcase', 'util/unitNumber'], function(Emitter, Supports, $, camelcase, UnitNumber)
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