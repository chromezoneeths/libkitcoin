const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');
const sourcemaps = require('gulp-sourcemaps');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
// Const uglify = require('gulp-uglify');
const tsify = require('tsify');
const log = require('gulplog');

gulp.task('node', () => {
	return tsProject.src()
		.pipe(tsProject())
		.pipe(buffer())
		.pipe(sourcemaps.init({loadMaps: true}))
		// .pipe(uglify())
		.on('error', log.error)
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('node'));
});

gulp.task('browser', () => {
	return browserify()
		.add('./src/entry.ts')
		.plugin(tsify)
		.bundle()
		.pipe(source('entry.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({loadMaps: true}))
		// .pipe(uglify())
		.on('error', log.error)
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./browser'));
});

