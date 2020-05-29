const { exec } = require('@actions/exec');


export async function run(config) {
    await exec('pip', ['install', 'vapoursynth-portable==' + config.pypi_version]);
}