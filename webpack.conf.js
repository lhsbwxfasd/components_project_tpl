/*
    @auther 李华 2018
*/
const path = require('path')
module.exports = {
    mode: "production",
    //mode: "development",
    externals: [
        { "$": true },
        { "jQuery": true }
    ],
    output: {
        filename: '[name].min.js',
        chunkFilename: '[name].chunk.js',
        publicPath: "./dist",
        libraryTarget: "umd",
        umdNamedDefine: true
    },
    //devtool: "source-map",
    module: {
        rules: [{
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 10000
                    }
                }]
            },
            {
                test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 10000
                    }
                }]
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 10000
                    }
                }]
            }, {
                test: /\.txt$/,
                use: "raw-loader"
            }, {
                test: /\.html$/,
                use: [{
                    loader: "html-loader",
                    options: {
                        removeAttributeQuotes: false,
                        useShortDoctype: false,
                        removeEmptyAttributes: false,
                        removeOptionalTags: false
                    }
                }]
                
            },
            {
                test: /\.css$/,
                exclude: /node_modules/, 
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/, 
                use: ["style-loader", "css-loader", "sass-loader"]
            }
        ]
    }
}