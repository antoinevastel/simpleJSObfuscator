const {expect} = require('chai');
const puppeteer = require('puppeteer');
const path = require('path');

describe('Fingerprinting on Chrome Headless', function () {
    let browser, page;
    let fingerprint;

    before(async function () {
        browser = await puppeteer.launch();
        page = await browser.newPage();
        await page.goto('file://' + path.resolve(__dirname, 'test.html'), {
            waitUntil: 'load'
        });

        fingerprint = await page.evaluate(async () => {
            try {
                const fingerprint = await fingerprintCollector.collect();
                return fingerprint;
            } catch (e) {
                return e.message;
            }
        });
    });

    after(async function () {
        await page.close();
        await browser.close();
    });

    it('resOverflow should be an object', () => {
        expect(typeof fingerprint.resOverflow).to.equal('object');
    });

    it('screen should have 16 properties', () => {
        const isScreenValid = fingerprint.screenResolution !== undefined && Object.keys(fingerprint.screenResolution ).length === 16;
        expect(isScreenValid).to.be.true;
    });

    it('adblock should be false', () => {
        expect(fingerprint.adblock).to.be.false;
    });

});