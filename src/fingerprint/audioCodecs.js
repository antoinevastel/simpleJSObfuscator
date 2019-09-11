fingerprintCollector.registerTest('audioCodecs', () => {
    const audioElt = document.createElement("audio");

    if (audioElt.canPlayType) {
        return {
            ogg: audioElt.canPlayType('audio/ogg; codecs="vorbis"'),
            mp3: audioElt.canPlayType('audio/mpeg;'),
            wav: audioElt.canPlayType('audio/wav; codecs="1"'),
            m4a: audioElt.canPlayType('audio/x-m4a;'),
            aac: audioElt.canPlayType('audio/aac;'),
        }
    }
    return {
        ogg: 'unknown',
        mp3: 'unknown',
        wav: 'unknown',
        m4a: 'unknown',
        aac: 'unknown'
    };
});