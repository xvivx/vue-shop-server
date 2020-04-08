import path from 'path';
import webpack from 'webpack';

export default {
  target: `node`,
  mode: `production`,
  context: path.resolve(''),
  entry: {
    server: [`./app/ali-fc.js`]
  },
  output: {
    path: path.resolve(`dist`),
    filename: `[name].js`,
    libraryTarget: 'commonjs',
    chunkFilename: 'chunks/[name].[chunkhash:5].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ],
  stats: {
    colors: true,
    timings: true,
    exclude: /node_modules/,
    builtAt: false,
    modules: false,
    reasons: true,
    cachedAssets: true,
    children: false,
    optimizationBailout: true
  },
  node: {
    __dirname: false,
    global: false,
    fs: false,
    path: false
  }
};
