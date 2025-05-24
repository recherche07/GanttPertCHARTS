# Task Scheduler - Diagrammes Gantt et PERT

Application web développée avec [Next.js](https://nextjs.org) pour la gestion de tâches, la génération de diagrammes de Gantt et PERT, et l'identification des chemins critiques dans la planification de projets.

## Fonctionnalités

- **Gestion des tâches** : Ajout, modification et suppression de tâches avec leurs dépendances
- **Diagramme de Gantt** : Visualisation chronologique des tâches et de leur durée
- **Diagramme PERT** : Analyse des relations entre les tâches et identification du chemin critique
- **Analyse du chemin critique** : Identification des tâches critiques qui impactent directement la durée du projet
- **Calcul automatique** : Détermination des dates au plus tôt, au plus tard, et des marges pour chaque tâche
- **Stockage local** : Sauvegarde des tâches dans le localStorage du navigateur

## Technologies utilisées

- **Next.js** : Framework React moderne avec l'architecture App Router
- **TypeScript** : Pour un typage fort et une meilleure maintenabilité
- **Tailwind CSS** : Pour un design responsive et moderne
- **React Hook Form** : Gestion des formulaires avec validation
- **Zod** : Validation des données avec schémas
- **Chart.js** : Visualisation des diagrammes

## Démarrage

Clonez le projet et installez les dépendances :

```bash
npm install
```

Démarrez le serveur de développement :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) avec votre navigateur pour voir l'application.

## Utilisation

1. **Page d'accueil** : Ajoutez et gérez vos tâches
   - Définissez un nom et une durée pour chaque tâche
   - Ajoutez des dépendances entre les tâches
   - Modifiez ou supprimez des tâches existantes

2. **Diagramme de Gantt** : Visualisez la chronologie du projet
   - Les tâches critiques sont affichées en rouge
   - Les tâches standards sont affichées en bleu

3. **Diagramme PERT** : Comprenez les relations entre les tâches
   - Visualisez les dates au plus tôt et au plus tard pour chaque tâche
   - Identifiez les tâches critiques et leurs marges

4. **Chemin Critique** : Analysez les tâches critiques du projet
   - Visualisez la séquence des tâches critiques
   - Obtenez des recommandations pour la gestion des tâches critiques

## Algorithmes implémentés

- **Forward Pass** : Calcul des dates au plus tôt
- **Backward Pass** : Calcul des dates au plus tard et des marges
- **Critical Path Method (CPM)** : Identification du chemin critique
- **Ordonnancement topologique** : Tri des tâches selon leurs dépendances
# GanttPertCharts
