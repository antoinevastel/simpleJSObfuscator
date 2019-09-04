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