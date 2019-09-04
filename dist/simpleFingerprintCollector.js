class SimpleFingerprintCollector {
    constructor() {
        this.tests = [];
        this.fingerprint = {}
    }

    registerTest(name, test) {
        this.tests.push({
            name: name,
            fn: test
        });
    }

    async collect() {
        const testsPromises = [];

        for (let test of this.tests) {
            if (test.fn.constructor.name === 'AsyncFunction') {
                testsPromises.push(new Promise(async(resolve) => {
                    testsPromises.push(test.fn().then((resTest) => {
                        this.fingerprint[test.name] = resTest;
                    }, (err) => {
                        this.fingerprint[test.name] = err;
                    }))
                }));
            } else {
                try {
                    this.fingerprint[test.name] = test.fn();
                } catch (err) {
                    this.fingerprint[test.name] = err;
                }
            }
        }

        await Promise.all(testsPromises);
        return this.fingerprint;
    }
}

const fingerprintCollector = new SimpleFingerprintCollector();
fingerprintCollector.registerTest('adblock', () => {
    const ads = document.createElement('div');
    ads.innerHTML = '&nbsp;';
    ads.className = 'adsbox';
    let result = false;
    try {
        document.body.appendChild(ads);
        result = document.getElementsByClassName('adsbox')[0].offsetHeight === 0;
        document.body.removeChild(ads);
    } catch (e) {
        result = false
    }
    return result;
});
fingerprintCollector.registerTest('canvas', () => {
    let res = {};
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    canvas.style.display = "inline";
    const context = canvas.getContext("2d");

    try {
        context.rect(0, 0, 10, 10);
        context.rect(2, 2, 6, 6);
        res.canvasWinding = context.isPointInPath(5, 5, "evenodd");
    } catch (e) {
        res.canvasWinding = 'unknown';
    }

    try {
        context.textBaseline = "alphabetic";
        context.fillStyle = "#f60";
        context.fillRect(125, 1, 62, 20);
        context.fillStyle = "#069";
        context.font = "11pt no-real-font-123";
        context.fillText("Cwm fjordbank glyphs vext quiz, 😃", 2, 15);
        context.fillStyle = "rgba(102, 204, 0, 0.2)";
        context.font = "18pt Arial";
        context.fillText("Cwm fjordbank glyphs vext quiz, 😃", 4, 45);

        context.globalCompositeOperation = "multiply";
        context.fillStyle = "rgb(255,0,255)";
        context.beginPath();
        context.arc(50, 50, 50, 0, 2 * Math.PI, !0);
        context.closePath();
        context.fill();
        context.fillStyle = "rgb(0,255,255)";
        context.beginPath();
        context.arc(100, 50, 50, 0, 2 * Math.PI, !0);
        context.closePath();
        context.fill();
        context.fillStyle = "rgb(255,255,0)";
        context.beginPath();
        context.arc(75, 100, 50, 0, 2 * Math.PI, !0);
        context.closePath();
        context.fill();
        context.fillStyle = "rgb(255,0,255)";
        context.arc(75, 75, 75, 0, 2 * Math.PI, !0);
        context.arc(75, 75, 25, 0, 2 * Math.PI, !0);
        context.fill("evenodd");
        res.image = canvas.toDataURL();

    } catch (e) {
        res.image = 'unknown';
    }

    return res;
});
fingerprintCollector.registerTest('resOverflow', () => {
    let depth = 0;
    let errorMessage = '';
    let errorName = '';
    let errorStacklength = 0;

    function iWillBetrayYouWithMyLongName() {
        try {
            depth++;
            iWillBetrayYouWithMyLongName();
        } catch (e) {
            errorMessage = e.message;
            errorName = e.name;
            errorStacklength = e.stack.toString().length;
        }
    }

    iWillBetrayYouWithMyLongName();
    return {
        depth: depth,
        errorMessage: errorMessage,
        errorName: errorName,
        errorStacklength: errorStacklength
    }

});
fingerprintCollector.registerTest('platform', () => {
    if (navigator.platform) {
        return navigator.platform
    }

    return 'unknown';
});
fingerprintCollector.registerTest('screenResolution', () => {
    return {
        wInnerHeight: window.innerHeight,
        wOuterHeight: window.outerHeight,
        wOuterWidth: window.outerWidth,
        wInnerWidth: window.innerWidth,
        wScreenX: window.screenX,
        wPageXOffset: window.pageXOffset,
        wPageYOffset: window.pageYOffset,
        cWidth: document.body.clientWidth,
        cHeight: document.body.clientHeight,
        sWidth: screen.width,
        sHeight: screen.height,
        sAvailWidth: screen.availWidth,
        sAvailHeight: screen.availHeight,
        sColorDepth: screen.colorDepth,
        sPixelDepth: screen.pixelDepth,
        wDevicePixelRatio: window.devicePixelRatio
    };
});
fingerprintCollector.registerTest('timezone', () => {
    return new Date().getTimezoneOffset();
});