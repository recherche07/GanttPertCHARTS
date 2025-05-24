import React, { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { v4 as uuidv4 } from 'uuid';

interface TaskFormProps {
  existingTasks: Task[];
  onSubmit: (task: Task) => void;
  initialData?: Task;
  timeUnit?: string;
}

export default function TaskForm({ existingTasks, onSubmit, initialData, timeUnit = 'jours' }: TaskFormProps) {
  // Utiliser un état local au lieu de react-hook-form pour éviter les problèmes de typage
  const [formData, setFormData] = useState<{
    name: string;
    duration: number;
    description: string;
    dependencies: string[];
    priority: 'low' | 'medium' | 'high';
    startDate?: Date;
    endDate?: Date;
    resources: string;
    notes: string;
  }>({
    name: initialData?.name || '',
    duration: initialData?.duration || 1,
    description: initialData?.description || '',
    dependencies: initialData?.dependencies || [],
    priority: initialData?.priority || 'medium',
    startDate: initialData?.startDate,
    endDate: initialData?.endDate,
    resources: initialData?.resources || '',
    notes: initialData?.notes || ''
  });

  // États pour les erreurs
  const [errors, setErrors] = useState<{
    name?: string;
    duration?: string;
    startDate?: string;
    endDate?: string;
  }>({});
  
  // État pour suivre si le formulaire a été modifié
  const [isFormDirty, setIsFormDirty] = useState(false);
  
  // Mettre à jour le formulaire lorsque initialData change
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        duration: initialData.duration || 1,
        description: initialData.description || '',
        dependencies: initialData.dependencies || [],
        priority: initialData.priority || 'medium',
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        resources: initialData.resources || '',
        notes: initialData.notes || ''
      });
      setIsFormDirty(false);
    }
  }, [initialData]);

  // Gérer les changements dans les champs de formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) || 0 : value,
    }));
    setIsFormDirty(true);
  };
  
  // Gérer les changements de date
  const handleDateChange = (name: string, value: string) => {
    const date = value ? new Date(value) : undefined;
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
    setIsFormDirty(true);
  };

  // Gérer les changements de cases à cocher pour les dépendances
  const handleDependencyChange = (taskId: string, checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          dependencies: [...prev.dependencies, taskId],
        };
      } else {
        return {
          ...prev,
          dependencies: prev.dependencies.filter(id => id !== taskId),
        };
      }
    });
    setIsFormDirty(true);
  };
  
  // Réinitialiser le formulaire
  const handleReset = () => {
    setFormData({
      name: '',
      duration: 1,
      description: '',
      dependencies: [],
      priority: 'medium',
      startDate: undefined,
      endDate: undefined,
      resources: '',
      notes: ''
    });
    setErrors({});
    setIsFormDirty(false);
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors: { 
      name?: string; 
      duration?: string;
      startDate?: string;
      endDate?: string;
    } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom de la tâche est requis";
    }

    if (formData.duration <= 0) {
      newErrors.duration = "La durée doit être positive";
    }
    
    if (formData.startDate && formData.endDate) {
      if (formData.startDate > formData.endDate) {
        newErrors.endDate = "La date de fin doit être postérieure à la date de début";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const newTask: Task = {
        id: initialData?.id || uuidv4(),
        name: formData.name,
        duration: formData.duration,
        dependencies: formData.dependencies,
        description: formData.description,
        earliestStart: 0,
        earliestFinish: 0,
        latestStart: 0,
        latestFinish: 0,
        slack: 0,
        isCritical: false,
        priority: formData.priority,
        startDate: formData.startDate,
        endDate: formData.endDate,
        resources: formData.resources,
        notes: formData.notes
      };

      onSubmit(newTask);
      setIsFormDirty(false);
      
      // Réinitialiser le formulaire si ce n'est pas une mise à jour
      if (!initialData) {
        handleReset();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {initialData ? 'Modifier la tâche' : 'Nouvelle tâche'}
        </h3>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Réinitialiser le formulaire"
          >
            ↺ Réinitialiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nom de la tâche *
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Saisissez le nom de la tâche"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Durée ({timeUnit}) *
          </label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            min="1"
            step="1"
          />
          {errors.duration && (
            <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date de début
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">📅</span>
            </div>
            <input
              type="date"
              name="startDate"
              value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date de fin
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">📅</span>
            </div>
            <input
              type="date"
              name="endDate"
              value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          {errors.endDate && (
            <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Priorité
        </label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="low">Basse</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          rows={2}
          placeholder="Description détaillée de la tâche"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Ressources nécessaires
        </label>
        <input
          name="resources"
          value={formData.resources}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Personnel, matériel, budget, etc."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Notes supplémentaires
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          rows={2}
          placeholder="Informations complémentaires"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dépendances
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
          {existingTasks
            .filter(task => task.id !== initialData?.id)
            .map(task => (
              <div key={task.id} className="flex items-center py-1 border-b border-gray-100 last:border-b-0">
                <input
                  type="checkbox"
                  id={`dep-${task.id}`}
                  checked={formData.dependencies.includes(task.id)}
                  onChange={(e) => handleDependencyChange(task.id, e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor={`dep-${task.id}`} className="ml-2 block text-sm text-gray-900 flex-1">
                  {task.name}
                </label>
                <span className="text-xs text-gray-500 flex items-center">
                  <span className="mr-1">⏱️</span>
                  {task.duration} {timeUnit}
                </span>
              </div>
            ))}
          {existingTasks.filter(task => task.id !== initialData?.id).length === 0 && (
            <p className="text-sm text-gray-500 py-2 text-center">Aucune tâche disponible</p>
          )}
        </div>
      </div>

      <div className="pt-4 flex space-x-3">
        <button
          type="submit"
          className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={!isFormDirty}
        >
          {initialData ? 'Mettre à jour la tâche' : 'Ajouter la tâche'}
        </button>
        
        {initialData && (
          <button
            type="button"
            onClick={() => handleReset()}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Annuler
          </button>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        * Champs obligatoires
      </div>
    </form>
  );
}
