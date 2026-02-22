/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["geist"],
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  experimental: {
    serverComponentsExternalPackages: [
      "firebase-admin",
      "firebase-admin/app",
      "firebase-admin/auth",
      "firebase-admin/firestore",
      "firebase-admin/storage",
      "firebase-admin/database",
    ],
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "firebase",
    ],
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
    } else {
      // Prevent server-only packages from ever reaching client bundle (mobile crash fix)
      config.resolve.alias = {
        ...config.resolve.alias,
        "firebase-admin": false,
        "firebase-admin/app": false,
        "firebase-admin/auth": false,
        "firebase-admin/firestore": false,
        "firebase-admin/storage": false,
        "firebase-admin/database": false,
        fs: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
