fingerprintCollector.registerTest('touchScreen', () => {
    let maxTouchPoints = 0;
    let touchEvent = false;
    if (typeof navigator.maxTouchPoints !== "undefined") {
        maxTouchPoints = navigator.maxTouchPoints;
    } else if (typeof navigator.msMaxTouchPoints !== "undefined") {
        maxTouchPoints = navigator.msMaxTouchPoints;
    }
    try {
        document.createEvent("TouchEvent");
        touchEvent = true;
    } catch (_) {
    }

    const touchStart = "ontouchstart" in window;
    return [maxTouchPoints, touchEvent, touchStart];
});