/*
 * @Author: your name
 * @Date: 2020-12-25 09:55:37
 * @LastEditTime: 2020-12-29 09:32:08
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /woyao_cli/build/webpack.dev.js
 */
const webpack = require('webpack')
const webpackConfig = require('./webpack.config.js')
const { merge } = require('webpack-merge')

module.exports = merge(webpackConfig, {
    mode: 'development',
    devtool: 'eval-cheap-module-source-map',
    devServer: {
        hot: true,
        // hotOnly: true, // hmr失效的时候，不会重新刷新
        contentBase: './dist',
        open: true,
    },
    optimization: {
        usedExports: true, // development配置tree shaking
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
})


