var gulp          = require('gulp'),
    prettify      = require('gulp-prettify'),
//  sass          = require('gulp-sass'),
//  sassLint      = require('gulp-sass-lint'),
    autoprefixer  = require('gulp-autoprefixer'),
    cleancss      = require('gulp-clean-css'),
    jshint        = require('gulp-jshint'),
    uglify        = require('gulp-uglify'),
    changed       = require('gulp-changed'),
    imagemin      = require('gulp-imagemin'),
    browserSync   = require('browser-sync'),
    watch         = require('gulp-watch'),
    runSequence   = require('run-sequence');

// HTML
gulp.task('tools:html', function() {
  return gulp.src('public/**/*.html')
    .pipe(prettify({
      indent_size: 2
    }))
    .pipe(gulp.dest('public/'));
});

// CSS
gulp.task('tools:css', function() {
  return gulp.src('public/assets/css/**/*.css')
    .pipe(autoprefixer('last 2 version'))
    .pipe(cleancss({
      advanced: false,
    //format: 'beautify'
    }))
    .pipe(gulp.dest('public/assets/css/'));
});

// JavaScript
gulp.task('tools:js', function() {
  return gulp.src('public/assets/js/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(uglify())
    .pipe(gulp.dest('public/assets/js/'));
});

// Run all one after another
gulp.task('tools:all', function(cb) {
  runSequence(['tools:html', 'tools:css', 'tools:js'], cb);
});