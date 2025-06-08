/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.integration.app',
        pathname: '/files/**',
      },
    ],
  },
  // Increase serverless function timeout
  functions: {
    maxDuration: 60, // Increase to 60 seconds
  }
}

module.exports = nextConfig 