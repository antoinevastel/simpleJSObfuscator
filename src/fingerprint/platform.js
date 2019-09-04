fingerprintCollector.registerTest('platform', () => {
    if (navigator.platform) {
        return navigator.platform
    }

    return 'unknown';
});