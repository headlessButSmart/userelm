export async function verifyTurnstile(token: string, ip: string) {
  // In dev, skip verification when using Cloudflare's test key
  if (process.env['TURNSTILE_SECRET_KEY'] === '1x0000000000000000000000000000000AA') return

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env['TURNSTILE_SECRET_KEY'],
      response: token,
      remoteip: ip,
    }),
  })
  const data = (await res.json()) as { success: boolean }
  if (!data.success) throw new Error('Turnstile verification failed')
}
