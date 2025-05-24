/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Désactiver la vérification ESLint pendant la compilation
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
