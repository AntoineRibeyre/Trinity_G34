# Trinity Activity Agent

Agent desktop de détection d'activité pour le système Trinity. Détecte automatiquement l'activité utilisateur (clavier/souris) sur l'ensemble du système et gère le pointage en conséquence.

## Fonctionnalités

- **Détection d'activité globale** : Surveille les événements clavier et souris sur tout le système
- **Pointage automatique** : Démarre/arrête automatiquement le pointage en fonction de l'activité
- **Tray Icon** : Interface minimale dans la barre système avec menu contextuel
- **Configuration** : Seuil d'inactivité personnalisable
- **Multi-plateforme** : Windows, macOS et Linux

## Prérequis

- [Rust](https://rustup.rs/) (1.70+)
- [Node.js](https://nodejs.org/) (18+)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Permissions système

#### macOS
L'application nécessite les permissions d'**Accessibilité** pour capturer les événements globaux :
- Aller dans **Préférences Système > Sécurité et confidentialité > Confidentialité > Accessibilité**
- Ajouter l'application à la liste

#### Linux
Installer les dépendances système :
```bash
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev
```

Pour la capture des événements clavier/souris, l'utilisateur doit être dans le groupe `input` :
```bash
sudo usermod -aG input $USER
```

## Installation

```bash
cd agent-desktop

# Installer les dépendances npm
npm install

# Développement
npm run dev

# Build de production
npm run build
```

## Configuration

Au premier lancement, configurez :

1. **URL du serveur GraphQL** : L'URL de votre backend Trinity (ex: `http://localhost:8000/graphql`)
2. **ID Utilisateur** : Votre ID utilisateur dans le système Trinity
3. **Seuil d'inactivité** : Nombre de secondes avant de considérer l'utilisateur comme inactif (défaut: 60s)
4. **Lancement automatique** : Option pour démarrer l'agent au boot du système

## Utilisation

L'agent s'exécute en arrière-plan avec une icône dans la barre système (tray).

### Menu tray
- **Play/Pause** : Basculer manuellement le pointage
- **Configuration** : Ouvrir la fenêtre de configuration
- **Quitter** : Fermer l'application

### Comportement automatique
- Quand vous êtes actif (clavier/souris) → le pointage démarre automatiquement
- Quand vous êtes inactif (aucune activité pendant X secondes) → le pointage s'arrête

## Structure du projet

```
agent-desktop/
├── src/                    # Frontend (HTML/JS)
│   └── index.html          # Interface de configuration
├── src-tauri/
│   ├── src/
│   │   ├── main.rs         # Point d'entrée Tauri
│   │   ├── activity_monitor.rs  # Détection d'activité
│   │   ├── graphql_client.rs    # Client API GraphQL
│   │   ├── config.rs       # Gestion configuration
│   │   └── tray.rs         # Menu tray icon
│   ├── icons/              # Icônes de l'application
│   ├── Cargo.toml          # Dépendances Rust
│   └── tauri.conf.json     # Configuration Tauri
└── package.json
```

## Développement

```bash
# Mode développement avec hot-reload
npm run dev

# Build debug
npm run build:debug

# Build release
npm run build
```

Les binaires sont générés dans `src-tauri/target/release/bundle/`.

## Intégration avec Trinity

L'agent utilise les mêmes mutations GraphQL que le frontend Angular :

```graphql
mutation RegisterArrival($userId: Int!) {
  registerArrival(userId: $userId) {
    datetimeField
    durationField
  }
}

mutation RegisterEnd($userId: Int!, $dayType: String!) {
  registerEnd(userId: $userId, dayType: $dayType) {
    datetimeField
    durationField
  }
}
```

## Troubleshooting

### macOS : "Permission denied" pour les événements
Vérifiez que l'app est autorisée dans les paramètres d'Accessibilité.

### Linux : Pas de détection d'événements
Assurez-vous d'être dans le groupe `input` et redémarrez votre session.

### Erreur de connexion au serveur
Vérifiez que l'URL GraphQL est correcte et que le backend Trinity est accessible.
