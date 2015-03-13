/**
 * Hydro.Settings
 */
 
define({
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