"use strict";
const CleanTerminalPlugin = require("clean-terminal-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const autoprefixer = require("autoprefixer");
const path = require("path");
const webpack = require("webpack");
// const HtmlWebpackPlugin = require("html-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
// const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin");
// const WatchMissingNodeModulesPlugin = require("react-dev-utils/WatchMissingNodeModulesPlugin");
// const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");
const getClientEnvironment = require("./env");
const paths = require("./paths");
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

// `publicUrl` is just like `publicPath`, but we will provide it to our app
// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
// Omit trailing slash as %PUBLIC_PATH%/xyz looks better than %PUBLIC_PATH%xyz.
const publicUrl = "";
// Get environment variables to inject into our app.
const env = getClientEnvironment(publicUrl);

const smp = new SpeedMeasurePlugin({
  outputTarget: "./webpackperfs",
});

// This is the development configuration.
// It is focused on developer experience and fast rebuilds.
// The production configuration is different and lives in a separate file.
module.exports = {
  mode: "development",

  // These are the "entry points" to our application.
  // This means they will be the "root" imports that are included in JS bundle.
  // The first two entry points enable "hot" CSS and auto-refreshes for JS.
  entry: [
    // Finally, this is your app's code:
    paths.appIndexJs,
    // We include the app code last so that if there is a runtime error during
    // initialization, it doesn't blow up the WebpackDevServer client, and
    // changing JS code would still trigger a refresh.
  ],
  //
  devServer: {
    // Silence WebpackDevServer's own logs since they're generally not useful.
    // It will still show compile warnings and errors with this setting.
    clientLogLevel: "none",
    quiet: false,
    contentBase: paths.appPublic,
    compress: true,
    historyApiFallback: true,
    hot: true,
    port: 3000,
    open: true,
    overlay: true,
    // writeToDisk: true
  },

  output: {
    // Add /* filename */ comments to generated require()s in the output.
    pathinfo: true,
    // This does not produce a real file. It's just the virtual path that is
    // served by WebpackDevServer in development. This is the JS bundle
    // containing code from all our entry points, and the Webpack runtime.
    filename: "bundle.js",
    // There are also additional JS chunk files if you use code splitting.
    chunkFilename: "[name].chunk.js",
    // This is the URL that app is served from. We use "/" in development.
    // Webpack uses `publicPath` to determine where the app is being served from.
    // In development, we always serve from the root. This makes config easier.
    publicPath: "/",
    // Point sourcemap entries to original disk location (format as URL on Windows)
    // devtoolModuleFilenameTemplate: (info) =>
    //   path.resolve(info.absoluteResourcePath).replace(/\\/g, "/"),
  },
  resolve: {
    modules: ["node_modules"],
    // These are the reasonable defaults supported by the Node ecosystem.
    // We also include JSX as a common component filename extension to support
    // some tools, although we do not recommend using it, see:
    // https://github.com/facebookincubator/create-react-app/issues/290
    // `web` extension prefixes have been added for better support
    // for React Native Web.
    extensions: [".web.js", ".mjs", ".js", ".json", ".web.jsx", ".jsx"],
  },
  module: {
    strictExportPresence: true,
    rules: [
      {
        // "oneOf" will traverse all following loaders until one will
        // match the requirements. When no loader matches it will fall
        // back to the "file" loader at the end of the loader list.
        oneOf: [
          // Raw loader to use SVGs
          {
            test: /\.svg$/,
            loader: "raw-loader",
          },
          // "url" loader works like "file" loader except that it embeds assets
          // smaller than specified limit in bytes as data URLs to avoid requests.
          // A missing `test` is equivalent to a match.
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve("url-loader"),
            options: {
              limit: 10000,
              // name: "static/media/[name].[hash:8].[ext]",
            },
          },
          // Process JS with Babel.
          {
            test: /\.(js|jsx|mjs)$/,
            include: [paths.appSrc, path.resolve(paths.appNodeModules, "query-string")],
            use: [
              {
                loader: "babel-loader",
                options: {
                  // This is a feature of `babel-loader` for webpack (not Babel itself).
                  // It enables caching results in ./node_modules/.cache/babel-loader/
                  // directory for faster rebuilds.
                  cacheDirectory: true,
                  plugins: [
                    [
                      require.resolve("react-refresh/babel"),
                      {
                        skipEnvCheck: true,
                      },
                    ],
                  ].filter(Boolean),
                },
              },
            ],
          },
          // "postcss" loader applies autoprefixer to our CSS.
          // "css" loader resolves paths in CSS and adds assets as dependencies.
          // "style" loader turns CSS into JS modules that inject <style> tags.
          // In production, we use a plugin to extract that CSS to a file, but
          // in development "style" loader enables hot editing of CSS.
          {
            test: /\.css$|\.scss$/,
            use: [
              require.resolve("style-loader"),
              {
                loader: require.resolve("css-loader"),
                options: {
                  importLoaders: 1,
                  modules: {
                    localIdentName: "[name]__[local]___[hash:base64:5]",
                  },
                },
              },
              {
                loader: require.resolve("postcss-loader"),
                options: {
                  // Necessary for external CSS imports to work
                  // https://github.com/facebookincubator/create-react-app/issues/2677
                  ident: "postcss",
                  plugins: () => [
                    require("postcss-flexbugs-fixes"),
                    autoprefixer({
                      flexbox: "no-2009",
                    }),
                  ],
                },
              },
              require.resolve("sass-loader"),
            ],
          },
          // "file" loader makes sure those assets get served by WebpackDevServer.
          // When you `import` an asset, you get its (virtual) filename.
          // In production, they would get copied to the `build` folder.
          // This loader doesn't use a "test" so it will catch all modules
          // that fall through the other loaders.
          {
            // Exclude `js` files to keep "css" loader working as it injects
            // its runtime that would otherwise processed through "file" loader.
            // Also exclude `html` and `json` extensions so they get processed
            // by webpacks internal loaders.
            exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
            loader: require.resolve("file-loader"),
            options: {
              name: "static/media/[name].[hash:8].[ext]",
            },
          },
        ],
      },
      // First, run the linter.
      // It's important to do this before Babel processes the JS.
      {
        test: /\.(js|jsx|mjs)$/,
        use: [
          {
            loader: "eslint-loader",
            options: {
              fix: true,
              formatter: require("eslint-formatter-pretty"),
              emitWarning: true,
            },
          },
        ],
        include: paths.appSrc,
      },
      // ** STOP ** Are you adding a new loader?
      // Make sure to add the new loader(s) before the "file" loader.
    ],
  },
  plugins: [
    // Makes some environment variables available in index.html.
    // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
    // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
    // In development, this will be an empty string.
    // new InterpolateHtmlPlugin(env.raw),
    // Generates an `index.html` file with the <script> injected.
    // new HtmlWebpackPlugin({
    //   inject: true,
    //   template: paths.appHtml,
    // }),
    new CleanTerminalPlugin(),
    // Makes some environment variables available to the JS code, for example:
    // if (process.env.NODE_ENV === 'development') { ... }. See `./env.js`.
    new webpack.DefinePlugin(env.stringified),
    // This is necessary to emit hot updates (currently CSS only):
    // new webpack.HotModuleReplacementPlugin(),
    // Watcher doesn't work well if you mistype casing in a path so we use
    // a plugin that prints an error when you attempt to do this.
    // See https://github.com/facebookincubator/create-react-app/issues/240
    new CaseSensitivePathsPlugin(),
    // If you require a missing module and then `npm install` it, you still have
    // to restart the development server for Webpack to discover it. This plugin
    // makes the discovery automatic so you don't have to restart.
    // See https://github.com/facebookincubator/create-react-app/issues/186
    // new WatchMissingNodeModulesPlugin(paths.appNodeModules),
    // Moment.js is an extremely popular library that bundles large locale files
    // by default due to how Webpack interprets its code. This is a practical
    // solution that requires the user to opt into importing specific locales.
    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    // You can remove this if you don't use Moment.js:
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new ReactRefreshWebpackPlugin(),
  ],
  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    dgram: "empty",
    fs: "empty",
    net: "empty",
    tls: "empty",
    child_process: "empty",
  },
  // Turn off performance hints during development because we don't do any
  // splitting or minification in interest of speed. These warnings become
  // cumbersome.
  performance: {
    hints: false,
  },
};
