import { Task, CriticalPathAnalysis, PERTResult } from '../types/task';

/**
 * Calcule le forward pass pour déterminer les dates de début et fin au plus tôt
 */
export function calculateForwardPass(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>();
  
  // Créer une copie des tâches pour la manipulation
  const updatedTasks = tasks.map(task => ({ ...task }));
  
  // Initialiser le map pour un accès facile
  updatedTasks.forEach(task => {
    taskMap.set(task.id, task);
  });
  
  // Trier topologiquement les tâches
  const sorted = topologicalSort(updatedTasks);
  
  // Calculer les dates de début et de fin au plus tôt
  sorted.forEach(task => {
    // Si pas de dépendances, la tâche peut commencer à 0
    if (task.dependencies.length === 0) {
      task.earliestStart = 0;
    } else {
      // Sinon, on prend la date de fin au plus tôt maximale parmi les prédécesseurs
      task.earliestStart = Math.max(
        ...task.dependencies.map(depId => {
          const depTask = taskMap.get(depId);
          return depTask ? depTask.earliestFinish : 0;
        })
      );
    }
    
    // Date de fin au plus tôt = date de début au plus tôt + durée
    task.earliestFinish = task.earliestStart + task.duration;
  });
  
  return updatedTasks;
}

/**
 * Calcule le backward pass pour déterminer les dates de début et fin au plus tard
 */
export function calculateBackwardPass(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>();
  
  // Créer une copie des tâches pour la manipulation
  const updatedTasks = tasks.map(task => ({ ...task }));
  
  // Initialiser le map pour un accès facile
  updatedTasks.forEach(task => {
    taskMap.set(task.id, task);
  });
  
  // Trier topologiquement les tâches (inverse)
  const sorted = topologicalSort(updatedTasks).reverse();
  
  // Trouver la date de fin du projet (max des dates de fin au plus tôt)
  const projectEndTime = Math.max(...updatedTasks.map(t => t.earliestFinish));
  
  // Initialiser les dates de fin au plus tard pour toutes les tâches au temps de fin du projet
  updatedTasks.forEach(task => {
    task.latestFinish = projectEndTime;
  });
  
  // Identifier les tâches qui n'ont pas de successeurs
  const hasSuccessor = new Set<string>();
  updatedTasks.forEach(task => {
    task.dependencies.forEach(depId => {
      hasSuccessor.add(depId);
    });
  });
  
  // Pour les tâches finales (sans successeurs), la date de fin au plus tard = date de fin au plus tôt
  updatedTasks.forEach(task => {
    if (!hasSuccessor.has(task.id)) {
      task.latestFinish = task.earliestFinish;
    }
  });
  
  // Calculer les dates de fin et début au plus tard
  sorted.forEach(task => {
    // Date de début au plus tard = date de fin au plus tard - durée
    task.latestStart = task.latestFinish - task.duration;
    
    // Mettre à jour les dates de fin au plus tard des prédécesseurs
    task.dependencies.forEach(depId => {
      const depTask = taskMap.get(depId);
      if (depTask) {
        depTask.latestFinish = Math.min(depTask.latestFinish, task.latestStart);
      }
    });
  });
  
  // Calculer la marge de chaque tâche
  updatedTasks.forEach(task => {
    task.slack = task.latestStart - task.earliestStart;
    // Une tâche est critique si sa marge est nulle
    task.isCritical = task.slack === 0;
  });
  
  return updatedTasks;
}

/**
 * Analyse du chemin critique
 */
export function analyzeCriticalPath(tasks: Task[]): CriticalPathAnalysis {
  // Calculer les dates de début et fin au plus tôt
  const forwardTasks = calculateForwardPass(tasks);
  
  // Calculer les dates de début et fin au plus tard et les marges
  const analyzedTasks = calculateBackwardPass(forwardTasks);
  
  // Identifier les tâches critiques
  const criticalTasks = analyzedTasks.filter(task => task.isCritical);
  
  // Construire le chemin critique
  const criticalPath = criticalTasks.map(task => task.id);
  
  // Durée totale du projet
  const projectDuration = Math.max(...analyzedTasks.map(t => t.earliestFinish));
  
  return {
    criticalPath,
    criticalTasks,
    projectDuration
  };
}

/**
 * Analyse PERT complète
 */
export function performPERTAnalysis(tasks: Task[]): PERTResult {
  const forwardTasks = calculateForwardPass(tasks);
  const analyzedTasks = calculateBackwardPass(forwardTasks);
  const criticalPathAnalysis = analyzeCriticalPath(analyzedTasks);
  
  return {
    tasks: analyzedTasks,
    criticalPathAnalysis
  };
}

/**
 * Tri topologique des tâches pour respecter les dépendances
 */
function topologicalSort(tasks: Task[]): Task[] {
  const visited = new Set<string>();
  const tempMark = new Set<string>();
  const result: Task[] = [];
  const taskMap = new Map<string, Task>();
  
  // Préparer le map des tâches
  tasks.forEach(task => {
    taskMap.set(task.id, task);
  });
  
  // Fonction récursive pour visiter les nœuds
  function visit(task: Task) {
    if (tempMark.has(task.id)) {
      throw new Error(`Cycle détecté dans les dépendances : ${task.id}`);
    }
    
    if (!visited.has(task.id)) {
      tempMark.add(task.id);
      
      // Visiter d'abord toutes les dépendances
      task.dependencies.forEach(depId => {
        const depTask = taskMap.get(depId);
        if (depTask) {
          visit(depTask);
        }
      });
      
      tempMark.delete(task.id);
      visited.add(task.id);
      result.push(task);
    }
  }
  
  // Visiter chaque tâche
  tasks.forEach(task => {
    if (!visited.has(task.id)) {
      visit(task);
    }
  });
  
  return result;
}

/**
 * Crée les données pour le diagramme de Gantt
 */
export function createGanttData(tasks: Task[]) {
  // Vérifier si l'analyse du chemin critique a déjà été effectuée
  const needsAnalysis = tasks.some(task => 
    task.earliestStart === 0 && task.earliestFinish === 0 && task.dependencies.length > 0
  );
  
  // Si nécessaire, effectuer l'analyse
  const analyzedTasks = needsAnalysis ? calculateBackwardPass(calculateForwardPass(tasks)) : tasks;
  
  // Transformer les tâches en format Gantt
  return analyzedTasks.map(task => ({
    id: task.id,
    name: task.name,
    start: task.earliestStart,
    end: task.earliestFinish,
    dependencies: task.dependencies,
    isCritical: task.isCritical,
    slack: task.slack
  }));
}

/**
 * Prépare les données pour le diagramme PERT
 */
export function createPERTData(tasks: Task[]) {
  // Assurer que l'analyse est effectuée
  const analyzedTasks = calculateBackwardPass(calculateForwardPass(tasks));
  
  // Créer les nœuds et liens
  const nodes = analyzedTasks.map(task => ({
    key: task.id,
    text: task.name,
    duration: task.duration,
    earliestStart: task.earliestStart,
    earliestFinish: task.earliestFinish,
    latestStart: task.latestStart,
    latestFinish: task.latestFinish,
    slack: task.slack,
    isCritical: task.isCritical
  }));
  
  const links = analyzedTasks.flatMap(task => 
    task.dependencies.map(depId => ({
      from: depId,
      to: task.id
    }))
  );
  
  return { nodes, links };
}
