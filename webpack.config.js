const webpack = require('webpack')
const Clean = require('clean-webpack-plugin')
// const cssModules = require('./tools/webpack-blocks/css-loader')
const path = require('path')

const IS_DEV = process.env.NODE_ENV === 'development'

const DIST = `${__dirname}/static/dist`

module.exports = module.exports = {
  entry: {
    mutator: "./src/index.ts",
    collections: "./src/collections/index.ts",
  },
  output: {
      filename: "hydux.[name].js",
      path: __dirname + "/dist",
      library: ["hydux", "[name]"],
      libraryTarget: 'umd'
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",

  resolve: {
      // Add '.ts' and '.tsx' as resolvable extensions.
      extensions: [".ts", ".tsx", ".js", ".json"]
  },

  module: {
      rules: [
          // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
          { test: /\.tsx?$/,
            use: [{
              loader: "awesome-typescript-loader",
              options: {
                configFileName: "./tsconfig.2015.json"
              }
            }],
          },
          // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
          { enforce: "pre", test: /\.js$/, use: "source-map-loader" }
      ]
  },

  plugins: [
    new Clean(["dist"]),
  ]
};
