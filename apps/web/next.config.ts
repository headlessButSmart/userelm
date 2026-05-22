import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@p2p-crm/shared', '@p2p-crm/platform'],
}

export default config
