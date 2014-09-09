module.exports = function(grunt) {

    var filenames = ['./src/itick.js', 'Gruntfile.js'];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            dist: {
                files: {
                    './dist/itick.min.js': ['./src/itick.js']
                },
                options: {
                    banner: '/*! <%= pkg.name %> by <%= pkg.author %> - v<%= pkg.version %> - Generated: <%= grunt.template.today("dd-mm-yyyy") %> */',
                    mangle: true,
                    compress: {
                      drop_console: true
                    }
                },
            },
            src: {
                files: {
                    './dist/itick.js': ['./src/itick.js']
                },
                options: {
                    preserveComments: true,
                    beautify: true,
                    indent: 4,
                    mangle: false,
                    compress: false,
                    nm: true,
                    nmf: true,
                    ns: true
                }
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporterOutput: './src/jshint.txt'
            }
        },
        focus: {
            all: {}
        },
        watch: {
            compile: {
                files: filenames,
                tasks: [
                    'jshint',
                    'uglify:src',
                    'uglify:dist'
                ],
                options: {
                    nospawn: true
                }
            }
        }
    });

    // grunt.loadNpmTasks('grunt-contrib-copy');
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