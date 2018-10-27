'use strict';

var gulp = require('gulp');
var del = require('del');
var jsontf = require('gulp-json-transform');
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var tinylr = require('tiny-lr');

// Copy static folders to build directory
gulp.task('update-static', function() {
    del('build/*/assets/icons/*');
    gulp.src('src/assets/icons/**')
        .pipe(gulp.dest('build/chrome/assets/icons'))
        .pipe(gulp.dest('build/firefox/assets/icons'));

    del('build/*/assets/images/*');
    gulp.src('src/assets/images/**')
        .pipe(gulp.dest('build/chrome/assets/images'))
        .pipe(gulp.dest('build/firefox/assets/images'));

    del('build/*/assets/vendor/*');
    gulp.src('src/scripts/vendor/*.js')
        .pipe(gulp.dest('build/chrome/scripts/vendor'))
        .pipe(gulp.dest('build/firefox/scripts/vendor'));

    gulp.src('node_modules/@fortawesome/fontawesome-free/css/*')
        .pipe(gulp.dest('build/chrome/styles/vendor/css'))
        .pipe(gulp.dest('build/firefox/styles/vendor/css'));

    gulp.src('node_modules/@fortawesome/fontawesome-free/webfonts/*')
        .pipe(gulp.dest('build/chrome/styles/vendor/webfonts/'))
        .pipe(gulp.dest('build/firefox/styles/vendor/webfonts/'));


    del('build/*/manifest.json');
    return gulp.src('src/manifest.json')
        .pipe(gulp.dest('build/chrome'))
        .pipe(jsontf(function(data, file) {
            data.applications = {
                "gecko": {
                    "id": "gameofspoilslite@brettp.github.io"
                }
            };
            return data;
        }, 2))
        .pipe(gulp.dest('build/firefox'));
});

// HTML
gulp.task('html', function() {
    del('build/*/*.html');
    gulp.src('src/*.html')
        .pipe(gulp.dest('build/chrome'))
        .pipe(gulp.dest('build/firefox'));
});

// JS
gulp.task('js', function() {
    del('build/*/scripts/*.js');

    gulp.src('src/scripts/*.js')
        .pipe(gulp.dest('build/chrome/scripts/'))
        .pipe(gulp.dest('build/firefox/scripts/'));

    del('build/*/scripts/lib/*.js');

    gulp.src('src/scripts/lib/*.js')
        .pipe(gulp.dest('build/chrome/scripts/lib/'))
        .pipe(gulp.dest('build/firefox/scripts/lib/'));
});

// SCSS
gulp.task('scss', function() {
    del('build/*/styles/*.css');
    gulp.src('src/styles/*.scss')
        .pipe(sass({
            outputStyle: 'expanded'
        }))
        .pipe(gulp.dest('build/chrome/styles'))
        .pipe(gulp.dest('build/firefox/styles'));
});


// Watch paths
var watchPaths = {
    js: [
        'src/scripts/*.js',
        'src/scripts/lib/*.js',
        'src/scripts/vendor/*.js'
    ],
    assets: [
        'src/assets/**',
        'src/assets/**/*',
        'src/manifest.json'
    ],
    scss: [
        'src/styles/*.scss',
    ],
    html: [
        'src/*.html',
    ]
};

// Watch task
gulp.task('watch', function() {

    gulp.watch(watchPaths.js, ['js']);
    gulp.watch(watchPaths.assets, ['update-static']);
    gulp.watch(watchPaths.scss, ['scss']);
    gulp.watch(watchPaths.html, ['html']);

    // Auto reload chrome extension
    var livereload = tinylr();
    livereload.listen(35729);
    gulp.watch(['build/chrome/**/*', 'build/chrome/scripts/**/*'], function(evt) {
        console.log('reload!');
        livereload.changed({
            body: {
                files: [evt.path]
            }
        });
    });
});

gulp.task('build', ['update-static', 'html', 'js', 'scss'], function() {});

// Default gulp is watch
gulp.task('default', ['build', 'watch'], function() {});