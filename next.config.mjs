/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    swcMinify: true,
    images: {
        unoptimized: true,
    },
    output: 'standalone'
};

export default nextConfig;