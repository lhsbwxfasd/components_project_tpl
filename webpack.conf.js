/*
    @auther 李华 2018
*/
const path = require('path')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
module.exports = {
    mode: "production",
    entry: "",
    output: {
        path: "",
        filename: "[name].min.js",
        libraryTarget: "umd",
        umdNamedDefine: true
    },
    externals: [
        { "vue": "Vue" },
        { "vuex": "Vuex" },
        { "vue-router": "VueRouter" },

        { "accounting-js": "accountingJs" },
        { "axios": "axios" },
        { "element-ui": "ElementUI" },
        { "handsontable": "handsontable" },
        { "heatmap.js": "heatmap" },
        { "highcharts": "highcharts" },
        { "highcharts-more-node": true },
        { "jquery": "jQuery" },
        { "lodash": "_" },
        { "lodash.throttle": true }
    ],
    resolve: {
        //modules: ["node_modules",],
        extensions: [".js", ".json", "jsx" , ".scss", ".css", ".vue"]
        //alias: {}
    },
    plugins: [
        new VueLoaderPlugin()
    ],
    devtool: "source-map",
    module: {
        rules: [{
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 10000
                    }
                }]
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 10000
                    }
                }]
            }, {
                test: /\.txt$/,
                exclude: /node_modules/,
                use: "raw-loader"
            }, {
                test: /\.html$/,
                exclude: /node_modules/,
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
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ["babel-loader"]
            },
            {
                test: /\.vue$/,
                exclude: /node_modules/,
                use: ["vue-loader"]
            }
        ]
    }
}