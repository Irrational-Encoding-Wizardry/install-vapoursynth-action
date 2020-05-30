const fs = require('fs');
const io = require('@actions/io');
const core = require('@actions/core');
const cache = require('@actions/cache');
const { exec } = require('@actions/exec');


async function lsb_version() {
    const fileContents = await new Promise((rs, rj) => {
        fs.readFile('/etc/lsb-release', (err, data) => {
            if (!!err) rj(err);
            rs(data);
        });
    });
    const data = fileContents.toString();
    for (let d of data.split("\n")) {
        let [n, v] = d.split("=");
        if (n != "DISTRIB_RELEASE") continue;
        return v;
    }
}


function get_container_from_id(id) {
    return "/tmp/" + id + "-git/";
}


export async function downloadAndCompile(link, id, branch, configures=[]) {
    const container = get_container_from_id(id);

    core.info("Ensuring existence of nasm...");
    await exec("sudo", ["apt-get", "install", "--yes", "nasm"]);
    
    core.info("Cloning " + id);
    await exec('git', ['clone', link, '--depth', '1', '--branch', branch, container]);

    core.info("Compiling " + id);
    await exec('./autogen.sh', [], {cwd: container});
    await exec('./configure', ["--prefix=/usr"].concat(configures), {cwd: container});
    await exec("make", [], {cwd: container});
}

export async function installTarget(id, with_py_module) {
    const container = get_container_from_id(id);

    core.info("Installing " + id);
    await exec('sudo', ['make', 'install'], {cwd: container});
    if (with_py_module)
        await exec('pip', ['install', '.'], {cwd: container});
}


const actually_use_cache = {
    access: cache.restoreCache,
    async push(files, key) {
        if ((await cache.restoreCache([container], cc)) === undefined)
            await cache.saveCache([container], cc);
    }
}

const skip_cache = {
    async access(files, key) {
        return undefined;
    },
    async push(files, key) {
        return;
    }
}


export async function install(link, id, branch, configures="", with_py_module=false, cache=actually_use_cache) {
    const container = get_container_from_id(id);
    const cc = "install-vapoursynth--linux-" + (await lsb_version()) + "--" + id + "--" + branch;

    core.startGroup("Installing library: " + id+"@"+branch);
   try {
        const cacheKey = await cache.restoreCache([container], cc);
        if (cacheKey === undefined) {
            await downloadAndCompile(link, id, branch, configures);
            if ((await cache.restoreCache([container], cc)) === undefined)
                await cache.saveCache([container], cc);
        }

        await installTarget(id, with_py_module);

        await io.rmRF(container);
    } finally {
        core.endGroup();
    }
}


export async function run(config, with_cache=true) {
    const vs_branch = config.vs_branch;
    const zimg_branch = config.zimg_branch;

    const cache_access = (with_cache) ? actually_use_cache : skip_cache;

    await install("https://github.com/sekrit-twc/zimg", "zimg", zimg_branch, [], false, cache_access);
    await install("https://github.com/vapoursynth/vapoursynth", "vs", vs_branch, ["--disable-vsscript", "--disable-python-module"], true, cache_access);
}