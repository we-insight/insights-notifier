import { emptyDirSync, copyFileSync, rootResolvePath } from './utils.js'
import { getWebpackConfig } from '../webpack.config.js'
import webpack from 'webpack'
import path from 'path'

const BUILD_MODE = 'build'
const BUILD_TARGET_DES = 'build'
const resolvePathInDes = (...paths) => path.join(BUILD_TARGET_DES, ...paths)

const empty = () => {
  return new Promise((resolve) => {
    emptyDirSync(rootResolvePath(BUILD_TARGET_DES))
    resolve()
  })
}

const webpackConfig = getWebpackConfig({ mode: BUILD_MODE })
// console.info('【webpackConfig】' + JSON.stringify(webpackConfig))
const [webConfig, serverConfig] = webpackConfig

const pack = () => {
  return new Promise((resolve, reject) => {
    console.log('【pack web】 start...')
    webpack([webConfig, serverConfig])
      .run((err, stats) => {
        // @see https://webpack.js.org/api/node/#error-handling
        if (err) {
          console.error(err.stack || err)
          if (err.details) {
            console.error(err.details)
          }
          return
        }

        const info = stats.toJson()

        if (stats.hasErrors()) {
          console.error(info.errors)
        }

        if (stats.hasWarnings()) {
          console.warn(info.warnings)
        }

        console.log('【pack web】 complete!')

        resolve()
      })
  })
}

const copy = () => {
  return new Promise((resolve) => {
    console.log('【copy】 start...')
    copyFileSync(
      rootResolvePath('src/statics/images/thoughts-daily.png'),
      rootResolvePath(resolvePathInDes('statics/images/thoughts-daily.png'))
    )
    copyFileSync(
      rootResolvePath('src/statics/images/beian.png'),
      rootResolvePath(resolvePathInDes('statics/images/beian.png'))
    )

    copyFileSync(
      rootResolvePath(resolvePathInDes('server.cjs')),
      rootResolvePath('bin/_insights-notifier.cjs')
    )

    console.log('【copy】 complete!')
    resolve()
  })
}

// execute
empty()
  .then(() => Promise.all([pack()]))
  .then(() => copy())
  .then(() => {
    console.log(`${BUILD_MODE} Build Complete!!!`)
  })
