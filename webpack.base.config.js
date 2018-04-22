var path = require('path');
var webpack = require('webpack');

module.exports = {
  devServer: {
    contentBase: 'dist',
    historyApiFallback: true,
    inline: true,
    port: 1104
  },
  devtool: 'source-map',
  entry: {
    index: './src/index.js',
  },
  mode: (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
  module: {
    rules: [{
      test: /\.css$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: false,
          },
        }
      ],
    }, {
      test: /\.html/,
      use: [{
        loader: 'file-loader',
        options: {
          name: '[name].html',
        },
      }],
    }, {
      enforce: 'pre',
      include: /src/,
      use: [{
        loader: 'eslint-loader',
        options: {
          fix: true,
        },
      }],
      test: /\.jsx?$/,
    }],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      },
    }),
  ],
  resolve: {
    modules: [
      path.join(__dirname, 'src'),
      'node_modules'
    ],
  }
}
