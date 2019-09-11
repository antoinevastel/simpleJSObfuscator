fingerprintCollector.registerTest('selenium', () => {
    return [
        'webdriver' in window,
        '_Selenium_IDE_Recorder' in window,
        'callSelenium' in window,
        '_selenium' in window,
        '__webdriver_script_fn' in document,
        '__driver_evaluate' in document,
        '__webdriver_evaluate' in document,
        '__selenium_evaluate' in document,
        '__fxdriver_evaluate' in document,
        '__driver_unwrapped' in document,
        '__webdriver_unwrapped' in document,
        '__selenium_unwrapped' in document,
        '__fxdriver_unwrapped' in document,
        '__webdriver_script_func' in document,
        document.documentElement.getAttribute("selenium") !== null,
        document.documentElement.getAttribute("webdriver") !== null,
        document.documentElement.getAttribute("driver") !== null
    ];
});