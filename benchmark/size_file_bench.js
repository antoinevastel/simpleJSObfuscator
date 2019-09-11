const puppeteer = require('puppeteer');
const fs = require('fs');
const {src, dest } = require('gulp');
const concat = require('gulp-concat');
const obfuscator = require('../src/obfuscator_v2.js');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const path = require('path');

async function concatScripts() {
    return new Promise((resolve) => {
        src([
            path.resolve(__dirname, '../src/simpleFingerprintCollector.js'),
            path.resolve(__dirname, '../src/fingerprint/*.js')
        ])
            .pipe(concat('simpleFingerprintCollector.js'))
            .pipe(dest(path.resolve(__dirname, '../dist/')))
            .on("end", resolve);
    })

}

function obfuscateFPScript(transformationsConfig) {
    obfuscator.obfuscate(path.resolve(__dirname, '../dist/simpleFingerprintCollector.js'),
        path.resolve(__dirname,'../dist/obfuscated.js'),
        transformationsConfig
    );
}

function compress (fpPath) {
    return new Promise((resolve) => {
        src(fpPath)
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
            .pipe(rename({extname: '.min.js'}))
            .pipe(dest(path.resolve(__dirname, '../dist/')))
            .on("end", resolve);
    })
}

async function studySize(obfuscate, transformationsConfig, numIterations) {
    console.log(transformationsConfig);
    const results = [];

    for (let i = 0; i < numIterations; i++) {
        let fpScriptPath = '../dist/obfuscated.min.js';
        if (obfuscate) {
            obfuscateFPScript(transformationsConfig);
            await compress(path.resolve(__dirname, '../dist/obfuscated.js'));
        } else {
            await compress(path.resolve(__dirname, '../dist/simpleFingerprintCollector.js'));
            fpScriptPath = '../dist/simpleFingerprintCollector.min.js'
        }


        const statsFile = fs.statSync(fpScriptPath);
        results.push(statsFile["size"]);
    }
    return results;
}

(async() => {
    const results = [];
    const numIterations = 100;
    const encodingFrequencies = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const maxSplits = [1, 2, 3, 4, 5, 6];

    await concatScripts();

    // With obfuscation
    for (const encodingFrequency of encodingFrequencies){
        for (const maxSplit of maxSplits) {
            const transformationsConfig = {
                frequency: {
                    'encoding': encodingFrequency,
                    'ternary':  1 - encodingFrequency
                },
                maxSplits: maxSplit
            };

            const fileSizes = await studySize(true, transformationsConfig, numIterations);
            results.push({
                obfuscation: true,
                encodingFrequency: encodingFrequency,
                ternaryFrequency: 1 - encodingFrequency,
                maxSplits: maxSplit,
                fileSizes: fileSizes
            });
        }
    }

    // Without obfuscation
    const fileSizes = await studySize(false, {}, 1);
    results.push({
        obfuscation: false,
        encodingFrequency: -1,
        ternaryFrequency: -1,
        maxSplits: -1,
        fileSizes: fileSizes
    });


    fs.writeFileSync('./results_size_files.csv', `${Object.keys(results[0]).join(',')}\n`);
    const fileContent = [];
    results.forEach(obj => {
        const rows = obj.fileSizes.map(fileSize => {
            return `${obj.obfuscation},${obj.encodingFrequency},${obj.ternaryFrequency},${obj.maxSplits},${fileSize}`;
        });
        return fileContent.push(...rows);
    });

    fs.appendFileSync('./results_size_files.csv', fileContent.join('\n'));
})();