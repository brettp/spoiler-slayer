'use strict';

var gulp = require('gulp');
var del = require('del');
var jsontf = require('gulp-json-transform');
var sass = require('gulp-sass')(require('sass'));
var gutil = require('gulp-util');
var tinylr = require('tiny-lr');
var exec = require('child_process').exec;
var fs = require('fs');
var svgSprite = require('gulp-svg-sprite');
var jest = require('jest');
var zip = require('gulp-vinyl-zip');
let pkg = JSON.parse(fs.readFileSync('./package.json'));

gulp.task('build-svg-sprites', function(cb) {
    del('build/*/assets/icons/svg_exploded{,/**}');

    gulp.src('src/assets/icons/svg_exploded/*.svg')
    .pipe(svgSprite({
        "shape": {
            "id": {
                "generator": "icon-"
            }
        },
        "mode": {
            "stack": {
                // both options required to make it write the file
                // directly to the gulp dest
                "sprite": 'icons.svg',
                "dest": "./"
            }
        }
    }))
    .pipe(gulp.dest('build/chrome/assets/icons/'))
    .pipe(gulp.dest('build/firefox/assets/icons/'));
    cb();
});

// Copy static folders to build directory
gulp.task('update-static', gulp.series('build-svg-sprites', function(cb) {
    del('build/*/assets/icons/*');
    gulp.src(['src/assets/icons/**','!src/assets/icons/svg_exploded{,/**}'])
        .pipe(gulp.dest('build/chrome/assets/icons'))
        .pipe(gulp.dest('build/firefox/assets/icons'));

    del('build/*/assets/images/*');
    gulp.src('src/assets/images/**')
        .pipe(gulp.dest('build/chrome/assets/images'))
        .pipe(gulp.dest('build/firefox/assets/images'));

    del('build/*/manifest.json');
    return gulp.src('src/manifest.json')
        .pipe(jsontf(function(data, file) {
            let pkg = JSON.parse(fs.readFileSync('./package.json'));
            data.version = pkg.version;
            return data;
        }, 2))
        .pipe(gulp.dest('build/chrome'))
        .pipe(jsontf(function(data, file) {
            data.applications = {
                "gecko": {
                    "id": "spoilerslayer@brettp.github.io"
                }
            };
            delete data.background.persistent;
            return data;
        }, 2))
        .pipe(gulp.dest('build/firefox'));
    cb();
}));

// HTML
gulp.task('html', function(cb) {
    del('build/*/*.html');
    gulp.src('src/*.html')
        .pipe(gulp.dest('build/chrome'))
        .pipe(gulp.dest('build/firefox'));
    cb();
});

// JS
gulp.task('js', function(cb) {
    del('build/*/scripts/*.js');

    gulp.src(['src/scripts/*.js', '!src/scripts/*.test.js'])
        .pipe(gulp.dest('build/chrome/scripts/'))
        .pipe(gulp.dest('build/firefox/scripts/'));

    del('build/*/scripts/lib/*.js');

    gulp.src(['src/scripts/lib/*.js', '!src/scripts/lib/*.test.js'])
        .pipe(gulp.dest('build/chrome/scripts/lib/'))
        .pipe(gulp.dest('build/firefox/scripts/lib/'));
    cb()
});

// SCSS
gulp.task('scss', function(cb) {
    del('build/*/styles/*.css');
    gulp.src('src/styles/*.scss')
        .pipe(sass({
            outputStyle: 'expanded'
        }))
        .pipe(gulp.dest('build/chrome/styles'))
        .pipe(gulp.dest('build/firefox/styles'));
    cb()
});

// Watch paths
var watchPaths = {
    js: [
        'src/scripts/*.js',
        'src/scripts/lib/*.js'
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
gulp.task('watch', function(cb) {

    gulp.watch(watchPaths.js, gulp.series('js'));
    gulp.watch(watchPaths.assets, gulp.series('update-static'));
    gulp.watch(watchPaths.scss, gulp.series('scss'));
    gulp.watch(watchPaths.html, gulp.series('html'));

    // Auto reload chrome extension
    var livereload = tinylr();
    livereload.listen(35729);
    gulp.watch(['build/chrome/**/*', 'build/chrome/scripts/**/*'], function(evt) {
        livereload.changed({
            body: {
                files: [evt.path]
            }
        });
    });
    cb();
});

gulp.task('test', async function (cb) {
    process.env.NODE_ENV = 'test';

    // https://dev.to/darasimiajewole/integrating-jest-with-gulp-59mm
    const { results } =  await jest.runCLI({testEnvironment: 'jsdom'}, ['src'])
    return(results);
    cb();
});

gulp.task('build', gulp.series('update-static', 'html', 'js', 'scss'));

gulp.task('package', gulp.parallel('test', 'build', function (cb) {
    process.env.NODE_ENV = 'test';

    del('build/*.zip');

    // chrome
    gulp.src('build/chrome/**/*')
        .pipe(zip.dest(`build/spoiler-slayer-${pkg.version}-chrome.zip`));

    // ff and required src package
    gulp.src('build/firefox/**/*')
        .pipe(zip.dest(`build/spoiler-slayer-${pkg.version}-ff.zip`));

    gulp.src(['./src{,/**}', './gulpfile.js', './package-lock.json', './package.json', './README.md', './LICENSE', './CHANGELOG.md'])
        .pipe(zip.dest(`build/spoiler-slayer-${pkg.version}-ff-src.zip`));
    cb();
}));

// Default gulp is watch
gulp.task('default', gulp.series('build', 'watch'));
