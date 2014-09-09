module.exports = function(grunt) {

	var filenames = ['src/itick.js'];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - Generated: <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        options: {
          mangle: true,
          compress: true,
          sourceMap: true,
          wrap: true,
        },
        files: {
          'dist/itick.min.js': filenames
        }
      },
      src: {
        options: {
          beautify: true
        },
        files: {
          'src/itick.js': filenames
        }
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      with_defaults: filenames
    },
    focus: {
      all: {}
    },
    watch: {
      compile: {
        files: filenames,
        tasks: [
          'jshint',
          'uglify'
        ],
        options: {
          nospawn: true
        }
      },
      compile: {
        files: filenames,
        tasks: [
          'jshint',
          'uglify'
        ],
        options: {
          nospawn: true
        }
      },
  	}
	});


  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-focus');

  grunt.registerTask('default', [
  	'jshint',
  	'uglify'
	]);

	grunt.registerTask('watch-all', [
		'focus:all'
	]);
};
