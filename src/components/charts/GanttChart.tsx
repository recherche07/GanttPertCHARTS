"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TooltipItem } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Task } from '@/types/task';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, annotationPlugin);

interface GanttChartProps {
  tasks: Task[];
  timeUnit?: string;
}

export default function GanttChart({ tasks, timeUnit = 'jours' }: GanttChartProps) {
  const [currentTimeUnit, setCurrentTimeUnit] = useState<string>(timeUnit);
  // Trier les tâches par date de début au plus tôt
  const sortedTasks = [...tasks].sort((a, b) => a.earliestStart - b.earliestStart);
  
  // Calculer la durée maximale du projet pour définir l'échelle
  const maxDuration = Math.max(...tasks.map(task => task.earliestFinish), 30);
  
  // Fonction pour changer l'unité de temps
  const handleTimeUnitChange = (newUnit: string) => {
    setCurrentTimeUnit(newUnit);
  };
  
  // Créer des graduations pour l'axe X (jours)
  const gridLines = Array.from({ length: maxDuration + 1 }, (_, i) => i);
  
  // Fonction pour générer des couleurs dégradées pour les barres
  const generateBarStyle = (task: Task) => {
    if (task.isCritical) {
      return {
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
        borderRadius: 4
      };
    } else {
      return {
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
        borderRadius: 4
      };
    }
  };

  // Préparer les données pour le diagramme de Gantt
  const datasets = sortedTasks.map((task, index) => ({
    label: task.name,
    data: [{
      x: [task.earliestStart, task.earliestFinish],
      y: task.name
    }],
    ...generateBarStyle(task),
    barPercentage: 0.6,
    categoryPercentage: 0.8,
    barThickness: 25,
    borderSkipped: false,
  }));

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear' as const,
        beginAtZero: true,
        max: maxDuration,
        title: {
          display: true,
          text: `Durée (${currentTimeUnit})`,
          font: {
            weight: 'bold' as const,
            size: 14
          }
        },
        ticks: {
          stepSize: 5,
          callback: function(this: any, tickValue: string | number) {
            return tickValue.toString();
          },
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.3)',
          lineWidth: 1
        }
      },
      y: {
        title: {
          display: true,
          text: 'Tâches',
          font: {
            weight: 'bold' as const,
            size: 14
          }
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Diagramme de Gantt',
        font: {
          size: 18,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            if (!items.length) return '';
            const datasetIndex = items[0].datasetIndex;
            return sortedTasks[datasetIndex]?.name || '';
          },
          label: (item: any) => {
            const datasetIndex = item.datasetIndex;
            const task = sortedTasks[datasetIndex];
            if (!task) return [];
            
            return [
              `Durée: ${task.duration} ${currentTimeUnit}`,
              `Début: ${currentTimeUnit.charAt(0).toUpperCase() + currentTimeUnit.slice(1)} ${task.earliestStart}`,
              `Fin: ${currentTimeUnit.charAt(0).toUpperCase() + currentTimeUnit.slice(1)} ${task.earliestFinish}`,
              `Marge: ${task.slack} ${currentTimeUnit}`,
              `${task.isCritical ? '⚠️ Tâche critique' : ''}`
            ];
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          weight: 'bold' as const
        },
        padding: 10,
        cornerRadius: 6
      },
      annotation: {
        annotations: {
          // Lignes verticales pour les graduations principales
          ...gridLines.reduce((acc: Record<string, any>, day) => {
            if (day % 5 === 0) {
              acc[`line-${day}`] = {
                type: 'line',
                xMin: day,
                xMax: day,
                borderColor: 'rgba(150, 150, 150, 0.5)',
                borderWidth: 1,
                borderDash: [5, 5]
              };
            }
            return acc;
          }, {} as Record<string, any>)
        }
      }
    },
  };

  const data = {
    labels: sortedTasks.map(task => task.name),
    datasets: datasets
  };

  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      chart.update();
    }
  }, [tasks]);

  return (
    <div className="w-full h-[600px] p-4 bg-white rounded-lg shadow-md">
      <div className="mb-4 flex justify-between items-center">
        <div className="text-lg font-semibold">Diagramme de Gantt</div>
        <div className="flex items-center space-x-2">
          <label htmlFor="timeUnit" className="text-sm font-medium text-gray-700">Unité de temps:</label>
          <select
            id="timeUnit"
            value={currentTimeUnit}
            onChange={(e) => handleTimeUnitChange(e.target.value)}
            className="block w-32 pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="jours">Jours</option>
            <option value="heures">Heures</option>
            <option value="semaines">Semaines</option>
            <option value="mois">Mois</option>
          </select>
        </div>
      </div>
      <Bar ref={chartRef} options={options} data={data} />
      <div className="mt-6 flex justify-center gap-8">
        <div className="flex items-center">
          <div className="w-5 h-5 bg-[rgba(54,162,235,0.7)] mr-2 rounded"></div>
          <span className="text-sm font-medium">Tâche standard</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 bg-[rgba(255,99,132,0.7)] mr-2 rounded"></div>
          <span className="text-sm font-medium">Tâche critique</span>
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-500 text-center">
        Les barres représentent la durée de chaque tâche, positionnées selon leur date de début.
      </div>
    </div>
  );
}
