// components/PertDiagram.tsx
import React, { useMemo, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  Position, // Pour spécifier les points de connexion
  MarkerType, // Pour les têtes de flèches
} from 'reactflow';
import 'reactflow/dist/style.css'; // Styles de base de React Flow

import { Task } from '../../../lib/pertCalculator';
// Définir timeUnitLabels localement pour éviter la dépendance circulaire

// Définir TimeUnit localement pour éviter la dépendance circulaire
type TimeUnit = 'jours' | 'semaines' | 'heures' | 'mois';
const timeUnitLabels: Record<TimeUnit, string> = { jours: 'Jour(s)', semaines: 'Semaine(s)', heures: 'Heure(s)', mois: 'Mois' };

// Style personnalisé pour les nœuds
const nodeStyles: React.CSSProperties = {
  border: '1px solid #777',
  padding: '10px 15px',
  borderRadius: '5px',
  background: '#fff',
  fontSize: '10px', // Réduire la taille de la police pour que plus de texte rentre
  width: 180, // Largeur fixe pour les nœuds
};

const criticalNodeStyles: React.CSSProperties = {
  ...nodeStyles,
  borderColor: '#c0392b', // Rouge pour critique
  background: '#ffdddd',
};

interface PertDiagramProps {
  tasks: Task[];
  timeUnit: TimeUnit;
  onNodeClick?: (taskId: string | null) => void;
}

// Fonction pour générer la mise en page avec Dagre (algorithme de graphe orienté)
// React Flow ne vient pas avec Dagre par défaut, il faut l'ajouter ou utiliser une lib qui l'intègre
// Pour cette version, nous allons faire une mise en page "en couches" simplifiée manuellement.
// Pour une mise en page automatique plus robuste, il faudrait intégrer un algo comme Dagre.

const getLayoutedElements = (tasks: Task[], timeUnit: TimeUnit, nodeWidth = 180, nodeHeight = 100, horizontalSpacing = 80, verticalSpacing = 50) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!tasks || tasks.length === 0) return { nodes, edges };

    const taskMap = new Map<string, Task>(tasks.map(t => [t.id, t]));
    const levels = new Map<string, number>(); // Stocker le niveau de chaque tâche
    const processed = new Set<string>();

    // Fonction pour calculer le niveau (distance la plus longue depuis une tâche source)
    function calculateLevel(taskId: string): number {
        if (levels.has(taskId)) return levels.get(taskId)!;
        if (processed.has(taskId)) return Infinity; // Détection de cycle simple

        processed.add(taskId);
        const task = taskMap.get(taskId);
        if (!task) return 0;

        let maxPredLevel = 0;
        if (task.predecessorIds && task.predecessorIds.length > 0) {
            for (const predId of task.predecessorIds) {
                if (taskMap.has(predId)) {
                     maxPredLevel = Math.max(maxPredLevel, calculateLevel(predId));
                }
            }
            // Si tous les prédécesseurs mènent à un cycle (Infinity), cette tâche est aussi dans un cycle
            if (maxPredLevel === Infinity) {
                levels.set(taskId, Infinity);
                return Infinity;
            }
            const level = maxPredLevel + 1;
            levels.set(taskId, level);
            return level;

        } else {
            levels.set(taskId, 0); // Tâches sans prédécesseurs sont au niveau 0
            return 0;
        }
    }

    tasks.forEach(task => calculateLevel(task.id));
    
    // Supprimer les tâches dans des cycles (niveau Infinity) pour la mise en page
    const tasksForLayout = tasks.filter(task => levels.get(task.id) !== Infinity);


    // Regrouper les tâches par niveau
    const tasksByLevel: Task[][] = [];
    tasksForLayout.forEach(task => {
        const level = levels.get(task.id)!;
        if (!tasksByLevel[level]) {
            tasksByLevel[level] = [];
        }
        tasksByLevel[level].push(task);
    });

    // Positionner les nœuds
    tasksByLevel.forEach((levelTasks, levelIndex) => {
        const numTasksInLevel = levelTasks.length;
        levelTasks.forEach((task, taskIndexInLevel) => {
            nodes.push({
                id: task.id,
                type: 'default', // On pourrait créer des types de nœuds personnalisés
                data: { label: PertNodeContent(task, timeUnitLabels[timeUnit]) },
                position: {
                    x: levelIndex * (nodeWidth + horizontalSpacing),
                    // Centrer verticalement les tâches d'un même niveau
                    y: taskIndexInLevel * (nodeHeight + verticalSpacing) - ((numTasksInLevel -1) * (nodeHeight + verticalSpacing)) / 2,
                },
                style: task.isCritical ? criticalNodeStyles : nodeStyles,
                sourcePosition: Position.Right, // Les flèches partent de la droite
                targetPosition: Position.Left,  // Les flèches arrivent à gauche
            });

            // Créer les arêtes (dépendances)
            task.predecessorIds.forEach(predId => {
                if (taskMap.has(predId) && levels.get(predId) !== Infinity) { // S'assurer que le prédécesseur existe et n'est pas dans un cycle
                    edges.push({
                        id: `e-${predId}-${task.id}`,
                        source: predId,
                        target: task.id,
                        type: 'smoothstep', // Type de ligne (smoothstep, step, straight)
                        animated: task.isCritical && taskMap.get(predId)?.isCritical, // Animer si le lien est critique
                        markerEnd: { type: MarkerType.ArrowClosed },
                        style: { strokeWidth: (task.isCritical && taskMap.get(predId)?.isCritical) ? 2.5 : 1.5, stroke: (task.isCritical && taskMap.get(predId)?.isCritical) ? '#c0392b' : '#aaa' }
                    });
                }
            });
        });
    });
    
    // Recentrer le graphe
    if (nodes.length > 0) {
        const minX = Math.min(...nodes.map(n => n.position.x));
        const minY = Math.min(...nodes.map(n => n.position.y));
        const maxX = Math.max(...nodes.map(n => n.position.x + (n.style?.width as number || nodeWidth)));
        const maxY = Math.max(...nodes.map(n => n.position.y + (n.style?.height as number || nodeHeight)));

        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;

        // Centre initial du graphe (arbitraire, React Flow le gère bien ensuite avec fitView)
        // On peut juste s'assurer que les coordonnées ne sont pas trop négatives.
        // Les positions sont relatives, React Flow va les centrer avec fitView.
    }


    return { nodes, edges };
};

