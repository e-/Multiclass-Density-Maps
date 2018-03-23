const path = require('path');
const WriteFilePlugin = require('write-file-webpack-plugin');

module.exports = {
    devtool: 'source-map', //only to debug
    entry: './src/index.ts',
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    devServer: {
        contentBase: './'
    },
    //watch:true,
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/',
        library: 'MCS'
    }
    ,
    plugins: [
        new WriteFilePlugin()
    ]
};
