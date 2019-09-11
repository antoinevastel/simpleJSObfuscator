fingerprintCollector.registerTest('videoCodecs', () => {
    const videoElt = document.createElement("video");

    if (videoElt.canPlayType) {
        return {
            ogg: videoElt.canPlayType('video/ogg; codecs="theora"'),
            h264: videoElt.canPlayType('video/mp4; codecs="avc1.42E01E"'),
            webm: videoElt.canPlayType('video/webm; codecs="vp8, vorbis"'),
        }
    }
    return {
        ogg: UNKNOWN,
        h264: UNKNOWN,
        webm: UNKNOWN,
    }
});