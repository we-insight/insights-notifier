import { emptyDirSync, rootResolvePath, copyFileSync } from './utils.js'

import path from 'path'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import webpackHotMiddleware from 'webpack-hot-middleware'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { getWebpackConfig } from '../webpack.config.js'

const BUILD_MODE = 'development'
const BUILD_TARGET_DES = 'dev'
const resolvePathInDes = (...paths) => path.join(BUILD_TARGET_DES, ...paths)
emptyDirSync(rootResolvePath(BUILD_TARGET_DES))

// ref: https://github.com/webpack/webpack-dev-server/blob/master/examples/api/simple/server.js
// ref: https://webpack.js.org/configuration/dev-server/
const webpackConfig = getWebpackConfig({ mode: BUILD_MODE })
// console.info('【webpackConfig】' + JSON.stringify(webpackConfig))
const devServerOptions = {
  headers: { 'Access-Control-Allow-Origin': '*' },
  https: false,
  writeToDisk: true,
  compress: true,
  port: 3000,
  open: true, // browser extension development do not need to open the page
  hot: true,
  clientLogLevel: 'trace',
  watchOptions: {
    aggregateTimeout: 1000
    // ignored: /node_modules/
  },
  disableHostCheck: true,
  historyApiFallback: true
}
// console.info('【devServerOptions】' + JSON.stringify(devServerOptions))

const [webConfig, serverConfig] = webpackConfig
// refer: https://github.com/webpack-contrib/webpack-hot-middleware#multi-compiler-mode
Object.entries(webConfig.entry).forEach(([key, value]) => {
  webConfig.entry[key] = [
    `webpack-hot-middleware/client?path=${devServerOptions.https ? 'https' : 'http'}://localhost:${devServerOptions.port}/__webpack_hmr&name=${key}`,
    'webpack/hot/dev-server',
    value
  ]
})
// Object.entries(serverConfig.entry).forEach(([key, value]) => {
//   serverConfig.entry[key] = [`webpack-hot-middleware/client?name=${key}`, 'webpack/hot/dev-server', value]
// })

let hotMiddleware
const startWeb = () => {
  return new Promise((resolve, reject) => {
    const compiler = webpack(webConfig)
    hotMiddleware = webpackHotMiddleware(compiler, {
      // path: '/__webpack_hmr',
      // path: rootResolvePath('__webpack_hmr'),
      // path: 'http://localhost:3000/__webpack_hmr',
      log: false,
      heartbeat: 2000
    })

    compiler.hooks.compilation.tap('compilation', compilation => {
      // refer: https://github.com/jantimon/html-webpack-plugin
      HtmlWebpackPlugin.getHooks(compilation).afterEmit.tapAsync(
        'html-webpack-plugin-after-emit',
        (data, callback) => {
          hotMiddleware.publish({ action: 'reload' })
          callback()
        }
      )
    })

    // webpack 打包结束之后 copy 必要的静态文件
    compiler.hooks.done.tap('MobiusCopyPlugin', () => {
      copyFileSync(
        rootResolvePath('src/statics/images/thoughts-daily.png'),
        rootResolvePath(resolvePathInDes('statics/images/thoughts-daily.png'))
      )
      copyFileSync(
        rootResolvePath('src/statics/images/beian.png'),
        rootResolvePath(resolvePathInDes('statics/images/beian.png'))
      )
      console.log('【MobiusCopyPlugin】 extra files copyed!')
    })

    // init the devServer
    const server = new WebpackDevServer(
      compiler,
      {
        ...devServerOptions,
        // quiet: true,
        before (app, ctx) {
          app.use(hotMiddleware)
          ctx.middleware.waitUntilValid(() => {
            resolve()
          })
        }
      }
    )

    // launch the devServer
    server.listen(devServerOptions.port, '127.0.0.1', () => {
      console.info(`Starting server on http://localhost:${devServerOptions.port}`)
    })
  })
}

const startServer = () => {
  return new Promise((resolve, reject) => {
    const compiler = webpack(serverConfig)

    compiler.hooks.watchRun.tapAsync('watch-run', (compilation, done) => {
      console.log('【main】', 'compiling...')
      hotMiddleware.publish({ action: 'compiling' })
      done()
    })

    compiler.watch({}, (err, stats) => {
      if (err) {
        console.log(err)
        return
      }

      copyFileSync(
        rootResolvePath(resolvePathInDes('server.cjs')),
        rootResolvePath('bin/_insights-notifier.cjs')
      )

      console.log('【main】 compiled!')

      resolve()
    })
  })
}

const start = () => {
  Promise.all([startWeb(), startServer()])
    .catch(err => {
      console.error(err)
    })
}

start()
