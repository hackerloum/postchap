/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["geist"],
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(
        "firebase-admin",
        "firebase-admin/app",
        "firebase-admin/firestore",
        "firebase-admin/auth",
        "firebase-admin/storage",
        "firebase-admin/database"
      );
    }
    return config;
  },
};

module.exports = nextConfig;
