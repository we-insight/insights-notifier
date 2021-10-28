import type * as wechaty from 'wechaty'
import type { EventEmitter } from 'events'

export interface starterContexts {
  wechaty: typeof wechaty
  chatbotEmitter: EventEmitter
  listenerEmitter: EventEmitter
  [key: string]: unknown
}
