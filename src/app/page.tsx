"use client";

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TaskForm from '@/components/forms/TaskForm';
import TaskList from '@/components/ui/TaskList';
import { Task } from '@/types/task';
import { performPERTAnalysis } from '@/utils/scheduling';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Charger les tâches depuis le localStorage au chargement de la page
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
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
      }
    }
  }, []);

  // Sauvegarder les tâches dans le localStorage à chaque modification
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Ajouter ou mettre à jour une tâche
  const handleTaskSubmit = (task: Task) => {
    // Si une tâche est en cours d'édition, la mettre à jour
    if (editingTask) {
      const updatedTasks = tasks.map(t => 
        t.id === task.id ? task : t
      );
      
      // Mettre à jour les tâches avec l'analyse PERT
      const analyzedTasks = performPERTAnalysis(updatedTasks).tasks;
      setTasks(analyzedTasks);
      setEditingTask(null);
    } else {
      // Sinon, ajouter une nouvelle tâche
      const newTasks = [...tasks, task];
      
      // Mettre à jour les tâches avec l'analyse PERT
      const analyzedTasks = performPERTAnalysis(newTasks).tasks;
      setTasks(analyzedTasks);
    }
  };

  // Supprimer une tâche
  const handleDeleteTask = (taskId: string) => {
    // Vérifier si d'autres tâches dépendent de celle-ci
    const hasDependants = tasks.some(task => 
      task.dependencies.includes(taskId)
    );

    if (hasDependants) {
      alert('Cette tâche ne peut pas être supprimée car d\'autres tâches en dépendent.');
      return;
    }

    const updatedTasks = tasks.filter(task => task.id !== taskId);
    // Mettre à jour les tâches avec l'analyse PERT
    const analyzedTasks = performPERTAnalysis(updatedTasks).tasks;
    setTasks(analyzedTasks.length > 0 ? analyzedTasks : []);
  };

  // Éditer une tâche
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              {editingTask ? 'Modifier la tâche' : 'Ajouter une tâche'}
            </h2>
          </div>
          <TaskForm 
            existingTasks={tasks} 
            onSubmit={handleTaskSubmit} 
            initialData={editingTask || undefined}
          />
          {editingTask && (
            <div className="p-4 border-t">
              <button
                onClick={() => setEditingTask(null)}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Annuler l'édition
              </button>
            </div>
          )}
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Liste des tâches</h2>
              {tasks.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Durée totale du projet: <span className="font-medium">{Math.max(...tasks.map(t => t.earliestFinish))} jours</span>
                </p>
              )}
            </div>
            <TaskList 
              tasks={tasks} 
              onEdit={handleEditTask} 
              onDelete={handleDeleteTask} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
