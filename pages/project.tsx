// pages/project.tsx
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Task, calculatePertValues } from '../lib/pertCalculator';
import GanttChart from '../src/components/charts/GanttChart';
import PertDiagram from '../src/components/charts/PertDiagram';
import Legend from '../components/Legend';
import styles from '../styles/project.module.css';

// ... (type TimeUnit, timeUnitLabels, LOCAL_STORAGE_KEYS, etc. comme avant) ...
export type TimeUnit = 'jours' | 'semaines' | 'heures' | 'mois';
export const timeUnitLabels: Record<TimeUnit, string> = { /* ... */ jours: 'Jour(s)', semaines: 'Semaine(s)', heures: 'Heure(s)', mois: 'Mois',};
const LOCAL_STORAGE_KEY_TASKS = 'ganttPertApp.tasks';
const LOCAL_STORAGE_KEY_TIME_UNIT = 'ganttPertApp.timeUnit';

export default function ProjectPage() {
  // ... (tous les états comme avant : tasks, calculatedTasks, selectedGanttTaskId, currentTimeUnit, etc.) ...
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calculatedTasks, setCalculatedTasks] = useState<Task[]>([]);
  const [selectedGanttTaskId, setSelectedGanttTaskId] = useState<string | null>(null);
  const [currentTimeUnit, setCurrentTimeUnit] = useState<TimeUnit>('jours');
  const [taskName, setTaskName] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [taskDuration, setTaskDuration] = useState<string>('');
  const [selectedPredecessors, setSelectedPredecessors] = useState<string[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(false);


  // ... (tous les useEffects et fonctions handler comme avant) ...
   useEffect(() => { /* localStorage pour timeUnit */
    const storedTimeUnit = localStorage.getItem(LOCAL_STORAGE_KEY_TIME_UNIT) as TimeUnit | null;
    if (storedTimeUnit && timeUnitLabels[storedTimeUnit]) setCurrentTimeUnit(storedTimeUnit);
  }, []);
  useEffect(() => { /* localStorage pour tasks */
    const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
    if (storedTasks) { try { const parsedTasks: Task[] = JSON.parse(storedTasks); const initialTasks = parsedTasks.map(t => ({...t, es: t.es ?? null, ef: t.ef ?? null, ls: t.ls ?? null, lf: t.lf ?? null, totalSlack: t.totalSlack ?? null, freeSlack: t.freeSlack ?? null, isCritical: t.isCritical ?? false, })); setTasks(initialTasks); } catch (error) { console.error("Erreur parsing localStorage:", error); localStorage.removeItem(LOCAL_STORAGE_KEY_TASKS); }}
  }, []);
  useEffect(() => { /* sauvegarde et recalculs */
    localStorage.setItem(LOCAL_STORAGE_KEY_TIME_UNIT, currentTimeUnit);
    if (tasks.length > 0 || localStorage.getItem(LOCAL_STORAGE_KEY_TASKS)) { localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(tasks)); const newCalculatedTasks = calculatePertValues(tasks); setCalculatedTasks(newCalculatedTasks); } else if (tasks.length === 0 && localStorage.getItem(LOCAL_STORAGE_KEY_TASKS)) { localStorage.removeItem(LOCAL_STORAGE_KEY_TASKS); setCalculatedTasks([]); }
  }, [tasks, currentTimeUnit]);

  const generateId = (): string => `T${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`;
  const resetForm = (): void => { 
    setTaskName(''); 
    setTaskDescription('');
    setTaskDuration(''); 
    setSelectedPredecessors([]); 
    setEditingTaskId(null); 
    setSelectedGanttTaskId(null); 
  };
  const handleSubmitTask = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    
    if (!taskName.trim() || !taskDuration) {
      alert('Le nom et la durée de la tâche sont requis.');
      return;
    }
    
    const durationNum = parseFloat(taskDuration);
    if (isNaN(durationNum) || durationNum < 0) {
      alert('La durée doit être un nombre positif ou nul.');
      return;
    }
    
    if (editingTaskId && selectedPredecessors.includes(editingTaskId)) {
      alert("Une tâche ne peut pas être son propre prédécesseur.");
      return;
    }
    
    let updatedTasks;
    if (editingTaskId) {
      updatedTasks = tasks.map((task) => 
        task.id === editingTaskId ? { 
          ...task, 
          name: taskName.trim(),
          description: taskDescription.trim() || undefined,
          duration: durationNum, 
          predecessorIds: selectedPredecessors 
        } : task
      );
    } else {
      const newTask: Task = {
        id: generateId(),
        name: taskName.trim(),
        description: taskDescription.trim() || undefined,
        duration: durationNum,
        predecessorIds: selectedPredecessors,
        es: null,
        ef: null,
        ls: null,
        lf: null,
        totalSlack: null,
        freeSlack: null,
        isCritical: false,
      };
      updatedTasks = [...tasks, newTask];
    }
    
    setTasks(updatedTasks);
    resetForm();
  };
  const handleEditTaskFromTable = (taskToEditId: string): void => {
    const taskToEdit = calculatedTasks.find(t => t.id === taskToEditId);
    if (!taskToEdit) return;
    
    setEditingTaskId(taskToEdit.id);
    setTaskName(taskToEdit.name);
    setTaskDescription(taskToEdit.description || '');
    setTaskDuration(taskToEdit.duration.toString());
    setSelectedPredecessors(taskToEdit.predecessorIds || []);
    setSelectedGanttTaskId(taskToEdit.id);
  };
  const handleDeleteTask = (taskIdToDelete: string): void => { /* ... */ if (window.confirm(`Êtes-vous sûr de vouloir supprimer la tâche ${taskIdToDelete} ?`)) { const filteredTasks = tasks.filter((task) => task.id !== taskIdToDelete); const finalTasks = filteredTasks.map(task => ({ ...task, predecessorIds: task.predecessorIds.filter(id => id !== taskIdToDelete) })); setTasks(finalTasks); if (editingTaskId === taskIdToDelete) { resetForm(); } if (selectedGanttTaskId === taskIdToDelete) setSelectedGanttTaskId(null); } };
  
  // Interaction pour le diagramme PERT (similaire au Gantt)
  const handlePertNodeClick = (taskId: string | null) => {
    setSelectedGanttTaskId(taskId); // Utiliser le même état de sélection pour l'instant
    if (taskId) {
      const taskToEdit = calculatedTasks.find(t => t.id === taskId);
      if (taskToEdit) {
        setEditingTaskId(taskToEdit.id);
        setTaskName(taskToEdit.name);
        setTaskDuration(taskToEdit.duration.toString());
        setSelectedPredecessors(taskToEdit.predecessorIds || []);
      }
    } else {
      setEditingTaskId(null);
    }
  };
  
  const availablePredecessors: Task[] = tasks.filter(task => task.id !== editingTaskId);


  return (
    <div className={styles.container}>
      {/* Titre et sélecteur d'unité */}
      <div className={styles.header}>
        <h1 className={styles.title}>Gestion de Projet</h1>
        <div className={styles.headerControls}>
          <div className={styles.timeUnitSelector}>
            <label htmlFor="timeUnitSelector">Unité de temps :</label>
            <select 
              id="timeUnitSelector" 
              value={currentTimeUnit} 
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setCurrentTimeUnit(e.target.value as TimeUnit)}
            >
              {(Object.keys(timeUnitLabels) as TimeUnit[]).map(unit => (
                <option key={unit} value={unit}>{timeUnitLabels[unit]}</option>
              ))}
            </select>
          </div>
          <button 
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={() => setShowLegend(!showLegend)}
          >
            {showLegend ? 'Masquer la légende' : 'Afficher la légende'}
          </button>
        </div>
      </div>
      
      {showLegend && (
        <Legend timeUnit={timeUnitLabels[currentTimeUnit].toLowerCase()} />
      )}

      {/* Formulaire */}
      <div className={`${styles.formCard} ${editingTaskId ? styles.editing : ''}`}>
        <h2 className={styles.formTitle}>
          {editingTaskId ? `Modifier Tâche: ${editingTaskId}` : 'Ajouter une Tâche'}
        </h2>
        
        <form onSubmit={handleSubmitTask}>
          <div className={styles.formGroup}>
            <label htmlFor="taskName">Nom de la tâche:</label>
            <input 
              type="text" 
              id="taskName" 
              value={taskName} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTaskName(e.target.value)} 
              required 
              placeholder="Entrez un nom court et descriptif"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="taskDescription">Description (optionnelle):</label>
            <textarea 
              id="taskDescription" 
              value={taskDescription} 
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTaskDescription(e.target.value)} 
              placeholder="Décrivez cette tâche plus en détail"
              className={styles.textarea}
              rows={3}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="taskDuration">Durée (en {timeUnitLabels[currentTimeUnit].toLowerCase()}, 0 pour un jalon):</label>
            <input
              type="number"
              id="taskDuration"
              name="taskDuration"
              value={taskDuration}
              onChange={(e) => setTaskDuration(e.target.value)}
              min="0"
              step="0.01"
              required
              className={styles.formInput}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="taskPredecessors">Prédécesseurs (Ctrl/Cmd pour sélection multiple):</label>
            <select 
              multiple 
              id="taskPredecessors" 
              value={selectedPredecessors} 
              onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                setSelectedPredecessors(Array.from(e.target.selectedOptions, (option) => option.value))
              } 
              style={{ minHeight: '120px' }}
              disabled={availablePredecessors.length === 0}
            >
              {availablePredecessors.length === 0 && 
                <option disabled>Aucune tâche disponible</option>
              }
              {availablePredecessors.map((task) => (
                <option key={task.id} value={task.id}>{task.id} - {task.name}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.formActions}>
            <button type="submit" className={`${styles.button} ${styles.primaryButton}`}>
              {editingTaskId ? 'Mettre à jour Tâche' : 'Ajouter Tâche'}
            </button>
            
            {editingTaskId && (
              <button 
                type="button" 
                onClick={resetForm} 
                className={`${styles.button} ${styles.secondaryButton}`}
              >
                Annuler / Nouveau
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Diagrammes */}
      {calculatedTasks.length > 0 && (
        <div>
          <div className={styles.chartContainer}>
            <h2 className={styles.chartTitle}>Diagramme de Gantt</h2>
            <GanttChart
              tasks={calculatedTasks}
              onTaskSelect={handlePertNodeClick}
              selectedTaskId={selectedGanttTaskId}
              timeUnit={currentTimeUnit}
            />
          </div>
          
          <div className={styles.chartContainer}>
            <h2 className={styles.chartTitle}>Diagramme de PERT (Réseau)</h2>
            <PertDiagram 
              tasks={calculatedTasks} 
              timeUnit={currentTimeUnit}
              onNodeClick={handlePertNodeClick}
            />
          </div>
        </div>
      )}

      {/* Tableau des tâches */}
      <div className={styles.tableContainer}>
        <h2 className={styles.chartTitle}>Liste des Tâches (Durées en {timeUnitLabels[currentTimeUnit].toLowerCase()})</h2>
        
        {calculatedTasks.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Durée ({timeUnitLabels[currentTimeUnit]})</th>
                <th>Prédécesseurs</th>
                <th>ES</th>
                <th>EF</th>
                <th>LS</th>
                <th>LF</th>
                <th>Marge Tot.</th>
                <th>Marge Lib.</th>
                <th>Critique</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {calculatedTasks.map((task) => (
                <tr 
                  key={task.id} 
                  className={`
                    ${task.isCritical ? styles.criticalRow : ''} 
                    ${selectedGanttTaskId === task.id ? (task.isCritical ? styles.criticalSelectedRow : styles.selectedRow) : ''}
                  `}
                  onClick={() => handlePertNodeClick(task.id)}
                >
                  <td>{task.name}</td>
                  <td className={styles.descriptionCell}>
                    {task.description ? (
                      <div className={styles.descriptionContent}>
                        {task.description}
                      </div>
                    ) : (
                      <span className={styles.noDescription}>-</span>
                    )}
                  </td>
                  <td>{task.duration.toString()}</td>
                  <td>
                    {task.predecessorIds.length > 0 ? (
                      task.predecessorIds.map(predId => {
                        const predTask = calculatedTasks.find(t => t.id === predId);
                        return predTask ? predTask.name : predId;
                      }).join(', ')
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{task.es !== null ? task.es.toString() : '-'}</td>
                  <td>{task.ef !== null ? task.ef.toString() : '-'}</td>
                  <td>{task.ls !== null ? task.ls.toString() : '-'}</td>
                  <td>{task.lf !== null ? task.lf.toString() : '-'}</td>
                  <td>{task.totalSlack !== null ? task.totalSlack.toString() : '-'}</td>
                  <td>{task.freeSlack !== null ? task.freeSlack.toString() : '-'}</td>
                  <td>{task.isCritical ? 'Oui' : 'Non'}</td>
                  <td className={styles.tableActions}>
                    <button 
                      onClick={(e) => {e.stopPropagation(); handleEditTaskFromTable(task.id);}} 
                      className={`${styles.tableButton} ${styles.editButton}`}
                    >
                      Modif.
                    </button>
                    <button 
                      onClick={(e) => {e.stopPropagation(); handleDeleteTask(task.id);}} 
                      className={`${styles.tableButton} ${styles.deleteButton}`}
                    >
                      Suppr.
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.emptyState}>Aucune tâche pour le moment.</p>
        )}
      </div>
      {calculatedTasks.length > 0 && (
        <div className={styles.criticalPaths}>
          <h4 className={styles.criticalPathsTitle}>Chemin(s) Critique(s):</h4>
          <ul className={styles.criticalPathsList}>
            {calculateCriticalPaths(calculatedTasks).map((path, index) => (
              <li key={index}>{path.join(' → ')}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Fonction pour calculer les chemins critiques
function calculateCriticalPaths(tasks: Task[]): string[][] {
  // Filtrer les tâches critiques
  const criticalTasks = tasks.filter(task => task.isCritical);
  
  if (criticalTasks.length === 0) return [];
  
  // Créer une map pour un accès facile
  const taskMap = new Map<string, Task>(tasks.map(task => [task.id, task]));
  
  // Trouver les tâches de départ (sans prédécesseurs ou avec des prédécesseurs non-critiques)
  const startTasks = criticalTasks.filter(task => 
    task.predecessorIds.length === 0 || 
    !task.predecessorIds.some(predId => taskMap.get(predId)?.isCritical)
  );
  
  if (startTasks.length === 0 && criticalTasks.length > 0) {
    // Si pas de tâche de départ mais des tâches critiques, prendre la première
    startTasks.push(criticalTasks[0]);
  }
  
  // Fonction récursive pour construire les chemins
  function buildPath(currentTask: Task, currentPath: string[] = []): string[][] {
    const paths: string[][] = [];
    // Utiliser le nom de la tâche au lieu de l'ID
    const updatedPath = [...currentPath, currentTask.name];
    
    // Trouver les successeurs critiques
    const criticalSuccessors = criticalTasks.filter(task => 
      task.predecessorIds.includes(currentTask.id)
    );
    
    if (criticalSuccessors.length === 0) {
      // C'est une tâche finale, retourner le chemin
      return [updatedPath];
    }
    
    // Construire les chemins pour chaque successeur
    for (const successor of criticalSuccessors) {
      const subPaths = buildPath(successor, updatedPath);
      paths.push(...subPaths);
    }
    
    return paths;
  }
  
  // Construire tous les chemins à partir des tâches de départ
  let allPaths: string[][] = [];
  for (const startTask of startTasks) {
    const paths = buildPath(startTask);
    allPaths = [...allPaths, ...paths];
  }
  
  return allPaths;
}