const gulp = require('gulp');
const browserSync = require('browser-sync');
const del = require('del');
const wiredep = require('wiredep').stream;
const buffer = require('vinyl-buffer'); // TODO: needed???
const source = require('vinyl-source-stream'); // TODO: needed???
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const WebpackDevServer = require('webpack-dev-server');
const webpackDevMiddleware = require('webpack-dev-middleware');
const stripAnsi = require('strip-ansi');

const gulpLoadPlugins = require('gulp-load-plugins');
const $ = gulpLoadPlugins();

// process stylesheets
gulp.task('styles', () => {
  // grab all sass files
  return gulp.src('app/styles/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(browserSync.reload({stream: true}));
});

// process javascript source files
gulp.task('scripts', () => {
  // provide webpack config file.
  return gulp.src('app/scripts/main.js')
    .pipe(webpackStream(require('./webpack.config.js')))
    .pipe(gulp.dest('.tmp/scripts'));

  // const b = browserify("app/scripts/main.js", { debug: true })
  //   .transform('babelify', { presets: ["es2015"]});
  //
  // return b.bundle()
  //   .pipe(source('bundle.js'))
  //   .pipe($.plumber())
  //   .pipe(buffer())
  //   .pipe(gulp.dest('.tmp/scripts'))
  //   .pipe(browserSync.reload({stream: true}));
});

function lint(files, options) {
  return gulp.src(files)
    .pipe(browserSync.reload({
      stream: true,
      once: true
    }))
    .pipe($.eslint(options))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

// run eslint on source files
gulp.task('lint', () => {
  return lint('app/scripts/**/*.js', {
    fix: true
  })
    .pipe(gulp.dest('app/scripts'));
});

// run eslint on test files
gulp.task('lint:test', () => {
  return lint('test/spec/**/*.js', {
    fix: true,
    env: {
      mocha: true
    }
  })
    .pipe(gulp.dest('test/spec/**/*.js'));
});

// process html files
gulp.task('html', ['styles', 'scripts'], () => {
  return gulp.src('app/*.html')
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.cssnano({safe: true, autoprefixer: false})))
    .pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))
    .pipe(gulp.dest('dist'));
});

// process image files, running imagemin on them
gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('dist/images'));
});

// process fonts
gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {})
    .concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

// copy any extras into the dist folder
gulp.task('extras', () => {
  return gulp.src([
    'app/*.*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

// clean up stuff
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

// start a development server and watch for file changes
gulp.task("serve", function(callback) {
  // create webpack bundler
  var webpackConfig = require('./webpack.config');
  var bundler = webpack(webpackConfig);
  var server = browserSync.create();

  // reload all devices when bundle is complete
  // or send a fullscreen error message
  bundler.plugin('done', function (stats) {
    if (stats.hasErrors() || stats.hasWarnings()) {
      return server.sockets.emit('fullscreen:message', {
        title: "Webpack Error:",
        body:  stripAnsi(stats.toString()),
        timeout: 100000
      });
    }
    server.reload();
  });

  // Run server and use middleware for Hot Module Replacement
  server.init({
    open: 'local',
    notify: false,
    port: 9000,

    // file server setup
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components'
      }
    },

    // don't log file changes
    logFileChanges: false,

    // webpack middleware configuration
    middleware: [
      webpackDevMiddleware(bundler, {
        publicPath: webpackConfig.output.publicPath,
        stats: { colors: true }
      })
    ],

    plugins: ['bs-fullscreen-message'],

    // files to watch
    files: [
      'app/css/*.css',
      'app/*.html'
    ]
  });
});

// start a server using the distribution files
gulp.task('serve:dist', () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

// start a server and run the test suite
gulp.task("serve:test", () => {
  var webpackConfig = require('./webpack.config');
  var bundler = webpack(webpackConfig);
  var server = browserSync.create();

  bundler.plugin('done', function (stats) {
    if (stats.hasErrors() || stats.hasWarnings()) {
      return server.sockets.emit('fullscreen:message', {
        title: "Webpack Error:",
        body:  stripAnsi(stats.toString()),
        timeout: 100000
      });
    }
    server.reload();
  });

  server.init({
    open: 'local',
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': '.tmp/scripts',
        '/bower_components': 'bower_components',
        '/sinon': 'node_modules/sinon/pkg'
      }
    },
    logFileChanges: false,
    middleware: [
      webpackDevMiddleware(bundler, {
        publicPath: webpackConfig.output.publicPath,
        stats: { colors: true }
      })
    ],
    plugins: ['bs-fullscreen-message'],
    files: [
      'app/css/*.css',
      'app/*.html'
    ]
  });
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/styles/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));

  gulp.src('app/*.html')
    .pipe(wiredep({
      exclude: ['bootstrap-sass'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

// build the distribution files
gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], () => {
  gulp.start('build');
});
