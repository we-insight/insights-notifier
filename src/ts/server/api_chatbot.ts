import http from 'http'
import { getData, setData } from './localdata'
import type { starterContexts } from './common'

interface apiHandlerContexts extends starterContexts {
  req: http.IncomingMessage
  res: http.ServerResponse
}
interface apiPayload {
  type?: string
  [key: string]: unknown
}
export type apiResponse = Record<string, unknown> | Promise<Record<string, unknown>>
interface APIs {
  [key: string]: (payload: apiPayload, context: apiHandlerContexts) => apiResponse
}

const chatbotAPIs: APIs = {
  // 接收到状态指令的之后，查询 chatbot 的状态，并返回
  status: (payload, contexts) => {
    const data = getData()
    console.log('[ChatbotAPI] status: ', data)
    return data
  },
  // 接收到登录指令的时候，判断 chatbot 的状态，
  //   -> 如果未登录，则登录并返回二维码，更新状态为待扫码，登录成功之后，返回状态
  //   -> 如果已经登录，则不做任何操作
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  login: (payload, contexts) => {
    const { chatbotEmitter, listenerEmitter } = contexts
    const promise: apiResponse = new Promise((resolve, reject) => {
      chatbotEmitter.addListener('login', () => {
        console.log('[ChatbotAPI] login: chatbot login')
        setData({ ...getData(), status: 'waiting' })
        resolve({ ...getData() })
      })
      listenerEmitter.emit('login')
    })
    return promise
  },
  // 接收到退出指令的时候，判断 chatbot 的状态，如果已登录，则退出并更新状态，如果未登录，则不做任何操作
  logout: (payload, contexts) => {
    const { listenerEmitter } = contexts
    listenerEmitter.emit('logout')
    return {}
  },
  // 接收到状态指令之后，通知 chatbot 发送消息
  message: (payload, contexts) => {
    const { listenerEmitter } = contexts
    listenerEmitter.emit('message', payload.message ?? payload.data)
    return {}
  }
}

export const chatbotAPIDispatcher = (payload: apiPayload, contexts: apiHandlerContexts): apiResponse => {
  const { type = 'message' } = payload
  return chatbotAPIs[type](payload, contexts)
}
