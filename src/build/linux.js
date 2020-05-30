const io = require('@actions/io');
const core = require('@actions/core');
const { exec } = require('@actions/exec');

const { lsb_version } = require('../utils');

function get_container_from_id(id, suffix="-git/") {
    return "/tmp/" + id + suffix;
}

async function downloadAndCompile(link, id, branch, configures=[], cbs={}) {
    const container = get_container_from_id(id);

    if (!!cbs.pre) {
        await cbs.pre(container);
    }
    
    core.info("Cloning " + id);
    await exec('git', ['clone', link, '--depth', '1', '--branch', branch, container]);

    core.info("Compiling " + id);
    await exec('./autogen.sh', [], {cwd: container});
    await exec('./configure', ["--prefix=/usr"].concat(configures), {cwd: container});
    await exec("make", [], {cwd: container});
    await exec("sudo", ["make", "install"], {cwd: container});

    if (!!cbs.post) {
        await cbs.post(container);
    }
}

async function cache(id, branch) {

    const container = get_container_from_id(id);
    const artifact_name_suffix = [branch, "ubuntu", await lsb_version(), "compiled.tar"].join("--")

    await io.mkdirP("/tmp/artifacts");
    const tar_path = "/tmp/artifacts/" + id + " -- " + artifact_name_suffix;
    await exec("tar", ["-zcf", tar_path, container]);
}

async function build(link, id, branch, configures="", cbs={}) {
    core.startGroup("Installing Building Tool for: " + id+"@"+branch);
   try {
        await downloadAndCompile(link, id, branch, configures, cbs);
        await cache(id, branch);
    } finally {
        core.endGroup();
    }
}


export async function run(config) {
    const vs_branch = config.vs_branch;
    const zimg_branch = config.zimg_branch;

    await build("https://github.com/sekrit-twc/zimg", "zimg", zimg_branch, [], false);
    await build("https://github.com/vapoursynth/vapoursynth", "vs", vs_branch, ["--disable-vsscript", "--disable-python-module"], {
        pre: async()=>{
            core.info("Ensuring existence of nasm...");
            await exec("sudo", ["apt-get", "install", "--yes", "nasm"]);
        },
        post: async(path)=>{
            core.info("Building python package.");
            await exec("pip", ["install", "cython", "wheel"]);
            await exec("python", ["setup.py", "bdist_wheel"], {cwd: path});
            await exec("pip", ["install", "."], {cwd: path});
        }
    });
}