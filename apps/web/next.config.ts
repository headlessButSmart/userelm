import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@p2p-crm/shared', '@p2p-crm/platform'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            // Allow any TrustedType policy name. Enumerating specific names
            // causes issues because browsers AND-combine multiple CSP headers,
            // and Next.js / Turnstile / bundler each register different names.
            key: 'Content-Security-Policy',
            value: "trusted-types * 'allow-duplicates'",
          },
        ],
      },
    ]
  },
}

export default config
