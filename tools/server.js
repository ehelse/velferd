const webpack = require('webpack');
const WebPackDevServer = require('webpack-dev-server');
const config = require('../webpack.config.dev');
/* eslint-disable no-console */

new WebPackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
  // It suppress error shown in console, so it has to be set to false.
  quiet: false,
  // It suppress everything except error, so it has to be set to false as well
  // to see success build.
  noInfo: false,
  stats: {
    // Config for minimal console.log mess.
    assets: false,
    colors: true,
    version: false,
    hash: false,
    timings: false,
    chunks: false,
    chunkModules: false,
  },
}).listen(8080, 'localhost', (err) => {
  if (err) {
    console.log(err);
  }
  console.log('Listening on localhost:8080');
});
