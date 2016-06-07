/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    dirTmp: '.tmp/',
    dirRelease: 'build/release/',
    dirDebug: 'build/debug/',
    dirTest: 'test/',
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',

    // Task configuration.


    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      prod: {
        files: {
          '<%= dirRelease %>app.js': '<%= dirTmp %>app.js'
        }
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },

    browserify: {
      dev: {
        options: {
          browserifyOptions: {
            debug: true
          }
        },
        src: ['src/main.js'],
        dest: '<%= dirDebug %>app.js'
      },
      prod: {
        files: {
          '<%= dirTmp %>app.js': 'src/main.js'
        }
      },
      test: {
        options: {
          browserifyOptions: {
            debug: true
          }
        },
        src: ['src/fsm.js'],
        dest: '<%= dirTest %>app.js'
      }
    },

    watch: {
      // watch lib and src files, then browserify them for dev
      dev: {
        files: [
          './src/**/*.js'
        ],
        tasks: [
          'browserify:dev'
        ],
        options: {
          livereload: true,
          spawn: false,
          atBegin: true
        }
      },
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        tasks: ['jshint:lib_test', 'qunit']
      },
      test: {
        options: {
          spawn: true,
          interrupt: true,
          debounceDelay: 250,
        },
        files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.test.js'],
        tasks: ['browserify:test', 'mocha']
      }
    },

    connect: {
      dev: {
        options: {
          port: 3001,
          base: '.'
        }
      }
    },

    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['lib/<%= pkg.name %>.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },

    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          jQuery: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: ['lib/**/*.js', 'test/**/*.js']
      }
    },

    qunit: {
      files: ['test/**/*.html']
    },

    // Mocha
    mocha: {
      all: {
        src: ['test/testrunner.html'],
      },
      options: {
        //reporter: 'dot',
        reporter: 'spec',
        // reporter: 'list',
        // reporter: 'progress',
        run: true,
        log: true,
        logErrors: true,
        growlOnSuccess: true
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-mocha');

  // Default task.
  // grunt.registerTask('default', ['jshint', 'qunit', 'concat', 'uglify']);

  grunt.registerTask('debug', [
    'browserify:dev'
  ]);

  grunt.registerTask('server', [
    'browserify:dev',
    'connect:dev',
    'watch:dev'
  ]);

  grunt.registerTask('release', [
    'browserify:prod',
    'uglify:prod'
  ]);

  grunt.registerTask('default', [
    'debug'
  ]);

  grunt.registerTask('test', [
    'browserify:test',
    'mocha'
  ]);
};
