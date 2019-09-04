fingerprintCollector.registerTest('timezone', () => {
    return new Date().getTimezoneOffset();
});