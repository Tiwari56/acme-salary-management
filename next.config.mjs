/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: "/portfolio", destination: "/#comparison", permanent: false },
      { source: "/portfolio/:path*", destination: "/#comparison", permanent: false },
    ]
  },
}

export default nextConfig
