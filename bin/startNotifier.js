/**
 * Wechaty - WeChat Bot SDK for Personal Account, Powered by TypeScript, Docker, and 💖
 *  - https://github.com/wechaty/wechaty
 */
import * as wechaty from 'wechaty'

/**
 * wechaty 的运行依赖很多静态的库文件，执意打包的话太繁琐，而且工作量较大，
 * 索性采用依赖注入的方式，项目主体部分只写与 wechaty 不直接相关的业务代码，
 * 暴露约定好的接口，然后交由运行时注入 wechaty 调用。
 */
import('./_insights-notifier.cjs').then(pkg => {
  const { starter } = pkg.default.MobiusLib
  console.log('Starting notifier')
  starter({ wechaty })
})
