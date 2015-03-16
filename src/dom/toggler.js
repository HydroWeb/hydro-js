define(['settings', 'dom/element', 'dom/animator', 'util/prefixClass', 'util/camelcase'], function(Settings, $, Animator, prefixClass, camelcase)
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
			setDisplay(this.$element, true);
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