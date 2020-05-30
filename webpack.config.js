const webpack = require('webpack');

module.exports = {
    entry: {
        build: './src/build/index.js',
        install: './src/install/index.js'
    },
    target: "node",
    output: {
        path: __dirname + "/dist",
        filename: '[name].js'
    },
    optimization: {
        minimize: false
    }
}