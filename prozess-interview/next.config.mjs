/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Schlankes, self-contained Server-Bundle für den Docker-/On-Prem-Betrieb.
  output: "standalone",
  // bpmn-auto-layout wird nur serverseitig genutzt; als externes ESM behandeln.
  experimental: {
    serverComponentsExternalPackages: ["bpmn-auto-layout"],
  },
};

export default nextConfig;
