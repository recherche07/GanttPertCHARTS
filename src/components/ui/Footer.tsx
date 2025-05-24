"use client";

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center">
              <svg className="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L15 15" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="#4F46E5" strokeWidth="2"/>
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-800">Task Scheduler Pro</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">Navigation</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/" className="text-base text-gray-500 hover:text-indigo-600 transition-colors">
                  Tableau de bord
                </Link>
              </li>
              <li>
                <Link href="/gantt" className="text-base text-gray-500 hover:text-indigo-600 transition-colors">
                  Diagramme de Gantt
                </Link>
              </li>
              <li>
                <Link href="/pert" className="text-base text-gray-500 hover:text-indigo-600 transition-colors">
                  Diagramme PERT
                </Link>
              </li>
              <li>
                <Link href="/critical-path" className="text-base text-gray-500 hover:text-indigo-600 transition-colors">
                  Chemin Critique
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            &copy; {currentYear} Task Scheduler Pro
          </p>
        </div>
      </div>
    </footer>
  );
}
