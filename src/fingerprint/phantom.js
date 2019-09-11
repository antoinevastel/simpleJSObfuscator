fingerprintCollector.registerTest('phantom', () => {
    return [
        'callPhantom' in window,
        '_phantom' in window,
        'phantom' in window
    ];
});