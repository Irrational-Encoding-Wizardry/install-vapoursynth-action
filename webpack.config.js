const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    target: "node",
    output: {
        path: __dirname + "/dist",
        filename: 'index.js'
    }
}