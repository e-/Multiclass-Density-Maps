let path = require('path');

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
    output: {
        filename: 'multiclass-plots.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/',
        library: 'MCP'
    }
};
