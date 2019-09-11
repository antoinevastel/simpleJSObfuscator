fingerprintCollector.registerTest('detailChrome', () => {
    if (!window.chrome) return 'unknown';

    const res = {};

    try{
        ["webstore", "runtime", "app", "csi", "loadTimes"].forEach((property) => {
            res[property] = window.chrome[property].constructor.toString().length;
        });
    } catch (e) {
        res.properties = 'unknown';
    }

    try {
        window.chrome.runtime.connect('');
    } catch (e) {
        res.connect = e.message.length;
    }
    try {
        window.chrome.runtime.sendMessage();
    } catch (e) {
        res.sendMessage = e.message.length;
    }

    return res;
});