/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Désactiver la vérification ESLint pendant la compilation
    ignoreDuringBuilds: true,
  },
  // Utiliser uniquement le dossier pages et ignorer le dossier app
  useFileSystemPublicRoutes: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

module.exports = nextConfig;
