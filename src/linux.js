const core = require('@actions/core');
const cache = require('@actions/cache');
const { exec } = require('@actions/exec');


function readBody(response) {
    const message = response.message;
    return new Promise(async(rs, rj) => {
        let output = Buffer.alloc(0);
        message.on('data', (chunk) => {
            output = Buffer.concat([output, chunk]);
        });
        message.on('end', ()=>rs(output));
    });
}

function get_container_from_id(id) {
    return "/tmp/" + id + "-git";
}


export async function downloadAndCompile(link, id, branch, configures="") {
    const container = get_container_from_id(id);

    
    core.info("Cloning " + id);
    await exec('git clone', [link, '--depth', '1', '--branch', branch, container]);

    core.info("Compiling " + id);
    await exec('bash', ['-c', '"cd ' + container + '; ./autogen.sh"']);
    await exec('bash', ['-c', '"cd ' + container + '; ./configure --prefix=/usr ' + configures + '"']);
    await exec('bash', ['-c', '"cd ' + container + '; ./make"']);
}

export async function installTarget(id, with_py_module) {
    const container = get_container_from_id(id);

    core.info("Installing " + id);
    await exec('bash', ['-c', '"cd ' + container + '; sudo make install"']);
    if (with_py_module)
        await exec('bash', ['-c', '"cd ' + container + '; pip install ."']);
}


export async function install(link, id, branch, configures="", with_py_module=false) {
    const container = get_container_from_id(id);
    const cc = "install-vapoursynth--linux--" + id;

    core.startGroup("Installing library: " + id);
   try {
        core.info(cc, container);
        const cacheKey = await cache.restoreCache(cc, [container]);
        if (cacheKey === undefined) {
            await downloadAndCompile(link, id, branch, configures);
        }
        await cache.saveCache([container], cc);

        await installTarget(id, with_py_module);
    } finally {
        core.endGroup();
    }
}


export async function run(config) {
    const vsbranch = config.vsbranch;
    const zimg_branch = config.zimg_branch;

    await install("https://github.com/sekrit-twc/zimg", "zimg", zimg_branch);
    await install("https://github.com/vapoursynth/vapoursynth", "vs", vsbranch, "--without-vsscript --without-python-module", true);
}