const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

let babelOptions = {
    "presets": [[
        "es2015",
        {
            "modules": false
        }
        ],
        "es2016"
    ]
};

module.exports = {
    devtool: 'source-map',
    entry: './src/index.ts',
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: [
                {
                    loader: 'babel-loader',
                    options: babelOptions
                },
                {
                    loader: 'ts-loader'
                }
            ],
            exclude: /node_modules/
        }]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    plugins:[ 
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        new webpack.optimize.UglifyJsPlugin({sourceMap: true, compress: true})        
        //,new BundleAnalyzerPlugin()
    ],
    output: {
        filename: 'multiclass-plots.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/',
        library: 'MCP'
    }
};
