var browserify = require('browserify'),
    watchify = require('watchify'),
    babelify = require('babelify'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    editorSource = 'app/editor/public/js/main.js',
    editorDestFolder = 'app/editor/public/bundle/',
    editorDestFile = 'editor-bundle.js',
    gameSource = 'app/game/public/js/game.js',
    gameDestFolder = 'app/game/public/bundle/',
    gameDestFile = 'runtime-bundle.js',
    server = require('./server.js');

gulp.task('browserify-editor', function() {
  return browserify(editorSource, {debug:true})
  .transform(babelify, { presets: ['react','es2015']})
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
  var bundler = watchify(browserify(editorSource, {debug:true})).transform(babelify, { presets: ['react','es2015']});
  bundler.on('update', rebundle);
  bundler.on('log', function(msg) {
    console.log('update! ' + new Date());
  });

  function rebundle() {
    return bundler.bundle()
      .on('error', function(err){
        console.log(err.message);
        this.emit('end');
      })
      .pipe(source(editorDestFile))
      .pipe(gulp.dest(editorDestFolder));
  }

  return rebundle();
});

gulp.task('watch-game', function() {
  var bundler = watchify(browserify(gameSource, {debug:true}));
  bundler.on('update', rebundle);
  bundler.on('log', function(msg) {
    console.log('update! ' + new Date());
  });
  
  function rebundle() {
    return bundler.bundle()
      .on('error', function(err){
        console.log(err.message);
        this.emit('end');
      })
      .pipe(source(gameDestFile))
      .pipe(gulp.dest(gameDestFolder));
  }

  return rebundle();
});

gulp.task('express', function () {
  server.serve();
});

gulp.task('default', ['watch-editor', 'watch-game', 'express']);