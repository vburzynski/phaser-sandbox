var webpack = require('webpack');
var path = require('path');

var config = {
  debug: true,
  devtool: '#eval-source-map',

  entry: {
    main: './app/scripts/main',
    graph: './app/scripts/graph'
  },

  output: {
    // output direcotry
    path: path.resolve(__dirname, 'dist'),

    // url path of the output
    publicPath: "/scripts/",

    // output filename(s)
    filename: "[name].js"
  },

  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.NoErrorsPlugin()
  ],

  externals: {
    "_": "lodash",
    "d3": "d3"
  },

  module: {
    loaders: [
      {
        loader: "babel-loader",
        test: /\.jsx?$/,
        exclude: /node_modules/,
        query: {
          plugins: ['transform-runtime'],
          presets: ['es2015', 'stage-0'],
        }
      },
      {
        loader: "json",
        test: /\.json$/
      },
      {
        loader: "style!css",
        test: /\.css$/
      },
      {
        loader: "file",
        test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$|\.wav$|\.mp3$/
      }
    ]
  }
};

module.exports = config;
