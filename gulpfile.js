var browserify = require('browserify'),
    watchify = require('watchify'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    sourceFile = 'app/editor/public/js/main.js',
    destFolder = 'app/editor/public/js/',
    destFile = 'cwine-editor.js';

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
  var express = require("express");
  var app = express();
  var path = __dirname + '/';
  //var editor = require(path + "app/editor/js/editor.js");
  // respond with "Hello World!" on the homepage
  app.get('/', function (req, res) {
    res.sendFile(path + 'app/game/views/index.html');
  });

  app.get('/edit', function (req, res) {
    res.sendFile(path + 'app/editor/views/index.html');
  });

  app.use(express.static('app/shared/public'));
  app.use(express.static('app/editor/public'));
  app.use(express.static('app/game/public'));


  app.use('*', function (req, res) {
    res.sendFile(path + 'app/shared/views/error/404.html');
  });

  app.listen(8080,function(){
    console.log("Live at Port 8080");
  });
});

gulp.task('default', ['browserify', 'watch', 'express']);