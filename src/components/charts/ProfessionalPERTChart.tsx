"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Task } from '@/types/task';
import * as d3 from 'd3';

interface PERTChartProps {
  tasks: Task[];
  timeUnit?: string;
}

interface PERTNode {
  id: string;
  name: string;
  duration: number;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  isCritical: boolean;
  x?: number;
  y?: number;
  isStart?: boolean;
  isEnd?: boolean;
  predecessors: string[];
  successors: string[];
}

interface PERTEdge {
  source: string;
  target: string;
  isCritical: boolean;
  duration: number;
}

export default function ProfessionalPERTChart({ tasks, timeUnit = 'jours' }: PERTChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState<{ x: number; y: number; content: React.ReactNode }>({
    x: 0,
    y: 0,
    content: null
  });

  // Préparer les données du diagramme PERT
  const prepareData = () => {
    // Créer un graphe dirigé à partir des tâches
    const nodes: PERTNode[] = [];
    const edges: PERTEdge[] = [];
    
    // Identifier les tâches de début et de fin
    const hasIncomingEdges = new Set<string>();
    const hasOutgoingEdges = new Set<string>();
    
    // Première passe: identifier les relations
    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        hasIncomingEdges.add(task.id);
        hasOutgoingEdges.add(depId);
      });
    });
    
    // Deuxième passe: créer les nœuds
    tasks.forEach(task => {
      const isStart = !hasIncomingEdges.has(task.id) && task.dependencies.length === 0;
      const isEnd = !hasOutgoingEdges.has(task.id);
      
      nodes.push({
        id: task.id,
        name: task.name,
        duration: task.duration,
        earliestStart: task.earliestStart,
        earliestFinish: task.earliestFinish,
        latestStart: task.latestStart,
        latestFinish: task.latestFinish,
        slack: task.slack,
        isCritical: task.isCritical,
        isStart,
        isEnd,
        predecessors: task.dependencies,
        successors: []
      });
    });
    
    // Troisième passe: identifier les successeurs
    nodes.forEach(node => {
      nodes.forEach(otherNode => {
        if (otherNode.predecessors.includes(node.id)) {
          node.successors.push(otherNode.id);
        }
      });
    });
    
    // Quatrième passe: créer les arêtes
    nodes.forEach(node => {
      node.predecessors.forEach(predId => {
        const predNode = nodes.find(n => n.id === predId);
        if (predNode) {
          edges.push({
            source: predId,
            target: node.id,
            isCritical: node.isCritical && predNode.isCritical,
            duration: predNode.duration
          });
        }
      });
    });
    
    return { nodes, edges };
  };

  // Calculer les positions des nœuds
  const calculatePositions = (nodes: PERTNode[], edges: PERTEdge[]) => {
    // Créer une copie pour ne pas modifier l'original
    const positionedNodes = [...nodes];
    
    // Calculer les niveaux (rangs) des nœuds
    const ranks = new Map<string, number>();
    const processed = new Set<string>();
    
    // Fonction récursive pour calculer les rangs
    const calculateRank = (nodeId: string, currentRank: number) => {
      if (processed.has(nodeId)) return;
      
      const node = positionedNodes.find(n => n.id === nodeId);
      if (!node) return;
      
      processed.add(nodeId);
      
      // Mettre à jour le rang si nécessaire
      const existingRank = ranks.get(nodeId) || 0;
      const newRank = Math.max(existingRank, currentRank);
      ranks.set(nodeId, newRank);
      
      // Calculer les rangs des successeurs
      node.successors.forEach(succId => {
        calculateRank(succId, newRank + 1);
      });
    };
    
    // Commencer par les nœuds de début
    positionedNodes.filter(node => node.isStart).forEach(node => {
      calculateRank(node.id, 0);
    });
    
    // Regrouper les nœuds par rang
    const nodesByRank = new Map<number, PERTNode[]>();
    for (const [nodeId, rank] of ranks.entries()) {
      const node = positionedNodes.find(n => n.id === nodeId);
      if (node) {
        if (!nodesByRank.has(rank)) {
          nodesByRank.set(rank, []);
        }
        nodesByRank.get(rank)?.push(node);
      }
    }
    
    // Assigner les positions X et Y
    const horizontalSpacing = 300;
    const verticalSpacing = 150;
    const startX = 100;
    const startY = 100;
    
    for (const [rank, rankNodes] of nodesByRank.entries()) {
      const x = startX + rank * horizontalSpacing;
      
      rankNodes.forEach((node, index) => {
        const y = startY + index * verticalSpacing;
        
        // Mettre à jour les positions dans le tableau original
        const originalNode = positionedNodes.find(n => n.id === node.id);
        if (originalNode) {
          originalNode.x = x;
          originalNode.y = y;
        }
      });
    }
    
    return positionedNodes;
  };

  // Effet pour dessiner le diagramme PERT
  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;
    
    // Préparer les données
    const { nodes, edges } = prepareData();
    const positionedNodes = calculatePositions(nodes, edges);
    
    // Nettoyer le SVG existant
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Dimensions du SVG
    const width = containerRef.current?.clientWidth || 1000;
    const height = Math.max(600, Math.max(...positionedNodes.map(n => n.y || 0)) + 200);
    
    // Définir les dimensions du SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
    
    // Créer un groupe pour le contenu zoomable
    const g = svg.append("g");
    
    // Ajouter le comportement de zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr("transform", `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`);
        setZoomLevel(event.transform.k);
      });
    
    svg.call(zoom);
    
    // Définir les marqueurs de flèche
    svg.append("defs").selectAll("marker")
      .data(["normal", "critical"])
      .enter().append("marker")
      .attr("id", d => `arrowhead-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", d => d === "critical" ? "#e53e3e" : "#4a5568");
    
    // Dessiner les arêtes
    edges.forEach(edge => {
      const source = positionedNodes.find(n => n.id === edge.source);
      const target = positionedNodes.find(n => n.id === edge.target);
      
      if (source && target && source.x !== undefined && source.y !== undefined && 
          target.x !== undefined && target.y !== undefined) {
        // Calculer les points de début et de fin pour que la flèche s'arrête au bord du cercle
        const nodeRadius = 60;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const angle = Math.atan2(dy, dx);
        
        const startX = source.x + Math.cos(angle) * nodeRadius;
        const startY = source.y + Math.sin(angle) * nodeRadius;
        const endX = target.x - Math.cos(angle) * nodeRadius;
        const endY = target.y - Math.sin(angle) * nodeRadius;
        
        // Dessiner la ligne
        g.append("path")
          .attr("d", `M${startX},${startY} L${endX},${endY}`)
          .attr("stroke", edge.isCritical ? "#e53e3e" : "#718096")
          .attr("stroke-width", edge.isCritical ? 3 : 2)
          .attr("stroke-dasharray", edge.isCritical ? "none" : "5,5")
          .attr("marker-end", `url(#arrowhead-${edge.isCritical ? "critical" : "normal"})`)
          .attr("fill", "none");
        
        // Ajouter le label de durée
        const labelX = (startX + endX) / 2;
        const labelY = (startY + endY) / 2 - 10;
        
        const labelBg = g.append("rect")
          .attr("x", labelX - 15)
          .attr("y", labelY - 15)
          .attr("width", 30)
          .attr("height", 20)
          .attr("rx", 5)
          .attr("ry", 5)
          .attr("fill", "white")
          .attr("stroke", edge.isCritical ? "#e53e3e" : "#718096")
          .attr("stroke-width", 1);
        
        g.append("text")
          .attr("x", labelX)
          .attr("y", labelY)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", edge.isCritical ? "bold" : "normal")
          .attr("fill", edge.isCritical ? "#e53e3e" : "#4a5568")
          .text(edge.duration);
      }
    });
    
    // Dessiner les nœuds
    positionedNodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) return;
      
      // Groupe pour le nœud
      const nodeGroup = g.append("g")
        .attr("transform", `translate(${node.x}, ${node.y})`)
        .attr("class", "pert-node")
        .style("cursor", "pointer");
      
      // Cercle principal
      nodeGroup.append("circle")
        .attr("r", 60)
        .attr("fill", "white")
        .attr("stroke", node.isCritical ? "#e53e3e" : "#4299e1")
        .attr("stroke-width", node.isCritical ? 3 : 2);
      
      // Lignes de séparation
      nodeGroup.append("line")
        .attr("x1", -60)
        .attr("y1", 0)
        .attr("x2", 60)
        .attr("y2", 0)
        .attr("stroke", "#718096")
        .attr("stroke-width", 1);
      
      nodeGroup.append("line")
        .attr("x1", 0)
        .attr("y1", -60)
        .attr("x2", 0)
        .attr("y2", 60)
        .attr("stroke", "#718096")
        .attr("stroke-width", 1);
      
      // Numéro de tâche au centre
      nodeGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .attr("fill", "#1a202c")
        .text(node.isStart ? "Début" : node.isEnd ? "Fin" : node.name);
      
      // Dates au plus tôt (en haut à gauche)
      nodeGroup.append("text")
        .attr("x", -30)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "#22c55e")
        .text(node.earliestStart);
      
      // Dates au plus tard (en haut à droite)
      nodeGroup.append("text")
        .attr("x", 30)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "#ef4444")
        .text(node.latestStart);
      
      // Dates au plus tôt (en bas à gauche)
      nodeGroup.append("text")
        .attr("x", -30)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "#22c55e")
        .text(node.earliestFinish);
      
      // Dates au plus tard (en bas à droite)
      nodeGroup.append("text")
        .attr("x", 30)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "#ef4444")
        .text(node.latestFinish);
      
      // Ajouter un événement pour afficher les détails au survol
      nodeGroup.on("mouseover", (event) => {
        setTooltipContent({
          x: event.pageX,
          y: event.pageY,
          content: (
            <div>
              <h3 className="font-bold text-gray-900">{node.name}</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <p className="text-sm"><span className="font-medium">Durée:</span> {node.duration} {timeUnit}</p>
                  <p className="text-sm"><span className="font-medium">Début tôt:</span> {node.earliestStart}</p>
                  <p className="text-sm"><span className="font-medium">Fin tôt:</span> {node.earliestFinish}</p>
                </div>
                <div>
                  <p className="text-sm"><span className="font-medium">Début tard:</span> {node.latestStart}</p>
                  <p className="text-sm"><span className="font-medium">Fin tard:</span> {node.latestFinish}</p>
                  <p className="text-sm"><span className="font-medium">Marge:</span> {node.slack} {timeUnit}</p>
                </div>
              </div>
              {node.isCritical && (
                <div className="mt-2 text-red-600 font-semibold">Tâche critique</div>
              )}
            </div>
          )
        });
        setShowTooltip(true);
      });
      
      nodeGroup.on("mousemove", (event) => {
        setTooltipContent(prev => ({
          ...prev,
          x: event.pageX,
          y: event.pageY
        }));
      });
      
      nodeGroup.on("mouseleave", () => {
        setShowTooltip(false);
      });
    });
    
    // Centrer le diagramme initialement
    if (positionedNodes.length > 0) {
      const xValues = positionedNodes.map(n => n.x || 0);
      const yValues = positionedNodes.map(n => n.y || 0);
      
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const minY = Math.min(...yValues);
      const maxY = Math.max(...yValues);
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      const scale = 0.8;
      const transform = d3.zoomIdentity
        .translate(width / 2 - centerX * scale, height / 2 - centerY * scale)
        .scale(scale);
      
      svg.call(zoom.transform, transform);
    }
  }, [tasks, timeUnit]);
  
  // Gérer le passage en plein écran
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };
  
  // Gérer le zoom
  const handleZoom = (factor: number) => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const currentZoom = d3.zoomTransform(svg.node() as Element);
    const newScale = currentZoom.k * factor;
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3]);
    
    svg.call(zoom.transform, currentZoom.scale(newScale));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Diagramme PERT</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => handleZoom(1.2)} 
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
            title="Zoom avant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={() => handleZoom(0.8)} 
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
            title="Zoom arrière"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={toggleFullscreen} 
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
            title="Plein écran"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div ref={containerRef} className="relative w-full overflow-auto" style={{ height: isFullscreen ? '100vh' : '600px' }}>
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Ajoutez des tâches pour générer le diagramme PERT</p>
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-full"></svg>
        )}
        
        {/* Tooltip */}
        {showTooltip && (
          <div 
            className="absolute z-10 bg-white p-3 rounded-lg shadow-lg border border-gray-200"
            style={{ 
              left: tooltipContent.x + 10, 
              top: tooltipContent.y + 10,
              maxWidth: '300px'
            }}
          >
            {tooltipContent.content}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-wrap justify-center gap-6">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full border-2 border-[#4299e1]"></div>
            <span className="ml-2 text-sm">Tâche standard</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full border-2 border-[#e53e3e]"></div>
            <span className="ml-2 text-sm">Tâche critique</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1 text-sm">Dates au plus tôt:</span>
            <span className="text-[#22c55e] font-bold">vert</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1 text-sm">Dates au plus tard:</span>
            <span className="text-[#ef4444] font-bold">rouge</span>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          <p>Utilisez la molette de la souris pour zoomer et déplacer le diagramme</p>
          <p>Survolez les nœuds pour afficher les détails des tâches</p>
        </div>
      </div>
    </div>
  );
}
