// components/GanttChart.tsx
//made by arthur
import React, { useState } from 'react';
import { Task } from '../../../lib/pertCalculator';
// Définir TimeUnit localement pour éviter la dépendance circulaire
type TimeUnit = 'jours' | 'semaines' | 'heures' | 'mois';
const timeUnitLabels: Record<TimeUnit, string> = { jours: 'Jour(s)', semaines: 'Semaine(s)', heures: 'Heure(s)', mois: 'Mois' };

interface GanttChartProps {
  tasks: Task[];
  timeUnit: TimeUnit; // Nouvelle prop pour l'unité de temps
  pixelsPerUnitTime?: number;
  barHeight?: number;
  padding?: number;
  showTaskIdsAsLabels?: boolean;
  onTaskSelect?: (taskId: string | null) => void;
  selectedTaskId?: string | null;
}//Comit

const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  timeUnit, // Utiliser la prop
  pixelsPerUnitTime = 20, // Cette valeur pourrait devenir dynamique ou plus petite pour "mois"
  barHeight = 20,
  padding = 20,
  showTaskIdsAsLabels = true,
  onTaskSelect,
  selectedTaskId,
}) => {
  const [showDependencies, setShowDependencies] = useState(true);

  // ... (filtrage des tâches, taskMap, etc. comme avant) ...
  if (!tasks || tasks.length === 0) return <p>Aucune tâche à afficher.</p>;
  const drawableTasks = tasks.filter(task => task.es !== null && task.ef !== null);
  if (drawableTasks.length === 0) return <p>Calculs PERT incomplets.</p>;

  const taskMap = new Map<string, { task: Task; index: number }>();
  drawableTasks.forEach((task, index) => { taskMap.set(task.id, { task, index }); });

  const taskLabelWidth = 120;
  const topPadding = 60;
  const arrowMarkerId = "arrowhead";

  let maxTime = 0;
  drawableTasks.forEach(task => { if (task.ef !== null && task.ef > maxTime) maxTime = task.ef; });
  if (maxTime === 0 && drawableTasks.length > 0) maxTime = Math.max(...drawableTasks.map(t => t.duration > 0 ? t.duration : 1), 1);

  // Ajuster pixelsPerUnitTime pour les unités plus longues pour ne pas avoir un graphique trop large
  let currentPixelsPerUnit = pixelsPerUnitTime;
  if (timeUnit === 'mois') {
    currentPixelsPerUnit = Math.max(10, pixelsPerUnitTime / 2); // Ex: mois moins larges
  } else if (timeUnit === 'semaines') {
    currentPixelsPerUnit = Math.max(15, pixelsPerUnitTime * 0.8); // Ex: semaines un peu moins larges
  }


  const chartWidth = taskLabelWidth + (maxTime * currentPixelsPerUnit) + padding * 2;
  const chartHeight = topPadding + (drawableTasks.length * (barHeight + 5)) + padding;

  const timeScaleMarkers = [];
  // Adapter la fréquence des marqueurs pour les unités longues
  let timeMarkerStep = 1;
  if (timeUnit === 'mois' && maxTime > 12) timeMarkerStep = Math.ceil(maxTime / 12);
  else if (timeUnit === 'semaines' && maxTime > 20) timeMarkerStep = Math.ceil(maxTime / 10);
  else if (timeUnit === 'jours' && maxTime > 30) timeMarkerStep = Math.ceil(maxTime / 15);


  for (let i = 0; i <= maxTime; i += timeMarkerStep) {
    // S'assurer que le dernier marqueur (ou proche) est toujours affiché
    if (i > maxTime && maxTime > 0 && (i - timeMarkerStep < maxTime) ) i = maxTime;
    
    timeScaleMarkers.push(
      <g key={`time-${i}`}>
        <line x1={taskLabelWidth + i * currentPixelsPerUnit} y1={topPadding - 10} x2={taskLabelWidth + i * currentPixelsPerUnit} y2={topPadding + (drawableTasks.length * (barHeight + 5))} stroke="#eee" />
        <line x1={taskLabelWidth + i * currentPixelsPerUnit} y1={topPadding - 10} x2={taskLabelWidth + i * currentPixelsPerUnit} y2={topPadding - 5} stroke="#ccc"/>
        <text x={taskLabelWidth + i * currentPixelsPerUnit} y={topPadding - 20} textAnchor="middle" fontSize="10" fill="#555">{i}</text>
      </g>
    );
    if (i === maxTime && maxTime % timeMarkerStep !== 0 && maxTime > 0) break; // Eviter de dépasser après avoir forcé le dernier marqueur
  }
  // Assurer que le marqueur 0 est toujours là si step > 1 et maxTime est petit
  if (timeMarkerStep > 1 && !timeScaleMarkers.find(m => m.key === 'time-0')) {
      timeScaleMarkers.unshift(
           <g key={`time-0`}>
            <line x1={taskLabelWidth} y1={topPadding - 10} x2={taskLabelWidth} y2={topPadding + (drawableTasks.length * (barHeight + 5))} stroke="#eee" />
            <line x1={taskLabelWidth} y1={topPadding - 10} x2={taskLabelWidth} y2={topPadding - 5} stroke="#ccc"/>
            <text x={taskLabelWidth} y={topPadding - 20} textAnchor="middle" fontSize="10" fill="#555">0</text>
           </g>
      );
  }


  timeScaleMarkers.push(
    <line key="time-axis-line" x1={taskLabelWidth} y1={topPadding - 5} x2={taskLabelWidth + maxTime * currentPixelsPerUnit} y2={topPadding - 5} stroke="#ccc"/>
  );
  // Afficher l'unité de temps sur l'axe
  timeScaleMarkers.push(
    <text key="time-unit-label" x={taskLabelWidth + (maxTime * currentPixelsPerUnit) + 10} y={topPadding - 15} fontSize="10" fill="#555">
        ({timeUnitLabels[timeUnit]})
    </text>
  );

  // ... (reste du composant : handleBarClick, rendu SVG, flèches, barres comme avant,
  // mais en utilisant currentPixelsPerUnit au lieu de pixelsPerUnitTime pour les calculs de x et width)
  
  // Remplacer partout `pixelsPerUnitTime` par `currentPixelsPerUnit` dans les calculs de coordonnées X et de largeur des barres/flèches
  // Exemple pour les flèches:
  // const startX = taskLabelWidth + (predTask.ef! * currentPixelsPerUnit) ...
  // const endX = taskLabelWidth + (task.es! * currentPixelsPerUnit) ...
  // Exemple pour les barres:
  // const x = taskLabelWidth + (task.es! * currentPixelsPerUnit);
  // const width = task.duration * currentPixelsPerUnit;

  // (Le code complet du return SVG est long, donc je ne le répète pas entièrement,
  // assurez-vous de faire le remplacement de pixelsPerUnitTime par currentPixelsPerUnit
  // dans toutes les parties pertinentes du dessin.)

  // Voici la section de rendu avec les ajustements pour currentPixelsPerUnit:
  return (
    <div style={{ marginTop: '20px', border: '1px solid #e0e0e0', padding: '10px', backgroundColor: '#f9f9f9' }}>
      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>Diagramme de Gantt</h4>
        <button onClick={() => setShowDependencies(!showDependencies)} style={{padding: '5px 10px', fontSize: '0.9em'}}>
            {showDependencies ? 'Cacher' : 'Afficher'} les dépendances
        </button>
      </div>
      <div style={{ overflowX: 'auto'}}>
        <svg width={chartWidth} height={chartHeight} onClick={() => onTaskSelect && onTaskSelect(null)} >
          <defs>
            <marker id={arrowMarkerId} markerWidth="10" markerHeight="7" refX="7" refY="3.5" orient="auto" markerUnits="strokeWidth">
              <polygon points="0 0, 10 3.5, 0 7" fill="#555" />
            </marker>
          </defs>

          <g className="time-axis">{timeScaleMarkers}</g>

          {showDependencies && (
            <g className="dependency-arrows">
              {drawableTasks.map((task, taskIndex) => {
                return task.predecessorIds.map(predId => {
                  const predecessorData = taskMap.get(predId);
                  if (!predecessorData) return null;
                  const predTask = predecessorData.task; const predIndex = predecessorData.index;
                  const startX = taskLabelWidth + (predTask.ef! * currentPixelsPerUnit) + (predTask.duration === 0 ? barHeight / 4 : 0);
                  const startY = topPadding + predIndex * (barHeight + 5) + barHeight / 2;
                  const endX = taskLabelWidth + (task.es! * currentPixelsPerUnit) - (task.duration === 0 ? barHeight / 4 : 0);
                  const endY = topPadding + taskIndex * (barHeight + 5) + barHeight / 2;
                  if (endX <= startX && startY === endY) return null;
                  if (startY === endY) return <line key={`${predId}-${task.id}`} x1={startX} y1={startY} x2={endX} y2={endY} stroke="#555" strokeWidth="1.5" markerEnd={`url(#${arrowMarkerId})`}/>;
                  else { const turnPointX = endX - currentPixelsPerUnit / 2 > startX ? endX - currentPixelsPerUnit / 2 : startX + currentPixelsPerUnit / 2; return <polyline key={`${predId}-${task.id}`} points={`${startX},${startY} ${turnPointX},${startY} ${turnPointX},${endY} ${endX},${endY}`} stroke="#555" strokeWidth="1" fill="none" markerEnd={`url(#${arrowMarkerId})`}/>; }
                }).filter(Boolean);
              })}
            </g>
          )}

          {drawableTasks.map((task, index) => {
            const x = taskLabelWidth + (task.es! * currentPixelsPerUnit);
            const y = topPadding + index * (barHeight + 5);
            const width = task.duration * currentPixelsPerUnit;
            const isMilestone = task.duration === 0; const milestoneSize = barHeight / 1.5; const isSelected = task.id === selectedTaskId;
            const textPadding = 5;
            return (
              <g key={task.id} className="task-bar-group" onClick={(e) => { e.stopPropagation(); if (onTaskSelect) onTaskSelect(task.id === selectedTaskId ? null : task.id); }} style={{ cursor: 'pointer' }}>
                <text x={taskLabelWidth - 10} y={y + barHeight / 2} dy=".35em" textAnchor="end" fontSize="11" fill={isSelected ? '#007bff' : '#333'} fontWeight={isSelected ? 'bold' : 'normal'}>
                  {showTaskIdsAsLabels ? task.id : task.name.substring(0,15) + (task.name.length > 15 ? '...' : '')}
                </text>
                {isMilestone ? ( <polygon points={`${x - milestoneSize / 2},${y + barHeight / 2} ${x},${y + barHeight / 2 - milestoneSize / 2} ${x + milestoneSize / 2},${y + barHeight / 2} ${x},${y + barHeight / 2 + milestoneSize / 2}`} fill={task.isCritical ? (isSelected ? '#c0392b' : '#e74c3c') : (isSelected ? '#2980b9' : '#3498db')} stroke={isSelected ? '#0056b3' : (task.isCritical ? '#c0392b' : '#2980b9')} strokeWidth={isSelected ? "2" : "1"} />
                ) : ( <rect x={x} y={y} width={Math.max(width, 1)} height={barHeight} fill={task.isCritical ? (isSelected ? 'rgba(192, 57, 43, 0.9)' : 'rgba(231, 76, 60, 0.8)') : (isSelected ? 'rgba(41, 128, 185,0.9)' : 'rgba(52, 152, 219, 0.8)')} stroke={isSelected ? '#0056b3' : (task.isCritical ? '#c0392b' : '#2980b9')} strokeWidth={isSelected ? "2" : "1"} rx="2" ry="2" /> )}
                {!isMilestone && width > 10 && (
                  <text x={x + textPadding} y={y + barHeight / 2} dy=".35em" fill="#fff" fontSize="10" fontWeight="bold" pointerEvents="none" textAnchor="start">
                    {width - textPadding * 2 > 15 ? task.name.substring(0, Math.floor((width - textPadding * 2) / 6.5)) + (task.name.length > Math.floor((width - textPadding * 2) / 6.5) ? '…' : '') : ''}
                  </text>
                )}
                <title>{`Tâche: ${task.name} (ID: ${task.id})\nDurée: ${task.duration} ${timeUnitLabels[timeUnit].toLowerCase()}\nES: ${task.es}, EF: ${task.ef}\nLS: ${task.ls}, LF: ${task.lf}\nTot. Slack: ${task.totalSlack}, Free Slack: ${task.freeSlack}\nCritique: ${task.isCritical ? 'Oui' : 'Non'}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default GanttChart;
