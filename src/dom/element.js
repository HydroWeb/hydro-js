/**
 * Hydro.DOM.Element
 * 
 * A jQuery-like DOM element wrapper that adds methods and extra functionality. In contrast to jQuery, the
 * element method only deals with single elements. This module is not intended to be a replacement for jQuery,
 * as it is mostly for internal use. However it works quite well for basic DOM querying and modification.
 */

define(['util/camelcase'], function(camelcase)
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