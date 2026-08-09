/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // bpmn-auto-layout wird nur serverseitig genutzt; als externes ESM behandeln.
  experimental: {
    serverComponentsExternalPackages: ["bpmn-auto-layout"],
  },
};

export default nextConfig;
