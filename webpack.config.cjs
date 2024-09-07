const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  entry: './src/index.js',  // Указываем JS как точку входа
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',  // Добавляем хэш для устранения кэширования
    clean: true,  // Очищает директорию dist перед новой сборкой
  },
  devServer: {
    open: true,
    host: 'localhost',
    hot: true,  // Включаем HMR для автоматического обновления страницы
    watchFiles: ['src/**/*'],  // Следим за изменениями в каталоге src
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',  // Указываем путь к HTML-шаблону в корне проекта
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader', 'postcss-loader'],
      },
      {
        test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'url-loader?limit=10000',
      },
      {
        test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/,
        use: 'file-loader',
      },
    ],
  },
  watchOptions: {
    aggregateTimeout: 300,  // Задержка перед пересборкой после изменений
    poll: 1000,             // Проверка изменений файлов каждые 1000 мс (поллинг)
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = 'production';
  } else {
    config.mode = 'development';
  }
  return config;
};
