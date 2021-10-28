import { listenerStarter } from './ts/server/listener'
import { chatbotStarter } from './ts/server/chatbot'
import { EventEmitter } from 'events'
import type { starterContexts } from './ts/server/common'

console.log('server code loaded!')

const chatbotEmitter = new EventEmitter()
const listenerEmitter = new EventEmitter()

export const starter = (contexts: starterContexts): void => {
  const mixedContexts = { ...contexts, chatbotEmitter, listenerEmitter }
  listenerStarter(mixedContexts, { port: 624 })
  chatbotStarter(mixedContexts)
}
