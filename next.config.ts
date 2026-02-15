import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['@libsql/client', 'libsql'],
  
  // Electron için görüntü optimizasyonu kapatıldı
  images: {
    unoptimized: true,
  },
  
  // Turbopack root directory (multiple lockfile warning fix)
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
