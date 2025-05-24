import { z } from 'zod';

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

export type Task = z.infer<typeof TaskSchema>;

export interface CriticalPathAnalysis {
  criticalPath: string[];
  criticalTasks: Task[];
  projectDuration: number;
}

export interface PERTResult {
  tasks: Task[];
  criticalPathAnalysis: CriticalPathAnalysis;
}

export interface GanttChartData {
  tasks: Task[];
  dependencies: Array<{ from: string; to: string }>;
}
