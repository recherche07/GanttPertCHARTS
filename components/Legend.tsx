import React from 'react';
import styles from '../styles/legend.module.css';

/**
 * Props pour le composant Legend
 * @interface LegendProps
 */
interface LegendProps {
  /** Unité de temps utilisée dans le projet (jours, semaines, etc.) */
  timeUnit: string;
}

/**
 * Composant affichant une légende explicative des termes et codes couleurs utilisés
 * dans les diagrammes PERT et Gantt
 * 
 * @param {LegendProps} props - Les propriétés du composant
 * @returns {JSX.Element} Composant Legend
 */
const Legend: React.FC<LegendProps> = ({ timeUnit }) => {
  return (
    <div className={styles.legendContainer}>
      <h3 className={styles.legendTitle}>Légende et Explications</h3>
      
      <div className={styles.legendSection}>
        <h4 className={styles.legendSectionTitle}>Terminologie PERT/CPM</h4>
        <div className={styles.legendGrid}>
          <div className={styles.legendItem}>
            <span className={styles.legendTerm}>ES (Early Start)</span>
            <span className={styles.legendDescription}>Date au plus tôt de début de la tâche</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendTerm}>EF (Early Finish)</span>
            <span className={styles.legendDescription}>Date au plus tôt de fin de la tâche</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendTerm}>LS (Late Start)</span>
            <span className={styles.legendDescription}>Date au plus tard de début de la tâche</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendTerm}>LF (Late Finish)</span>
            <span className={styles.legendDescription}>Date au plus tard de fin de la tâche</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendTerm}>Marge Totale</span>
            <span className={styles.legendDescription}>Délai dont dispose une tâche sans retarder le projet (LS - ES)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendTerm}>Marge Libre</span>
            <span className={styles.legendDescription}>Délai dont dispose une tâche sans retarder ses successeurs</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendTerm}>Tâche Critique</span>
            <span className={styles.legendDescription}>Tâche dont la marge totale est nulle, faisant partie du chemin critique</span>
          </div>
        </div>
      </div>
      
      <div className={styles.legendSection}>
        <h4 className={styles.legendSectionTitle}>Codes Couleur</h4>
        <div className={styles.legendGrid}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendColorBox} ${styles.criticalColor}`}></span>
            <span className={styles.legendDescription}>Tâche critique (sur le chemin critique)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendColorBox} ${styles.selectedColor}`}></span>
            <span className={styles.legendDescription}>Tâche sélectionnée</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendColorBox} ${styles.normalColor}`}></span>
            <span className={styles.legendDescription}>Tâche normale</span>
          </div>
        </div>
      </div>
      
      <div className={styles.legendSection}>
        <h4 className={styles.legendSectionTitle}>Unités et Calculs</h4>
        <div className={styles.legendText}>
          <p>Toutes les durées et dates sont exprimées en <strong>{timeUnit}</strong>.</p>
          <p>Le chemin critique est le chemin le plus long dans le réseau de tâches, déterminant la durée minimale du projet.</p>
          <p>Les tâches sur le chemin critique n'ont pas de marge, tout retard sur ces tâches entraîne un retard du projet entier.</p>
        </div>
      </div>
    </div>
  );
};

export default Legend;
