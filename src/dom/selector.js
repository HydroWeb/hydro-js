define(['settings', 'dom/element', 'emitter', 'dom/toggler', 'util/prefixClass'], function(Settings, $, Emitter, Toggler, prefixClass)
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