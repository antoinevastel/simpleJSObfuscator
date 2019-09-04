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