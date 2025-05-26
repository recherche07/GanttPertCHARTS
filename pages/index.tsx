import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

/**
 * Page d'accueil qui redirige automatiquement vers la page principale du projet
 * Affiche un écran de chargement pendant la redirection
 * 
 * @returns {JSX.Element} Composant de la page d'accueil
 */
export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Rediriger vers la page project après un court délai pour montrer l'écran de chargement
    const redirectTimer = setTimeout(() => {
      router.push('/project');
    }, 800); // Délai de 800ms pour une meilleure expérience utilisateur
    
    // Nettoyage du timer si le composant est démonté avant la fin du délai
    return () => clearTimeout(redirectTimer);
  }, [router]);
  
  return (
    <>
      <Head>
        <title>GanttPertCharts - Gestion de Projet</title>
        <meta name="description" content="Application de gestion de projet avec diagrammes Gantt et PERT" />
      </Head>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f7fa'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          color: '#4f46e5', 
          marginBottom: '1rem',
          fontWeight: 'bold'
        }}>
          GanttPertCharts
        </h1>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          border: '5px solid #e5e7eb', 
          borderTopColor: '#4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <p style={{ color: '#6b7280' }}>Chargement de l'application de gestion de projet...</p>
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}
