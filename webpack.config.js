const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    entry: {
        UBoxAuto: './src/index'
    },
    output: {
        filename: '[name].min.js',
        library: '[name]',
        libraryTarget: 'umd',
        libraryExport: 'default'
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    },
    mode: process.env.NODE_ENV,
    devtool: process.env.NODE_ENV === 'development' ? 'inline-source-map' : 'source-map',
    devServer: {
        contentBase: './dist',
        port: '8090',
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    },
    plugins: [...(process.env.ANALYZER ? [new BundleAnalyzerPlugin()] : [])],
    module: {
        rules: [
            {
                oneOf: [
                    {
                        test: /(\.js|\.jsx|\.ts|\.tsx)$/,
                        use: [
                            {
                                loader: 'babel-loader',
                                options: require('./babel.config.js')
                            }
                        ],
                        exclude: /node_modules/
                    }
                ]
            }
        ]
    }
};
