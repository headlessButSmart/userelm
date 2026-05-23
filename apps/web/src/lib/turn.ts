export function getTurnServers(_userId: string): RTCIceServer[] {
  const url = process.env['TURN_URL'] ?? ''       // e.g. turn:free.expressturn.com:3478
  const username = process.env['TURN_USERNAME'] ?? ''
  const credential = process.env['TURN_PASSWORD'] ?? ''

  const servers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]

  if (url && username && credential) {
    servers.push({ urls: url, username, credential })
  }

  return servers
}
