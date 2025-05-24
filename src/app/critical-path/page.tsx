"use client";

import { useEffect, useState } from 'react';
import { Task, CriticalPathAnalysis } from '@/types/task';
import { performPERTAnalysis } from '@/utils/scheduling';

export default function CriticalPathPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [criticalPathAnalysis, setCriticalPathAnalysis] = useState<CriticalPathAnalysis | null>(null);
  
  // Charger les tâches depuis le localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        // Convertir les dates String en objets Date
        const parsedTasks = JSON.parse(savedTasks, (key, value) => {
          if (key === 'startDate' || key === 'endDate') {
            return value ? new Date(value) : undefined;
          }
          return value;
        });
        
        // Effectuer l'analyse PERT et obtenir l'analyse du chemin critique
        const pertResult = performPERTAnalysis(parsedTasks);
        setTasks(pertResult.tasks);
        setCriticalPathAnalysis(pertResult.criticalPathAnalysis);
      } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
      }
    }
  }, []);

  if (tasks.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Chemin Critique</h1>
          <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
            <p className="text-gray-600">
              Aucune tâche disponible. Veuillez d'abord ajouter des tâches sur la page d'accueil.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const criticalTasks = tasks.filter(task => task.isCritical);

  return (
    <div className="container mx-auto py-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Chemin Critique</h1>
        
        <div className="mb-6">
          <p className="text-gray-700">
            Le chemin critique est la séquence de tâches qui détermine la durée minimale du projet.
            Toute extension d'une tâche sur ce chemin retardera l'ensemble du projet.
          </p>
          
          {criticalPathAnalysis && (
            <div className="mt-4">
              <p className="text-gray-700">
                <span className="font-semibold">Durée totale du projet:</span> {criticalPathAnalysis.projectDuration} jours
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Nombre de tâches critiques:</span> {criticalTasks.length} sur {tasks.length} tâches
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Séquence du Chemin Critique</h2>
          <div className="flex flex-wrap gap-2 items-center">
            {criticalTasks.map((task, index) => (
              <div key={task.id} className="flex items-center">
                <div className="bg-red-100 border border-red-300 rounded-lg px-3 py-2 text-red-800">
                  {task.name} ({task.duration}j)
                </div>
                {index < criticalTasks.length - 1 && (
                  <div className="mx-2 text-red-500">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Détails des Tâches Critiques</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Début au plus tôt
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fin au plus tôt
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Début au plus tard
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fin au plus tard
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marge
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {criticalTasks.map((task) => (
                <tr key={task.id} className="bg-red-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {task.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.duration} jours
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Jour {task.earliestStart}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Jour {task.earliestFinish}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Jour {task.latestStart}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Jour {task.latestFinish}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.slack} jours
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Recommandations</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <span className="font-medium">Concentrez vos ressources</span> sur les tâches du chemin critique pour éviter tout retard.
            </li>
            <li>
              <span className="font-medium">Créez des plans de contingence</span> pour les tâches critiques afin de gérer les risques potentiels.
            </li>
            <li>
              <span className="font-medium">Surveillez de près l'avancement</span> des tâches critiques et réagissez rapidement en cas de retard.
            </li>
            <li>
              <span className="font-medium">Envisagez d'accélérer</span> certaines tâches critiques si possible pour réduire la durée totale du projet.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
