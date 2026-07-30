import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer trae binarios/fuentes que no deben pasar por el bundler
  // del server; se resuelven como paquete externo en las funciones de Node.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Fija la raíz del workspace a este proyecto (hay un package-lock.json en el
  // home del usuario que Next detectaba como raíz por error).
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
