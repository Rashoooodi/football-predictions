/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
      allowedOrigins: [
        "production.example.com",
        "www.production.example.com",
        "localhost:5000",
        "localhost:3000",
        "staging.example.com",
      ],
    },
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
