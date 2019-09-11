const {series, src, dest } = require('gulp');
const concat = require('gulp-concat');
const obfuscator = require('./src/obfuscator.js');
const obfuscator2 = require('./src/obfuscator_v2.js');
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

function obfuscateFPScript2(done) {
    const transformationsConfig = {
        frequency: {
            'encoding': 0.7,
            'ternary':  0.3
        },
        maxSplits: 4
    };
    obfuscator2.obfuscate('./dist/simpleFingerprintCollector.js', './dist/obfuscated.js', transformationsConfig);
    done();
}

exports.concat = concatScripts;
exports.compress = compress;
exports.obfuscate = obfuscateFPScript;
exports.build = series(concatScripts, obfuscateFPScript, compress);
exports.build2 = series(concatScripts, obfuscateFPScript2, compress);