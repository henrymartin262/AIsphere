const nextConfig = {
  /* Dev 模式下关闭 StrictMode，避免 useEffect 双重触发导致请求翻倍 */
  reactStrictMode: process.env.NODE_ENV === "production",

  /* 代理 /api/* → 后端 4000 端口，解决远程访问时浏览器无法连接 localhost:4000 的问题 */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },

  /* 加快首次页面编译速度 */
  experimental: {
    optimizePackageImports: ["@rainbow-me/rainbowkit", "wagmi", "viem"],
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false
    };
    return config;
  }
};

export default nextConfig;
