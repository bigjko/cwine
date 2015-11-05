var browserify = require('browserify'),
    watchify = require('watchify'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    editorSource = 'app/editor/public/js/main.js',
    editorDestFolder = 'app/editor/public/js/',
    editorDestFile = 'cwine-editor.js',
    gameSource = 'app/game/public/js/game.js',
    gameDestFolder = 'app/game/public/js/',
    gameDestFile = 'cwine-runtime.js',
    server = require('./server.js');


gulp.task('browserify-editor', function() {
  return browserify(editorSource, {debug:true})
  .bundle()
  .pipe(source(editorDestFile))
  .pipe(gulp.dest(editorDestFolder));
});

gulp.task('browserify-game', function() {
  return browserify(gameSource, {debug:true})
  .bundle()
  .pipe(source(gameDestFile))
  .pipe(gulp.dest(gameDestFolder));
});

gulp.task('watch-editor', function() {
  var bundler = watchify(browserify(editorSource, {debug:true}));
  bundler.on('update', rebundle);

  function rebundle() {
    return bundler.bundle()
      .pipe(source(editorDestFile))
      .pipe(gulp.dest(editorDestFolder));
  }

  return rebundle();
});

gulp.task('watch-game', function() {
  var bundler = watchify(browserify(gameSource, {debug:true}));
  bundler.on('update', rebundle);

  function rebundle() {
    return bundler.bundle()
      .pipe(source(gameDestFile))
      .pipe(gulp.dest(gameDestFolder));
  }

  return rebundle();
});

gulp.task('express', function () {
  server.serve();
});

gulp.task('default', ['browserify-editor', 'browserify-game', 'watch-editor', 'watch-game', 'express']);