const process = require('process');

const { VS_ALIASES, VS_VERSIONS } = require('../vs_versions');

(async()=>{
    const input = process.env.REQUESTED_VS_VERSION;
    if (!VS_VERSIONS[input] && !VS_ALIASES[input]) {
        throw "Unknown version " + input;
    }

    let version = VS_VERSIONS[input];
    if (!version)
        version = VS_VERSIONS[VS_ALIASES[input]];

    if (process.platform == 'win32') {
        await require('./windows').run(version, with_cache);
    } else {
        await require('./linux').run(version, with_cache);
    }
})().catch((e) => {console.error(e); core.setFailed("installation failed unexpectedly.");});