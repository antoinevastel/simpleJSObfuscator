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