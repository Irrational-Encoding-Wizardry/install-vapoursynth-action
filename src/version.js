const fs = require('fs');
export const VERSION = JSON.parse(fs.readFileSync(__dirname + "/../package.json").toString()).version;