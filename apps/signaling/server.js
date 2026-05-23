const http = require('http')
const WebSocket = require('ws')

const port = parseInt(process.env.PORT || '8080', 10)

const server = http.createServer((req, res) => {
  // Health check for Firebase App Hosting
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('OK')
})

const wss = new WebSocket.Server({ server })

// topic -> Set<WebSocket>
const topics = new Map()

const send = (ws, msg) => {
  if (ws.readyState === WebSocket.OPEN) {
    try { ws.send(JSON.stringify(msg)) } catch {}
  }
}

wss.on('connection', (ws) => {
  const subscriptions = new Set()

  ws.on('message', (data) => {
    let msg
    try { msg = JSON.parse(data.toString()) } catch { return }

    switch (msg.type) {
      case 'subscribe':
        ;(msg.topics || []).forEach((topic) => {
          if (typeof topic !== 'string') return
          if (!topics.has(topic)) topics.set(topic, new Set())
          topics.get(topic).add(ws)
          subscriptions.add(topic)
        })
        break

      case 'unsubscribe':
        ;(msg.topics || []).forEach((topic) => {
          topics.get(topic)?.delete(ws)
          subscriptions.delete(topic)
        })
        break

      case 'publish':
        if (typeof msg.topic === 'string') {
          const receivers = topics.get(msg.topic)
          if (receivers) {
            const out = JSON.stringify(msg)
            receivers.forEach((receiver) => {
              if (receiver !== ws && receiver.readyState === WebSocket.OPEN) {
                try { receiver.send(out) } catch {}
              }
            })
          }
        }
        break

      case 'ping':
        send(ws, { type: 'pong' })
        break
    }
  })

  ws.on('close', () => {
    subscriptions.forEach((topic) => {
      const set = topics.get(topic)
      if (set) {
        set.delete(ws)
        if (set.size === 0) topics.delete(topic)
      }
    })
    subscriptions.clear()
  })

  ws.on('error', (err) => console.error('ws error:', err.message))
})

server.listen(port, () => console.log(`Signaling server on port ${port}`))
