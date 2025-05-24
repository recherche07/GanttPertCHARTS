"use client";

import { useEffect, useState } from 'react';
import ProfessionalPERTChart from '@/components/charts/ProfessionalPERTChart';
import { Task } from '@/types/task';
import { performPERTAnalysis } from '@/utils/scheduling';

export default function PERTPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  
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
        
        // S'assurer que l'analyse PERT a été effectuée
        const analyzedTasks = performPERTAnalysis(parsedTasks).tasks;
        setTasks(analyzedTasks);
      } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
      }
    }
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Diagramme PERT</h1>
        <div className="mb-4">
          <p className="text-gray-700">
            Le diagramme PERT (Program Evaluation and Review Technique) permet de visualiser les tâches, 
            leurs dépendances et le chemin critique du projet.
          </p>
          {tasks.length > 0 && (
            <p className="text-gray-700 mt-2">
              <span className="font-semibold">Durée totale du projet:</span> {Math.max(...tasks.map(t => t.earliestFinish))} jours
            </p>
          )}
        </div>
        
        <div className="mt-6">
          <ProfessionalPERTChart tasks={tasks} timeUnit="jours" />
        </div>
      </div>
    </div>
  );
}
