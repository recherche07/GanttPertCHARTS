import { z } from 'zod';

/**
 * Schéma de validation pour les tâches du projet
 * Utilise Zod pour la validation des données et l'inférence de types
 */
export const TaskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: "Le nom de la tâche est requis" }),
  duration: z.number().positive({ message: "La durée doit être positive" }),
  dependencies: z.array(z.string()).default([]),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  earliestStart: z.number().default(0),
  earliestFinish: z.number().default(0),
  latestStart: z.number().default(0),
  latestFinish: z.number().default(0),
  slack: z.number().default(0),
  isCritical: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  resources: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Type Task inféré à partir du schéma Zod
 */
export type Task = z.infer<typeof TaskSchema>;

/**
 * Interface représentant l'analyse du chemin critique
 */
export interface CriticalPathAnalysis {
  criticalPath: string[];
  criticalTasks: Task[];
  projectDuration: number;
}

/**
 * Interface représentant le résultat de l'analyse PERT
 */
export interface PERTResult {
  tasks: Task[];
  criticalPathAnalysis: CriticalPathAnalysis;
}

/**
 * Interface représentant les données pour le diagramme de Gantt
 */
export interface GanttChartData {
  tasks: Task[];
  dependencies: Array<{ from: string; to: string }>;
}
