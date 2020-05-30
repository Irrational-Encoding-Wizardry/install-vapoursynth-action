const core = require('@actions/core');
const process = require('process');

const { VS_ALIASES, VS_VERSIONS } = require('./vs_versions');

(async()=>{
    const input = core.getInput("version");
    if (!VS_VERSIONS[input] && !VS_ALIASES[input]) {
        throw "Unknown version " + input;
    }

    let version = VS_VERSIONS[input];
    if (!version)
        version = VS_VERSIONS[VS_ALIASES[input]];

    const with_cache = core.getInput("cache") == 'true';

    if (process.platform == 'win32') {
        await require('./windows').run(version);
    } else {
        await require('./linux').run(version);
    }

    core.setOutput('version', version.minor);
})().catch((e) => {console.error(e); core.setFailed("installation failed unexpectedly.");});