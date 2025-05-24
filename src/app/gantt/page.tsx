"use client";

import { useEffect, useState } from 'react';
import GanttChart from '@/components/charts/GanttChart';
import { Task } from '@/types/task';
import { performPERTAnalysis } from '@/utils/scheduling';

export default function GanttPage() {
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

  if (tasks.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Diagramme de Gantt</h1>
          <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
            <p className="text-gray-600">
              Aucune tâche disponible. Veuillez d'abord ajouter des tâches sur la page d'accueil.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Diagramme de Gantt</h1>
        <div className="mb-4">
          <p className="text-gray-700">
            Visualisation des tâches et de leurs dépendances sous forme de diagramme de Gantt.
            Les tâches critiques sont affichées en rouge.
          </p>
          <p className="text-gray-700 mt-2">
            <span className="font-semibold">Durée totale du projet:</span> {Math.max(...tasks.map(t => t.earliestFinish))} jours
          </p>
        </div>
        <div className="mt-6 h-[600px]">
          <GanttChart tasks={tasks} />
        </div>
      </div>
    </div>
  );
}
