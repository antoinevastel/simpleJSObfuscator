const {series, src, dest } = require('gulp');
const concat = require('gulp-concat');
const obfuscator = require('./src/obfuscator.js');
const terser = require('gulp-terser');
const rename = require('gulp-rename');

function concatScripts() {
    return src(['src/simpleFingerprintCollector.js', 'src/fingerprint/*.js'])
        .pipe(concat('simpleFingerprintCollector.js'))
        .pipe(dest('./dist/'));
}

function obfuscateFPScript(done) {
    obfuscator.obfuscate('./dist/simpleFingerprintCollector.js', './dist/obfuscated.js');
    done();
}

function compress () {
    return src('dist/obfuscated.js')
        .pipe(terser({
            compress: {
                booleans: false,
                drop_console: true,
                evaluate: false,
                keep_classnames: false
            },
            mangle: {
                toplevel: true,
                reserved: ['fingerprintCollector', 'collect']
            },
            keep_fnames: false,
            output: {
                beautify: false,
                preamble: '/* You superb copyright here */'
            }
        }))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(dest('dist/'))
}


exports.concat = concatScripts;
exports.compress = compress;
exports.obfuscate = obfuscateFPScript;
exports.build = series(concatScripts, obfuscateFPScript, compress);