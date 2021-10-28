import http from 'http'
import { URL } from 'url'
import { chatbotAPIDispatcher } from './api_chatbot'
import type { starterContexts } from './common'
import { isPromise } from './utils'

const DEFAULT_PORT = 624

interface ListenerConfig {
  port?: number
}
interface APIhandlers {
  [key: string]: {
    [key: string]: (req: http.IncomingMessage, res: http.ServerResponse, contexts: starterContexts) => void
  }
}

const apiHandlers: APIhandlers = {
  '/chatbot': {
    get: (req, res, contexts) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end(JSON.stringify({
        errcode: '0',
        errmsg: 'GET method received, please use POST method instead!'
      }))
    },
    post: (req, res, contexts) => {
      let postData = ''
      req.on('data', chunk => {
        postData = postData + String(chunk)
      })
      req.on('end', () => {
        const payload = JSON.parse(postData)
        const result = chatbotAPIDispatcher(payload, { req, res, ...contexts })
        // TODO: improve type inference
        if (isPromise(result)) {
          void (result as Promise<Record<string, unknown>>).then((val) => {
            res.end(JSON.stringify(val))
          })
        } else {
          res.end(JSON.stringify(result))
        }
      })
    }
  }
}

export const listenerStarter = (contexts: starterContexts, config: ListenerConfig): void => {
  const { port = DEFAULT_PORT } = config

  const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url ?? '', 'http://localhost')
    const isAPIRequest = pathname.startsWith('/api')

    if (isAPIRequest) {
      const apiSubpath = pathname.replace('/api', '')
      const method = req.method?.toLowerCase() ?? 'get'

      const context = apiHandlers[apiSubpath]
      const handler = context?.[method]

      if (typeof handler === 'function') {
        handler(req, res, contexts)
      } else {
        res.statusCode = 404
        res.end()
      }
    } else {
      res.statusCode = 404
      res.end('')
    }
  })

  server.listen(port, () => {
    console.log(`Server is running on http://127.0.0.1:${port}/`)
  })
}
