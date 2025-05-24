import React, { useEffect, useRef } from 'react';
import { Task } from '@/types/task';
import * as d3 from 'd3';

interface PERTChartProps {
  tasks: Task[];
}

interface PERTNode {
  key: string;
  text: string;
  duration: number;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  isCritical: boolean;
  x: number;
  y: number;
  isStart?: boolean;
  isEnd?: boolean;
}

interface PERTLink {
  from: string;
  to: string;
  isCritical?: boolean;
}

export default function PERTChart({ tasks }: PERTChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Créer les données pour le diagramme PERT
  const createPertData = (tasks: Task[]) => {
    // Ajouter des nœuds de début et de fin si nécessaire
    let allTasks = [...tasks];
    
    // Identifier les tâches qui n'ont pas de dépendances (tâches de début)
    const startTasks = allTasks.filter(task => task.dependencies.length === 0);
    
    // Identifier les tâches qui ne sont pas des prérequis pour d'autres tâches (tâches de fin)
    const endTasks = allTasks.filter(task => 
      !allTasks.some(t => t.dependencies.includes(task.id))
    );
    
    // Créer les nœuds pour le diagramme
    const nodes: PERTNode[] = allTasks.map(task => ({
      key: task.id,
      text: task.name,
      duration: task.duration,
      earliestStart: task.earliestStart,
      earliestFinish: task.earliestFinish,
      latestStart: task.latestStart,
      latestFinish: task.latestFinish,
      slack: task.slack,
      isCritical: task.isCritical,
      // Positions initiales pour le layout
      x: 0,
      y: 0,
      // Propriétés pour identifier les nœuds spéciaux
      isStart: startTasks.some(t => t.id === task.id),
      isEnd: endTasks.some(t => t.id === task.id)
    }));

    // Créer les liens entre les nœuds
    const links: PERTLink[] = allTasks.flatMap(task =>
      task.dependencies.map(depId => ({
        from: depId,
        to: task.id,
        // Propriété pour les tâches critiques
        isCritical: task.isCritical && allTasks.find(t => t.id === depId)?.isCritical
      }))
    );

    return { nodes, links };
  };
  
  // Obtenir les données formatées pour le PERT
  const pertData = createPertData(tasks);
  
  // Fonction pour calculer les positions des nœuds
  const calculateNodePositions = () => {
    // Implémentation simple d'un algorithme de positionnement par niveaux
    const nodeMap = new Map(pertData.nodes.map(node => [node.key, node]));
    
    // Calculer le niveau de chaque nœud (distance depuis le début)
    const levels = new Map<string, number>();
    
    // Initialiser les niveaux pour les nœuds de début
    pertData.nodes.filter(node => node.isStart).forEach(node => {
      levels.set(node.key, 0);
    });
    
    // Propager les niveaux
    let changed = true;
    while (changed) {
      changed = false;
      for (const link of pertData.links) {
        const fromLevel = levels.get(link.from);
        if (fromLevel !== undefined) {
          const currentToLevel = levels.get(link.to) || -1;
          const newToLevel = fromLevel + 1;
          if (newToLevel > currentToLevel) {
            levels.set(link.to, newToLevel);
            changed = true;
          }
        }
      }
    }
    
    // Organiser les nœuds par niveau
    const nodesByLevel = new Map<number, PERTNode[]>();
    for (const [key, level] of levels.entries()) {
      const node = nodeMap.get(key);
      if (node) {
        if (!nodesByLevel.has(level)) {
          nodesByLevel.set(level, []);
        }
        nodesByLevel.get(level)?.push(node);
      }
    }
    
    // Assigner les positions X et Y basées sur les niveaux
    const levelWidth = 200; // Espacement horizontal entre les niveaux
    const nodeHeight = 120; // Espacement vertical entre les nœuds
    
    for (const [level, nodes] of nodesByLevel.entries()) {
      const levelX = level * levelWidth + 100;
      nodes.forEach((node, index) => {
        const nodeY = index * nodeHeight + 100;
        node.x = levelX;
        node.y = nodeY;
      });
    }
    
    return pertData;
  };
  
  // Calculer les positions des nœuds
  const positionedData = calculateNodePositions();
  
  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;
    
    // Nettoyer le SVG existant
    d3.select(svgRef.current).selectAll("*").remove();
    
    const svg = d3.select(svgRef.current);
    const width = 1000;
    const height = 600;
    
    // Créer un groupe pour le contenu zoomable
    const g = svg.append("g");
    
    // Ajouter le comportement de zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr("transform", `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`);
      });
    
    svg.call(zoom);
    
    // Dessiner les liens (flèches)
    positionedData.links.forEach(link => {
      const source = positionedData.nodes.find(n => n.key === link.from);
      const target = positionedData.nodes.find(n => n.key === link.to);
      
      if (source && target) {
        // Calculer les points de début et de fin pour que la flèche s'arrête au bord du cercle
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const nodeRadius = 50;
        
        // Points ajustés pour commencer et terminer aux bords des cercles
        const startX = source.x + (dx * nodeRadius / distance);
        const startY = source.y + (dy * nodeRadius / distance);
        const endX = target.x - (dx * nodeRadius / distance);
        const endY = target.y - (dy * nodeRadius / distance);
        
        // Dessiner la ligne
        g.append("line")
          .attr("x1", startX)
          .attr("y1", startY)
          .attr("x2", endX)
          .attr("y2", endY)
          .attr("stroke", link.isCritical ? "#4b5563" : "#4b5563") // Couleur grise pour les flèches
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", link.isCritical ? "none" : "5,5") // Ligne pointillée pour les liens non critiques
          .attr("marker-end", "url(#arrowhead)");
        
        // Ajouter le label avec la durée si nécessaire
        const sourceTask = tasks.find(t => t.id === source.key);
        if (sourceTask) {
          const labelX = startX + (endX - startX) / 2;
          const labelY = startY + (endY - startY) / 2 - 10;
          
          g.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(`${sourceTask.duration}`);
        }
      }
    });
    
    // Définir le marqueur de flèche
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 5)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#4a5568");
    
    // Dessiner les nœuds
    const nodes = g.selectAll<SVGGElement, PERTNode>(".node")
      .data(positionedData.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: PERTNode) => `translate(${d.x}, ${d.y})`);
    
    // Cercle principal pour chaque nœud
    nodes.append("circle")
      .attr("r", 50)
      .attr("fill", "white")
      .attr("stroke", (d: PERTNode) => d.isCritical ? "#6b21a8" : "#6b21a8") // Couleur violette comme sur l'image
      .attr("stroke-width", 3);
    
    // Ligne de séparation horizontale
    nodes.append("line")
      .attr("x1", -50)
      .attr("y1", 0)
      .attr("x2", 50)
      .attr("y2", 0)
      .attr("stroke", "#718096")
      .attr("stroke-width", 1);
    
    // Ligne de séparation verticale
    nodes.append("line")
      .attr("x1", 0)
      .attr("y1", -50)
      .attr("x2", 0)
      .attr("y2", 50)
      .attr("stroke", "#718096")
      .attr("stroke-width", 1);
    
    // Numéro de tâche au centre
    nodes.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text((d: PERTNode) => d.isStart ? "Début" : d.isEnd ? "Fin" : d.text.length > 1 ? d.text : d.text);
    
    // Dates au plus tôt (en haut à gauche)
    nodes.append("text")
      .attr("x", -25)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", "#22c55e") // Vert comme sur l'image
      .text((d: PERTNode) => d.earliestStart);
    
    // Dates au plus tard (en haut à droite)
    nodes.append("text")
      .attr("x", 25)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", "#ef4444") // Rouge comme sur l'image
      .text((d: PERTNode) => d.latestStart);
    
    // Dates au plus tôt (en bas à gauche)
    nodes.append("text")
      .attr("x", -25)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", "#22c55e") // Vert comme sur l'image
      .text((d: PERTNode) => d.earliestFinish);
    
    // Dates au plus tard (en bas à droite)
    nodes.append("text")
      .attr("x", 25)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", "#ef4444") // Rouge comme sur l'image
      .text((d: PERTNode) => d.latestFinish);
    
  }, [tasks, positionedData]);

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4 text-center">Diagramme PERT</h3>
      
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Ajoutez des tâches pour générer le diagramme PERT
        </div>
      ) : (
        <div>
          <div className="w-full overflow-auto border rounded-lg">
            <svg ref={svgRef} width="100%" height="600" style={{ minWidth: '800px' }}></svg>
          </div>
          
          <div className="mt-6 flex justify-center gap-8">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full border-2 border-[#6b21a8]"></div>
              <span className="ml-2 text-sm">Nœud</span>
            </div>
            <div className="flex items-center">
              <hr className="w-8 h-0.5 bg-[#4b5563]" />
              <span className="ml-2 text-sm">Chemin normal</span>
            </div>
            <div className="flex items-center">
              <hr className="w-8 h-0.5 bg-[#4b5563] border-dashed border" style={{ borderStyle: 'dashed' }} />
              <span className="ml-2 text-sm">Chemin alternatif</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2 text-sm">Dates au plus tôt:</span>
              <span className="text-[#22c55e] font-bold">vert</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2 text-sm">Dates au plus tard:</span>
              <span className="text-[#ef4444] font-bold">rouge</span>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            Utilisez la molette de la souris pour zoomer et déplacer le diagramme
          </div>
        </div>
      )}
    </div>
  );
}
