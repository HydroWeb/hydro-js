define(['dom/element', 'emitter', 'dom/toggler', 'util/support'], function($, Emitter, Toggler)
{
	return Emitter.extend({

		init: function(container, content, panel, open)
		{
			this.$container = $(container);
			this.container = this.$container.e;

			this.$content = $(content);
			this.content = this.$content.e;

			this.$panel = $(panel);
			this.panel = this.$panel.e;

			this.togglers = {
				panel: new Toggler(this.$panel, open),

			};
		}
	});
});