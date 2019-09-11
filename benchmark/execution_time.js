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

async function benchmark(obfuscate, transformationsConfig, numIterations) {
    console.log(`Obfuscate? ${obfuscate}`);
    if (obfuscate) console.log(`Transformation config: ${JSON.stringify(transformationsConfig)}`);
    console.log(`Number of iterations: ${numIterations}`);

    await concatScripts();
    let fpScriptPath = '../dist/obfuscated.min.js';
    if (obfuscate) {
        obfuscateFPScript(transformationsConfig);
        await compress(path.resolve(__dirname, '../dist/obfuscated.js'));
    } else {
        await compress(path.resolve(__dirname, '../dist/simpleFingerprintCollector.js'));
        fpScriptPath = '../dist/simpleFingerprintCollector.min.js'
    }

    const fpScript = fs.readFileSync(fpScriptPath, 'utf8');
    const results = [];

    for (let i = 0; i < numIterations; i++) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('about:blank');
        const executionTime = await page.evaluate(`(async() => {
                const start = performance.now();
                eval(\`${fpScript}; window.tmpFingerprintCollector = fingerprintCollector;\`);
                await window.tmpFingerprintCollector.collect();
                return performance.now() - start;
            })();`);
        results.push(executionTime);

        await page.close();
        await browser.close();
    }

    return results;
}
(async() => {
    const results = [];
    const numIterations = 50;
    const encodingFrequencies = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const maxSplits = [1, 2, 3, 4, 5, 6];

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

            const executionTimes = await benchmark(true, transformationsConfig, numIterations);
            results.push({
                obfuscation: true,
                encodingFrequency: encodingFrequency,
                ternaryFrequency: 1 - encodingFrequency,
                maxSplits: maxSplit,
                executionTimes: executionTimes
            });
        }
    }

    // Without obfuscation
    const executionTimes = await benchmark(false, {}, 10 * numIterations);
    results.push({
        obfuscation: false,
        encodingFrequency: -1,
        ternaryFrequency: -1,
        maxSplits: -1,
        executionTimes: executionTimes
    });


    fs.writeFileSync('./results.csv', `${Object.keys(results[0]).join(',')}\n`);
    const fileContent = [];
    results.forEach(obj => {
        const rows = obj.executionTimes.map(execTime => {
            return `${obj.obfuscation},${obj.encodingFrequency},${obj.ternaryFrequency},${obj.maxSplits},${execTime}`;
        });
        return fileContent.push(...rows);
    });

    fs.appendFileSync('./results.csv', fileContent.join('\n'));
})();