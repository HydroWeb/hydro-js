define(['dom/element', 'emitter', 'util/frame', 'util/acceptValue', 'util/support'], function($, Emitter, Frame, acceptValue, Supports)
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