// Contenu personnalisé pour un nœud PERT
const PertNodeContent = (task: Task, unitLabel: string) => (
  <div style={{ textAlign: 'center' }}>
    <strong style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>{task.id}: {task.name}</strong>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', marginBottom: '5px' }}>
      <span>ES: {task.es}</span>
      <span>EF: {task.ef}</span>
      <span>LS: {task.ls}</span>
      <span>LF: {task.lf}</span>
    </div>
    <div>Durée: {task.duration} {unitLabel.toLowerCase()}</div>
    <div>M.Tot: {task.totalSlack} | M.Lib: {task.freeSlack}</div>
    {task.isCritical && <div style={{color: '#c0392b', fontWeight: 'bold', marginTop: '3px'}}>CRITIQUE</div>}
  </div>
);


const PertDiagram: React.FC<PertDiagramProps> = ({ tasks, timeUnit, onNodeClick }) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => getLayoutedElements(tasks, timeUnit, 180, 120, 100, 60), // Ajuster espacements
    [tasks, timeUnit]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Mettre à jour les nœuds et arêtes si les tâches initiales changent
  // React Flow gère cela via le useMemo et les dépendances [tasks, timeUnit]
  // qui recréent initialNodes/initialEdges, puis les useNodesState/useEdgesState
  // devraient se mettre à jour. Pour forcer :
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = getLayoutedElements(tasks, timeUnit, 180, 120, 100, 60);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [tasks, timeUnit, setNodes, setEdges]);


  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  
  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
        onNodeClick(node.id);
    }
  };

  if (!tasks || tasks.length === 0) {
    return <p>Aucune tâche à afficher dans le diagramme PERT.</p>;
  }

  return (
    <div style={{ height: '600px', border: '1px solid #eee', marginTop: '20px', backgroundColor: '#f9f9f9' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect} // Permettrait la connexion manuelle, mais pas nécessaire ici
        onNodeClick={handleNodeClick}
        fitView // Ajuste automatiquement la vue pour afficher tous les nœuds
        attributionPosition="bottom-left" // Position du logo React Flow
      >
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default PertDiagram;