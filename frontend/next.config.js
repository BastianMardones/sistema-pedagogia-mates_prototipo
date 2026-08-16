/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api",
    NEXT_PUBLIC_CHATBOT_URL: process.env.NEXT_PUBLIC_CHATBOT_URL || "http://localhost:8000",
  },
};

module.exports = nextConfig;
