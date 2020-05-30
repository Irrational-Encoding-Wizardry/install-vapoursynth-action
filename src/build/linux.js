const core = require('@actions/core');
const { exec } = require('@actions/exec');
const artifact = require('@actions/artifact');

const { lsb_version } = require('../utils');

function get_container_from_id(id, suffix="-git/") {
    return "/tmp/" + id + suffix;
}

const client = artifact.create()

async function downloadAndCompile(link, id, branch, configures=[], prereqs=null, cb=null) {
    const container = get_container_from_id(id);

    if (!!prereqs) {
        await prereqs(container);
    }
    
    core.info("Cloning " + id);
    await exec('git', ['clone', link, '--depth', '1', '--branch', branch, container]);

    core.info("Compiling " + id);
    await exec('./autogen.sh', [], {cwd: container});
    await exec('./configure', ["--prefix=/usr"].concat(configures), {cwd: container});
    await exec("make", [], {cwd: container});
    await exec("sudo", ["make", "install"], {cwd: container});

    if (!!cb) {
        await cb(container);
    }
}

async function cache(id, branch) {
    const container = get_container_from_id(id);
    const artifact_name_suffix = [branch, "ubuntu", await lsb_version(), "compiled.tar"].join("--")
    const tar_path = get_container_from_id(id, artifact_name_suffix);
    await exec("tar", ["-zcf", tar_path, container]);
    await client.uploadArtifact(id + "--" + artifact_name_suffix, [tar_path], "/tmp");
}

async function build(link, id, branch, configures="", with_py_module=false) {
    core.startGroup("Installing Building Tool for: " + id+"@"+branch);
   try {
        await downloadAndCompile(link, id, branch, configures);
        await cache(id, branch);
    } finally {
        core.endGroup();
    }
}


export async function run(config) {
    const vs_branch = config.vs_branch;
    const zimg_branch = config.zimg_branch;

    await build("https://github.com/sekrit-twc/zimg", "zimg", zimg_branch, [], false);
    await build("https://github.com/vapoursynth/vapoursynth", "vs", vs_branch, ["--disable-vsscript", "--disable-python-module"], true, async()=>{
        core.info("Ensuring existence of nasm...");
        await exec("sudo", ["apt-get", "install", "--yes", "nasm"]);
    }, async(path)=>{
        core.info("Building python package.");
        await exec("pip" ["install", "cython", "wheel"]);
        await exec("python", ["setup.py", "bdist_wheel"], {cwd: path});
    });
}