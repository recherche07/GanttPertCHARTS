"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Effet pour détecter le défilement et changer l'apparence de la navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Fonction pour déterminer si un lien est actif
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };
  
  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-gradient-to-r from-indigo-700 to-purple-700'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L15 15" stroke={scrolled ? '#4F46E5' : 'white'} strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="9" stroke={scrolled ? '#4F46E5' : 'white'} strokeWidth="2"/>
                </svg>
                <span className={`ml-2 text-xl font-bold ${scrolled ? 'text-gray-800' : 'text-white'}`}>Task Scheduler Pro</span>
              </div>
            </div>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <Link 
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${isActive('/') 
                  ? (scrolled ? 'border-indigo-600 text-indigo-600' : 'border-white text-white') 
                  : (scrolled ? 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' : 'border-transparent text-gray-100 hover:border-gray-300 hover:text-white')}`}
              >
                Tableau de bord
              </Link>
              <Link 
                href="/gantt"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${isActive('/gantt') 
                  ? (scrolled ? 'border-indigo-600 text-indigo-600' : 'border-white text-white') 
                  : (scrolled ? 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' : 'border-transparent text-gray-100 hover:border-gray-300 hover:text-white')}`}
              >
                Diagramme de Gantt
              </Link>
              <Link 
                href="/pert"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${isActive('/pert') 
                  ? (scrolled ? 'border-indigo-600 text-indigo-600' : 'border-white text-white') 
                  : (scrolled ? 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' : 'border-transparent text-gray-100 hover:border-gray-300 hover:text-white')}`}
              >
                Diagramme PERT
              </Link>
              <Link 
                href="/critical-path"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${isActive('/critical-path') 
                  ? (scrolled ? 'border-indigo-600 text-indigo-600' : 'border-white text-white') 
                  : (scrolled ? 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' : 'border-transparent text-gray-100 hover:border-gray-300 hover:text-white')}`}
              >
                Chemin Critique
              </Link>
            </div>
          </div>
          
          {/* Bouton menu mobile */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md ${scrolled ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' : 'text-white hover:text-white hover:bg-indigo-600'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500`}
            >
              <span className="sr-only">Ouvrir le menu principal</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Menu mobile */}
      <div className={`sm:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="pt-2 pb-3 space-y-1 bg-white shadow-lg rounded-b-lg">
          <Link 
            href="/"
            className={`block pl-3 pr-4 py-2 text-base font-medium border-l-4 ${isActive('/') 
              ? 'border-indigo-500 text-indigo-700 bg-indigo-50' 
              : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Tableau de bord
          </Link>
          <Link 
            href="/gantt"
            className={`block pl-3 pr-4 py-2 text-base font-medium border-l-4 ${isActive('/gantt') 
              ? 'border-indigo-500 text-indigo-700 bg-indigo-50' 
              : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Diagramme de Gantt
          </Link>
          <Link 
            href="/pert"
            className={`block pl-3 pr-4 py-2 text-base font-medium border-l-4 ${isActive('/pert') 
              ? 'border-indigo-500 text-indigo-700 bg-indigo-50' 
              : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Diagramme PERT
          </Link>
          <Link 
            href="/critical-path"
            className={`block pl-3 pr-4 py-2 text-base font-medium border-l-4 ${isActive('/critical-path') 
              ? 'border-indigo-500 text-indigo-700 bg-indigo-50' 
              : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Chemin Critique
          </Link>
        </div>
      </div>
    </nav>
  );
}
