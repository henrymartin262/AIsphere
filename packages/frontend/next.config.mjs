const nextConfig = {
  /* Dev 模式下关闭 StrictMode，避免 useEffect 双重触发导致请求翻倍 */
  reactStrictMode: process.env.NODE_ENV === "production",

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
