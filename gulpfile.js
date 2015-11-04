var browserify = require('browserify'),
    watchify = require('watchify'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    sourceFile = 'app/editor/public/js/main.js',
    destFolder = 'app/editor/public/js/',
    destFile = 'cwine-editor.js',
    server = require('./server.js');


gulp.task('browserify', function() {
  return browserify(sourceFile, {debug:true})
  .bundle()
  .pipe(source(destFile))
  .pipe(gulp.dest(destFolder));
});

gulp.task('watch', function() {
  var bundler = watchify(browserify(sourceFile, {debug:true}));
  bundler.on('update', rebundle);

  function rebundle() {
    return bundler.bundle()
      .pipe(source(destFile))
      .pipe(gulp.dest(destFolder));
  }

  return rebundle();
});

gulp.task('express', function () {
  server.server();
});

gulp.task('default', ['browserify', 'watch', 'express']);