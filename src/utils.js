const fs = require("fs");

export async function lsb_version() {
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

