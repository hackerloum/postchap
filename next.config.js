/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  webpack(config, { isServer }) {
    if (isServer) {
      // Fabric.js and its peer deps are browser-only — prevent them from being
      // bundled for the Node.js server. They are imported dynamically (import())
      // inside a useEffect so they never execute on the server.
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals ?? {}]),
        "fabric",
        "canvas",
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
