fingerprintCollector.registerTest('plugins', () => {
    const pluginsRes = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
        const plugin = navigator.plugins[i];
        const pluginStr = [plugin.name, plugin.description, plugin.filename, plugin.version].join("::");
        let mimeTypes = [];
        Object.keys(plugin).forEach((mt) => {
            mimeTypes.push([plugin[mt].type, plugin[mt].suffixes, plugin[mt].description].join("~"));
        });
        mimeTypes = mimeTypes.join(",");
        pluginsRes.push(pluginStr + "__" + mimeTypes);
    }
    return pluginsRes;
});