import type { ScanStatus, Contact, Message, Wechaty } from 'wechaty'
import type { starterContexts } from './common'
import { getData, setData } from './localdata'

const WECHATY_PUPPET = 'wechaty-puppet-wechat'

// 按照官方的说法，指定 puppet 类型可以通过“设置环境变量”和“构建函数参数”两种方式提供，
// 没有进行深入研究，故此处对两种方式都做了实现
// @refer: https://wechaty.js.org/docs/puppet-providers/
const initializeEnv = (): void => {
  process.env.WECHATY_PUPPET = WECHATY_PUPPET
  process.env.WECHATY_LOG = 'verbose'
}

const setQr = (qr: string): void => {
  const data = getData()
  data.qr = qr
  setData(data)
}
const getQr = (): string => {
  const data = getData()
  return data?.qr
}

export const chatbotStarter = (contexts: starterContexts): void => {
  initializeEnv()

  const { wechaty, chatbotEmitter, listenerEmitter } = contexts
  const {
    ScanStatus,
    Wechaty,
    log
  } = wechaty

  interface Store {
    instance: null | Wechaty
  }
  const store: Store = {
    instance: null
  }

  const onScan = (qrcode: string, status: ScanStatus): void => {
    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
      const qrcodeImageUrl = [
        'https://wechaty.js.org/qrcode/',
        encodeURIComponent(qrcode)
      ].join('')
      setQr(qrcodeImageUrl)
      log.info('[Chatbot]', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)
    } else {
      log.info('[Chatbot]', 'onScan: %s(%s)', ScanStatus[status], status)
    }
  }

  const onLogin = (user: Contact): void => {
    log.info('[Chatbot]', '%s login', user)
  }

  const onLogout = (user: Contact): void => {
    log.info('[Chatbot]', '%s logout', user)
  }

  const onMessage = async (msg: Message): Promise<void> => {
    log.info('[Chatbot]', msg.toString())
  }

  const onError = (e: Error): void => {
    log.error('[Chatbot]', '%s', e)
  }

  const initializeBotInstance = (): void => {
    const chatbot = new Wechaty({
      name: 'insights-notifier',
      // Specify a `puppet` for a specific protocol (Web/Pad/Mac/Windows, etc).
      // @refer: https://wechaty.js.org/docs/puppet-providers/
      puppet: WECHATY_PUPPET
    })

    chatbot.on('scan', onScan)
    chatbot.on('login', onLogin)
    chatbot.on('logout', onLogout)
    chatbot.on('message', onMessage)
    chatbot.on('error', onError)

    store.instance = chatbot
  }
  initializeBotInstance()

  listenerEmitter.addListener('login', () => {
    const chatbot = store.instance
    if (chatbot === null) return

    chatbot.start()
      .then(() => {
        log.info('[Chatbot]', 'Starter Bot Started.')
        chatbotEmitter.emit('login', {})
      })
      .catch((e: Error) => log.error('[Chatbot]', e))
  })

  listenerEmitter.addListener('logout', () => {
    const chatbot = store.instance
    if (chatbot === null) return
    new Promise((resolve, reject) => {
      if (chatbot.logonoff()) {
        resolve(chatbot.logout().then(() => {
          log.info('[Chatbot]', 'Starter Bot Logout.')
        }))
      } else {
        resolve({})
      }
    })
      .then(() => store.instance?.stop())
      .then(() => {
        log.info('[Chatbot]', 'Starter Bot Stopped.')
        setData({})
      })
      .catch((e: Error) => log.error('[Chatbot]', e))
  })

  interface GrapplerDataItem {
    publishTime: number
    grapTime: number
    title: string
    url: string
  }
  const buildMessageText = (message: GrapplerDataItem[]): string => {
    const text = message.map((item) =>
      `[${new Date(item.publishTime * 1000).toISOString().slice(0, 10)}] ${item.title}: ${item.url}`).join('\n')
    return `🌏 来活儿了，国务院刚刚发布了最新政策！\n\n${text}`
  }
  listenerEmitter.addListener('message', (message) => {
    try {
      const chatbot = store.instance
      if (chatbot === null) return

      const room = chatbot.Room.find({ topic: '国务工作监督委员会' })
      void room.then((room) => {
        void room?.say(buildMessageText(message))
      })
    } catch (error) {
      log.error('[Chatbot] destruct message failed: ', error)
    }
  })
}
