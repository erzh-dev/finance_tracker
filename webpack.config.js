const webpack = require("webpack");
const path = require("path");
const fs = require("fs");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
//   .BundleAnalyzerPlugin;
const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const WebpackMessages = require("webpack-messages");

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);
const envRaw = Object.fromEntries(
  fs
    .readFileSync(path.resolve(__dirname, "src/shared/.env"), (_, data) =>
      data.toString()
    )
    .toString()
    .split("\n")
    .filter((item) => item.length > 0)
    .map((item) => item.split("="))
);
require("dotenv").config();
module.exports = function (_, argv) {
  const envName = argv.mode;
  const isHot = !!argv.hot;
  const isDev = envName === "development";
  process.env.IS_HOT = isHot;
  process.env.NODE_ENV = envName;
  process.env.PUBLIC_URL = envRaw.PUBLIC_URL.replace(/\r/, "");
  return {
    mode: "production",
    stats: {
      preset: "minimal",
      exclude: undefined,
      excludeModules: false,
      // maxModules: Infinity,
    },
    devtool: isHot ? "source-map" : "eval",
    entry: "./src/index.tsx",
    output: {
      path: path.resolve(__dirname, "build"),
      filename: "chunks/[name][chunkhash]_bundle.js",
      publicPath: process.env.PUBLIC_URL,
      assetModuleFilename: "media/[name][contenthash][ext][query]",
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", "jsx"],
      modules: ["node_modules", resolveApp("node_modules")].concat(
        resolveApp("src")
      ),
      aliasFields: ["browser"],
      alias: {
        react: path.join(__dirname, "node_modules", "react"),
      },
      // fallback: {
      //   https: require.resolve("https-browserify"),
      //   os: require.resolve("os-browserify/browser"),
      //   path: require.resolve("path-browserify"),
      //   stream: require.resolve("stream-browserify"),
      //   http: require.resolve("stream-http"),
      //   crypto: require.resolve("crypto-browserify"),
      // },
    },
    optimization: {
      emitOnErrors: isDev,
      usedExports: true,
      providedExports: true,
      innerGraph: true,
      nodeEnv: envName,
      minimize: !isHot,
      concatenateModules: true,
      flagIncludedChunks: true,
      mangleExports: "deterministic", //deterministic юзай если тебе нужно кэширование
      moduleIds: "deterministic", //deterministic юзай если тебе нужно кэширование
      mangleWasmImports: true,
      runtimeChunk: "single",
      chunkIds: isHot ? "named" : "total-size",
    },
    plugins: [
      new WebpackMessages({
        name: "client",
        logger: (str) => console.log(`❌ ${str} ❌`),
        onComplete: () => console.log("✨ Success ✨"),
      }),
      new webpack.ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      }),
      new WebpackManifestPlugin({
        fileName: "asset-manifest.json",
        publicPath: process.env.PUBLIC_URL,
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);
          const entrypointFiles = entrypoints.main.filter(
            (fileName) => !fileName.endsWith(".map")
          );

          return {
            files: manifestFiles,
            entrypoints: entrypointFiles,
          };
        },
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "./public",
            to: "./",
            globOptions: {
              ignore: ["**/index.html"],
            },
          },
        ],
      }),
      new HtmlWebPackPlugin({
        template: "public/index.html",
        inject: true,
      }),
      new InterpolateHtmlPlugin(HtmlWebPackPlugin, envRaw),
      new Dotenv({
        path: `src/shared/.env.${envName}`,
        allowEmptyValues: true, // allow empty variables (e.g. `FOO=`) (treat it as empty string, rather than missing)
        systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs.
        silent: true, // hide any errors
        defaults: false, // load '.env.defaults' as the default values if empty.
      }),
      new webpack.DefinePlugin({
        NODE_ENV: envName,
      }),
      new MiniCssExtractPlugin({
        filename: "styles.[name][contenthash].css",
        ignoreOrder: true,
      }),
      new CleanWebpackPlugin(),
      // new BundleAnalyzerPlugin({ openAnalyzer: false }),
      {
        apply: (compiler) => {
          if (!isHot) {
            compiler.hooks.done.tap("DonePlugin", () => {
              setTimeout(() => {
                process.exit(0);
              });
            });
          }
        },
      },
    ],
    module: {
      rules: [
        {
          test: /\.(webp|jpg|png|gif|woff|woff2|eot|ttf|otf|mp3|mp4|mov)$/,
          type: "asset/resource",
        },
        {
          test: /\.svg$/,
          type: "asset/resource",
          resourceQuery: /url/,
        },
        {
          test: /\.svg$/,
          issuer: /\.tsx$/,
          use: [{ loader: "@svgr/webpack", options: { typescript: true } }],
          resourceQuery: /svgr/,
        },
        {
          test: /\.(js|mjs|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "babel-loader",
              options: {
                babelrc: true,
              },
            },
            {
              loader: "@linaria/webpack-loader",
              options: { sourceMap: isHot },
            },
          ],
        },
        {
          test: /\.js$/,
          use: ["source-map-loader"],
          enforce: "pre",
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            {
              loader: "css-loader",
              options: { sourceMap: isHot },
            },
          ],
        },
      ],
    },
    ignoreWarnings: [/Failed to parse source map/],
    devServer: {
      compress: true,
      port: 3000,
      liveReload: true,
      historyApiFallback: true,
      // https: true,
      // host: '192.168.0.100'
      // disableHostCheck: true,
      // headers: {
      //   'Access-Control-Allow-Origin': '*'
      // },
    },
  };
};
