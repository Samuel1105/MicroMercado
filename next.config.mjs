/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    swcMinify: true,
    // Necesario para Tauri
    images: {
        unoptimized: true,
    },
    // Para las rutas API en Vercel
    output: 'standalone'
};

// Cambia la exportación para que sea compatible con CommonJS
module.exports = nextConfig;