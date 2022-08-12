import { join, resolve } from 'path';
import webpack from 'webpack';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import pkg from './package.json';

function absolute(...args) {
  return join(__dirname, ...args);
}
const externals = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

const rules = [
  {
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
    },
  },
  {
    test: /\.(jpg|jpeg|gif|png|svg|otf|eot|svg|ttf|woff|woff2)$/,
    type: 'asset/inline'
  },
  {
    test: /\.txt$/,
    type: 'asset/source',
  },
  {
    test: /\worker\.js$/,
    use: {
      loader: 'workerize-loader',
      options: { inline: true }
    },
  },
];

const config = {
  entry: ['./src/component.js'],
  module: {
    rules,
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.js', '.jsx'],

    alias: {
      assets: resolve(__dirname, 'src/assets/'),
      utils: resolve(__dirname, 'src/utils/'),
      components: resolve(__dirname, 'src/components/'),
      data: resolve(__dirname, 'data/'),
      store: resolve(__dirname, 'src/store/'),
      logos: resolve(__dirname, 'src/logos/'),
      workers: resolve(__dirname, 'src/workers/'),
      pages: resolve(__dirname, 'src/pages/'),
    },
  },
  externals: externals.reduce(
    (acc, cur) => {
      acc[cur] = cur;
      return acc;
    },
    // eslint-disable-next-line no-new-object
    new Object()
  ),
};

const defaultEnv = { dev: false };

export default (env = defaultEnv) => {
  const appMode = env.mode || 'vosviewer';
  const bundleName = appMode === 'vosviewer' ? 'vosviewer-component' : `vosviewer-component-${appMode}`;

  config.stats = {
    errorDetails: true,
    logging: 'verbose',
  };

  config.mode = env.dev ? 'development' : 'production';
  config.output = {
    path: absolute('lib', bundleName),
    filename: 'index.js',
    library: {
      type: "module",
    },
  };
  let componentFileNamePrefix;
  switch (appMode) {
    case 'dimensions':
      componentFileNamePrefix = 'Dimensions';
      break;
    case 'zetaalpha':
      componentFileNamePrefix = 'ZetaAlpha';
      break;
    default:
      componentFileNamePrefix = 'VOSviewer';
      break;
  }
  config.resolve.alias['@component'] = resolve(__dirname, `src/${componentFileNamePrefix}App.js`);

  config.experiments = {
    outputModule: true
  };

  let jsonConfig;
  try {
    jsonConfig = require(resolve(__dirname, env.config));
  } catch (ex) {
    jsonConfig = {};
  }

  if (jsonConfig.parameters) {
    delete jsonConfig.parameters.map;
    delete jsonConfig.parameters.network;
    delete jsonConfig.parameters.json;
  }

  config.plugins = [
    new NodePolyfillPlugin(),
    new webpack.DefinePlugin({
      NODE_ENV: JSON.stringify('production'),
      PRODUCTION: JSON.stringify(true),
      IS_REACT_COMPONENT: JSON.stringify(true),
      MODE: JSON.stringify(appMode),
      CONFIG: JSON.stringify(jsonConfig)
    }),
  ];

  return config;
};