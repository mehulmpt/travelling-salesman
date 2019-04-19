const path = require('path');
const webpack = require('webpack')

module.exports = {
    mode: "development",
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
		port: 1111,
		hot: true
    },
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [new webpack.HotModuleReplacementPlugin()]
};