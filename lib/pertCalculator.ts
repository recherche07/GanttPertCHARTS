// lib/pertCalculator.ts

// Réutiliser l'interface Task de project.tsx
// Pour éviter la duplication, on pourrait la définir dans un fichier d'interfaces partagé,
// mais pour l'instant, nous allons la redéfinir ici pour la clarté de ce module.
// Idéalement : import { Task } from '../types'; (si vous créez un dossier types)

export interface Task {
    id: string;
    name: string;
    description?: string; // Ajout du champ description
    duration: number;
    predecessorIds: string[];
    // Propriétés calculées par PERT
    es: number | null; // Early Start
    ef: number | null; // Early Finish
    ls: number | null; // Late Start
    lf: number | null; // Late Finish
    totalSlack: number | null; // Marge Totale
    freeSlack: number | null; // Marge Libre
    isCritical: boolean;
  }
  
  export function calculatePertValues(inputTasks: Task[]): Task[] {
    if (!inputTasks || inputTasks.length === 0) {
      return [];
    }
  
    // Créer une copie profonde pour éviter de modifier l'état original directement
    let tasks: Task[] = JSON.parse(JSON.stringify(inputTasks));
  
    // Réinitialiser les valeurs calculées pour chaque tâche
    tasks.forEach(task => {
      task.es = null;
      task.ef = null;
      task.ls = null;
      task.lf = null;
      task.totalSlack = null;
      task.freeSlack = null;
      task.isCritical = false;
    });
  
    // Construire une map des tâches pour un accès facile par ID
    const taskMap = new Map<string, Task>(tasks.map(task => [task.id, task]));
  
    // --- 1. Forward Pass (Calcul ES et EF) ---
    let forwardChanged = true;
    let iterations = 0; // Pour éviter les boucles infinies en cas de dépendances circulaires non gérées
    const MAX_ITERATIONS = tasks.length * tasks.length; // Une heuristique
  
    while (forwardChanged && iterations < MAX_ITERATIONS) {
      forwardChanged = false;
      iterations++;
  
      tasks.forEach(task => {
        let currentEs = 0; // Par défaut pour les tâches sans prédécesseurs
  
        if (task.predecessorIds && task.predecessorIds.length > 0) {
          let maxPredecessorEf = 0;
          let allPredecessorsCalculated = true;
  
          for (const predId of task.predecessorIds) {
            const predecessor = taskMap.get(predId);
            if (predecessor && predecessor.ef !== null) {
              maxPredecessorEf = Math.max(maxPredecessorEf, predecessor.ef);
            } else {
              allPredecessorsCalculated = false; // Un prédécesseur n'a pas encore son EF
              break;
            }
          }
  
          if (allPredecessorsCalculated) {
            currentEs = maxPredecessorEf;
          } else {
            currentEs = -1; // Marquer comme non calculable pour cette itération
          }
        }
  
        if (currentEs !== -1) { // Si ES est calculable
          if (task.es !== currentEs) {
            task.es = currentEs;
            forwardChanged = true;
          }
          const newEf = task.es + task.duration;
          if (task.ef !== newEf) {
            task.ef = newEf;
            forwardChanged = true; // EF peut changer même si ES n'a pas changé (si la durée a changé par ex.)
                                   // mais ici on part de tâches initialisées
          }
        }
      });
    }
    
    if (iterations >= MAX_ITERATIONS && tasks.some(t => t.ef === null)) {
      console.warn("Forward pass n'a pas convergé, vérifiez les dépendances circulaires ou tâches inaccessibles.");
      // On pourrait retourner les tâches telles quelles ou lancer une erreur
      // Pour l'instant, on continue, certaines valeurs pourraient être nulles
    }
  
  
    // Déterminer la date de fin du projet
    let projectFinishTime = 0;
    tasks.forEach(task => {
      if (task.ef !== null && task.ef > projectFinishTime) {
        projectFinishTime = task.ef;
      }
    });
    // Si aucune tâche n'a de EF (par ex., une seule tâche sans durée), on ajuste
    if (tasks.length > 0 && projectFinishTime === 0 && tasks.every(t => t.ef === 0)) {
        // Cas où toutes les tâches ont une durée 0 ou une seule tâche.
        const maxDuration = Math.max(...tasks.map(t => t.duration));
        if (tasks.every(t => t.predecessorIds.length === 0)) projectFinishTime = maxDuration;
    }
  
  
    // --- 2. Backward Pass (Calcul LF et LS) ---
    // Identifier les tâches finales (celles qui ne sont prédécesseurs d'aucune autre)
    const successorMap = new Map<string, string[]>();
    tasks.forEach(task => {
      task.predecessorIds.forEach(predId => {
        if (!successorMap.has(predId)) {
          successorMap.set(predId, []);
        }
        successorMap.get(predId)!.push(task.id);
      });
    });
  
    let backwardChanged = true;
    iterations = 0; // Réinitialiser pour le backward pass
  
    while (backwardChanged && iterations < MAX_ITERATIONS) {
      backwardChanged = false;
      iterations++;
  
      tasks.slice().reverse().forEach(task => { // Itérer en sens inverse peut aider à converger plus vite
        let currentLf = projectFinishTime;
        const successors = successorMap.get(task.id) || [];
  
        if (successors.length > 0) {
          let minSuccessorLs = Infinity;
          let allSuccessorsCalculated = true;
  
          for (const succId of successors) {
            const successor = taskMap.get(succId);
            if (successor && successor.ls !== null) {
              minSuccessorLs = Math.min(minSuccessorLs, successor.ls);
            } else {
              allSuccessorsCalculated = false;
              break;
            }
          }
          if (allSuccessorsCalculated) {
            currentLf = minSuccessorLs;
          } else {
            currentLf = -1; // Marquer comme non calculable
          }
        }
  
        if (currentLf !== -1) {
          if (task.lf !== currentLf) {
            task.lf = currentLf;
            backwardChanged = true;
          }
          if (task.lf !== null) { // S'assurer que lf est calculé avant ls
              const newLs = task.lf - task.duration;
              if (task.ls !== newLs) {
                  task.ls = newLs;
                  backwardChanged = true;
              }
          }
        }
      });
    }
  
    if (iterations >= MAX_ITERATIONS && tasks.some(t => t.ls === null)) {
      console.warn("Backward pass n'a pas convergé.");
    }
  
  
    // --- 3. Calculate Slacks (Marges) et Criticité ---
    tasks.forEach(task => {
      if (task.ls !== null && task.es !== null) {
        task.totalSlack = task.ls - task.es;
        // Utiliser une petite valeur epsilon pour gérer les comparaisons de nombres décimaux
      const epsilon = 0.00001;
      task.isCritical = Math.abs(task.totalSlack) < epsilon; // Considérer comme critique si la marge est très proche de zéro
      }
  
      // Calcul de la marge libre
      let minSuccessorEs = projectFinishTime; // Par défaut, si pas de successeurs, c'est la fin du projet
      const successors = successorMap.get(task.id) || [];
  
      if (successors.length > 0) {
          minSuccessorEs = Infinity;
          let allSuccessorsEsCalculated = true;
          for (const succId of successors) {
              const successor = taskMap.get(succId);
              if (successor && successor.es !== null) {
                  minSuccessorEs = Math.min(minSuccessorEs, successor.es);
              } else {
                  allSuccessorsEsCalculated = false;
                  break;
              }
          }
          if (!allSuccessorsEsCalculated) minSuccessorEs = -1; // Non calculable
      }
  
  
      if (task.ef !== null && minSuccessorEs !== -1) {
          task.freeSlack = minSuccessorEs - task.ef;
      } else if (successors.length === 0 && task.ef !== null) { // Tâche finale
          task.freeSlack = projectFinishTime - task.ef; // Doit être égal à totalSlack
      }
  
      // Assurer que freeSlack n'est pas négatif à cause d'erreurs de calcul ou de convergence
      if (task.freeSlack !== null && task.freeSlack < 0) task.freeSlack = 0;
      // Marge totale ne doit pas être négative (indique un problème / date imposée non respectée)
      if (task.totalSlack !== null && task.totalSlack < 0) task.totalSlack = 0;
  
  
    });
  
    return tasks;
  }