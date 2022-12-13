import "cross-fetch/polyfill";

const process = require('process');

(async()=>{
    const pypi_res = await fetch("https://pypi.org/pypi/vapoursynth/json");
    const pypi_data = await pypi_res.json();

    const versions = Object.keys(pypi_data["releases"]).sort((a, b) => b - a);
    const newest_version = versions[0];
    const oldest_version = Math.min(versions);
    let vs_version;
    let zimg_branch;

    if (process.env.REQUESTED_VS_VERSION === "latest") {
        vs_version = newest_version;
    } else {
        vs_version = parseFloat(process.env.REQUESTED_VS_VERSION);
    }

    if (vs_version > newest_version) {
        throw `The version "${vs_version}" cannot be installed as this version does not exist.`;
    }
    if (vs_version < oldest_version) {
        throw `The version "${vs_version}" cannot be installed as it's not available on PyPI.`;
    }

    // The Python VapourSynth package doesn't always have a minor-specific release
    const pypi_version = versions.find(v => parseFloat(v) <= vs_version);
    if (pypi_version === undefined) {
        throw `The version "${vs_version}" cannot be installed as it's not available on PyPI.`;
    }

    // TODO: Find a way to automate the zimg version
    // Compilation will fail if the zimg version is not correct
    if (vs_version >= 55) {
        zimg_branch = "v3.0";
    } else if (vs_version >= 46) {
        zimg_branch = "v2.9";
    } else if (vs_version >= 45) {
        zimg_branch = "v2.8";
    } else {
        zimg_branch = "v2.7";
    }

    const version_data = {
        // TODO: Have ./windows and ./linux accept as float/int not string
        pypi_version: pypi_version.toString(),
        minor: vs_version.toString(),
        vs_branch: `R${vs_version}`,
        zimg_branch: zimg_branch
    }

    if (process.platform == "win32") {
        await require("./windows").run(version_data);
    } else {
        await require("./linux").run(version_data);
    }
})().catch((e) => {console.error(e); require('@actions/core').setFailed("installation failed unexpectedly.");});