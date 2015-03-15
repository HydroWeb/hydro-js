module.exports = function(grunt)
{
	var pkg = grunt.file.readJSON('package.json');

	grunt.initConfig({
		pkg: pkg,
		ver: pkg.version,
		requirejs: {
			compile: {
				options: {
					// namespace: 'hydro',
					baseUrl: 'src/',
					keepBuildDir: true,
					name: 'libs/almond',
					include: ['main'],
					out: 'dist/hydro.js',
					skipModuleInsertion: true,
					preserveLicenseComments: false,
					optimize: 'none',
					wrap: {
						startFile: 'src/start.frag',
						endFile: 'src/end.frag'
					}
				}
			}
		},

		uglify: {
			options: {
				sourceMap: true,
				banner: '/*! HydroJS <%= pkg.version %> | MIT License | hydroweb.io */'
			},
			my_target: {
				files: {
					'dist/hydro.min.js' : 'dist/hydro.js'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', ['requirejs', 'uglify']);
};