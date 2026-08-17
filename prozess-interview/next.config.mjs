/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Schlankes, self-contained Server-Bundle für den Docker-/On-Prem-Betrieb.
  output: "standalone",
  // bpmn-auto-layout wird nur serverseitig genutzt; als externes ESM behandeln.
  experimental: {
    // Serverseitig genutzte Pakete mit dynamischem require: nicht bündeln,
    // sondern zur Laufzeit aus node_modules laden (bpmn-auto-layout, pdf-parse).
    serverComponentsExternalPackages: ["bpmn-auto-layout", "pdf-parse"],
  },
};

export default nextConfig;
