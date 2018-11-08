const gulp = require('gulp');
const prettify = require('gulp-prettify');
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify');
//const changed = require('gulp-changed');
//const imagemin = require('gulp-imagemin');
//const browserSync = require('browser-sync');
//const watch = require('gulp-watch');
const runSequence = require('run-sequence');

// HTML
gulp.task('tools:html', () => {
  return gulp
    .src('public/**/*.html')
    .pipe(
      prettify({
        indent_size: 2
      })
    )
    .pipe(gulp.dest('public/'));
});

// CSS
gulp.task('tools:css', () => {
  return gulp
    .src(['public/assets/css/**/*.css', '!public/assets/css/**/*.min.css'])
    .pipe(autoprefixer('last 2 version'))
    .pipe(
      cleancss({
        advanced: false
        //format: 'beautify'
      })
    )
    .pipe(gulp.dest('public/assets/css/'));
});

// JavaScript
gulp.task('tools:js', () => {
  return (
    gulp
      .src(['public/assets/js/**/*.js', '!public/assets/js/**/*.min.js'])
      //.pipe(eslint())
      //.pipe(eslint.format())
      //.pipe(eslint.failAfterError)
      .pipe(uglify())
      .pipe(gulp.dest('public/assets/js/'))
  );
});

// Run all one after another
gulp.task('tools:all', cb => {
  runSequence(['tools:html', 'tools:css', 'tools:js'], cb);
});
