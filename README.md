# Gantt & PERT Manager - Gestion de Projets

## Description

Un projet académique de mise en œuvre des **diagrammes de Gantt** et de **PERT** pour la planification, le suivi et l'optimisation de projets complexes.

## Objectif du projet

Ce projet a pour but de :

- Définir et structurer les **tâches** d'un projet avec leurs **durées** et **dépendances**
- Générer automatiquement :
  - Un **diagramme de Gantt** pour la planification visuelle
  - Un **réseau PERT** pour l'optimisation des temps (chemin critique, marges, etc.)
- Suivre l'avancement des tâches et recalculer les estimations

## Fonctionnalités

- Création et gestion de tâches avec leurs durées et dépendances
- Visualisation des tâches sous forme de diagramme de Gantt
- Analyse des relations entre tâches avec diagramme PERT
- Identification automatique du chemin critique
- Calcul des dates au plus tôt, au plus tard et des marges

## Technologies utilisées

- Next.js
- TypeScript
- Tailwind CSS
- Chart.js
- D3.js pour les visualisations avancées

## Installation

```bash
npm install
```

## Démarrage

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour accéder à l'application.
---

## ✨ Fonctionnalités clés

### 📌 Gestion des tâches
- Création de tâches avec :
  - Nom
  - Durée estimée
  - Dépendances (prédécesseurs)
  - Statut (à faire, en cours, terminé)

### 📅 Génération du diagramme de Gantt
- Affichage de la planification des tâches
- Détection automatique des retards et chevauchements

### 🧮 Analyse PERT
- Calcul du **chemin critique (Critical Path)**
- Calcul des **dates au plus tôt/au plus tard**
- Détection des marges totales et libres



## 🔧 Installation et exécution

### Prérequis
- Node.js >= 18
- npm ou yarn


### Installation

# Cloner le repo
git clone https://github.com/recherche07/GanttPertCHARTS.git)
cd pert-gantt

# Installer les dépendances
npm install

>>>>>>> 3804efb791e794fc794a9b21ee8f2453ebecb0b8
