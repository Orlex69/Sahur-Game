# Sahur.io - Brainrot "Tung Tung Sahur" Multiplayer Game

## En-tête
- **Développeurs** : Alexis BRAD, DUMAS Matthias, TOSCANO Léo & Antigravity (AI Agent)
- **Description** : Sahur.io est un jeu multijoueur en temps réel basé sur le concept d'Agar.io, revisité avec humour sur le thème du célèbre meme indonésien **"Tung Tung Sahur"** (les patrouilles réveillant les habitants en frappant sur des casseroles, d'anciens tambours en bambou et des mégaphones) couplé aux memes internet ("Brainrot"). Les joueurs incarnent des patrouilleurs du bruit qui accumulent des instruments de musique (kentongan, panci, toa, bedug, shakes) pour faire le plus grand ramdam possible (grossir) avant la fin de la patrouille, tout en évitant les voisins endormis (les Sleepers 😴) sous peine d'exploser.
- **URL de production** : https://sahur-game.onrender.com/
- **Backend serveur recommandé** : https://sahur-game-server.onrender.com

### Instructions pour lancer en local
1. Cloner le dépôt :
   ```bash
   git clone https://github.com/Orlex69/Sahur-Game.git
   cd Sahur-Game
   ```
2. Installer toutes les dépendances (racine, client, serveur) :
   ```bash
   npm run install:all
   ```
3. Lancer l'environnement de développement complet (client + serveur) :
   ```bash
   npm run dev
   ```
   - Le serveur WebSocket s'exécute sur le port 3000.
   - Le client web se lance sur le port 5173 via le serveur de développement Vite.

4. Exécuter la suite complète de tests (serveur & client) :
   ```bash
   npm run test
   ```

5. Lancer l'outil de validation de style (ESLint) :
   ```bash
   npm run lint
   ```

---

## L'Arsenal IA & Écosystème Agentique
- **Modèle de langage (LLM)** : Gemini 3.5 Flash (Medium) orchestré par la plateforme agentique Antigravity de DeepMind.
- **Outils et Écosystème** :
  - **Terminal / PowerShell Sandboxed Runner** : Utilisé pour inspecter les répertoires, exécuter les serveurs locaux, compiler le client Vite et lancer les tests unitaires.
  - **Scripts d'écriture Python Intermédiaires** : Pour contourner les protections d'accès en écriture directe de l'IDE sur la zone projet (.gemini/antigravity-ide/), nous avons écrit des scripts python d'écriture dans le dossier autorisé `scratch/` puis les avons exécutés via PowerShell pour modifier le code source de manière sécurisée.
- **System Instructions (Skills)** :
  - Directives strictes de développement Web (Atomic Design, séparation des préoccupations).
  - Règles de qualité de code (SRP, DRY, KISS).
  - Mode Planification (création obligatoire d'un plan d'implémentation avant d'écrire du code de production).

---

## Nouveautés Récentes
- **Bots IA Intégrés** : Ajout de bots autonomes qui patrouillent, cherchent de la nourriture et fuient les menaces.
- **Parties plus longues** : La durée des rounds a été augmentée à 3 minutes.
- **Nouveaux Boosts** : Ajout du Kopi (boost de vitesse) et de l'Indomie (multiplicateur de masse instantané).
- **Respawn Instantané** : Possibilité de réapparaître instantanément sans repasser par le lobby après une élimination.
- **Attraction Automatique** : Les cellules divisées s'attirent automatiquement après leur délai de fusion, facilitant la recombinaison.

---

## Ingénierie de Prompt (Master Prompts)
Voici deux prompts structurels essentiels qui ont débloqué l'architecture du jeu :
1. **Prompt de Conception de l'UI Atomique** :
   > "Structure l'interface utilisateur en respectant strictement l'Atomic Design. Crée des classes distinctes pour les Atoms (Button, InputField), les Molecules (LeaderboardRow), et les Organisms (LobbyMenu, HUD, Leaderboard, GameOverModal). Sépare entièrement le rendu Canvas (Renderer) de la logique UI DOM."
2. **Prompt de Synchronisation Temps Réel (Tung Tung Sahur edition)** :
   > "Mettez en place une boucle de jeu à 30 Hz où le serveur gère la physique des joueurs (vitesse modifiée par les instruments Kentongan et Panci) et propage les événements sonores de frappe ('Tung-Tung' synthétisé via Web Audio API) et de réveil des voisins fatigués (Angry Sleepers 😴)."

---

## Analyse Critique & Hallucinations
- **Où l'IA a excellé** :
  - **Moteur Audio Modulaire (Tung-Tung drum strike)** : Implémentation d'un synthétiseur de batterie dual-strike "Tung-Tung" ultra-réaliste dans `SoundManager` en manipulant le pitch et le gain d'un oscillateur basse fréquence en temps réel.
  - **Graphismes Canvas réactifs** : Rendu des instruments (le Kentongan en bambou, la casserole en métal, le mégaphone Toa) en formes géométriques 2D fluides avec des micro-animations de flottaison sinusodiale et de rotation angulaire.
- **Où l'IA s'est trompée (Hallucinations & Erreurs de Vibe)** :
  - **Erreur de Vibe de Sujet** : L'IA a initialement compris le jeu sous un angle purement alimentaire et religieux (Ramadan, repas pré-aube avec des dattes et de l'eau). Le développeur a dû recadrer l'IA pour axer le gameplay sur le meme indonésien du réveil au tambour ("Tung Tung Sahur") et des voisins irrités par le bruit (les Sleepers 😴). Nous avons refactorisé les variables de nourriture, les obstacles et les textures pour refléter cela.
  - **Gestion de l'Origine WebSocket** : L'IA avait initialement codé `io(window.location.origin)` en dur côté client, bloquant le déploiement sur GitHub Pages (statique). Nous avons corrigé cette erreur en introduisant une détection de `localhost` et un recours à une variable d'environnement `VITE_SERVER_URL` configurable.
  - **Absence de Suite de Tests Client** : Initialement, le script de test global échouait car aucun environnement de test n'était configuré sur le client. Nous avons corrigé ce "code spaghetti" de pipeline en ajoutant une suite de tests unitaires pour le client avec un DOM mocké ultra-léger sans dépendances tierces.
