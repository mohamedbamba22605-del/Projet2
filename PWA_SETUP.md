# Configuration PWA - Le Match Continue

Ce guide explique comment configurer et installer l'application comme PWA (Progressive Web App) sur différentes plateformes.

## 📋 Étapes de configuration

### 1. Générer les icônes

Ouvrez le fichier `generate-icons.html` dans votre navigateur :

```bash
# Dans le navigateur
file:///c:/Users/bamba/Downloads/Projet2/generate-icons.html
```

Cliquez sur "Tout télécharger" pour obtenir les fichiers PNG :
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)
- `apple-touch-icon.png` (180x180 pixels)
- `favicon-32.png` (32x32 pixels)

Copiez ces fichiers dans le dossier `public/`.

### 2. Installer les dépendances

```bash
npm install
```

Cela installera `sharp` pour la génération d'icônes (optionnel si vous utilisez le générateur HTML).

### 3. Construire l'application

```bash
npm run build
```

### 4. Déployer l'application

L'application doit être servie via HTTPS pour fonctionner comme PWA. Vous pouvez utiliser :
- Vercel, Netlify, ou GitHub Pages
- Votre propre serveur avec SSL
- ngrok pour les tests locaux

## 🚀 Installation PWA

### Sur Desktop (Chrome, Edge)

1. Ouvrez l'application dans le navigateur
2. Une bannière d'installation apparaîtra automatiquement
3. Cliquez sur "Installer"
4. L'application sera ajoutée au menu Démarrer et au bureau

### Sur iOS (iPhone, iPad)

1. Ouvrez l'application dans Safari
2. Appuyez sur le bouton Partager (icône de carré avec flèche vers le haut)
3. Sélectionnez "Sur l'écran d'accueil"
4. Confirmez en tapant "Ajouter"
5. L'icône apparaîtra sur l'écran d'accueil

### Sur Android

1. Ouvrez l'application dans Chrome
2. Une bannière d'installation apparaîtra automatiquement
3. Cliquez sur "Installer" ou "Ajouter à l'écran d'accueil"
4. L'icône apparaîtra sur l'écran d'accueil

## 🔧 Fonctionnalités PWA implémentées

### ✅ Manifest Web App
- Nom de l'application personnalisé
- Icônes multiples pour différentes tailles
- Thème de couleur rouge (#dc2626)
- Mode d'affichage autonome (standalone)
- Support des raccourcis
- Catégories (santé, médical)

### ✅ Service Worker
- Stratégie de cache avancée :
  - Cache-first pour les assets statiques
  - Network-first pour les appels API
  - Stale-while-revalidate pour le HTML
- Mise à jour automatique du cache
- Support hors-ligne

### ✅ Meta tags iOS
- Support de l'écran d'accueil iOS
- Icône tactile Apple
- Style de barre de statut
- Détection automatique désactivée pour les numéros de téléphone

### ✅ Prompt d'installation automatique
- Détection automatique de l'éligibilité à l'installation
- Bannière d'installation personnalisée
- Gestion de l'état d'installation
- Support multi-plateforme

## 📱 Personnalisation des icônes

Pour utiliser vos propres icônes :

1. Remplacez le fichier `public/icon.svg` par votre SVG personnalisé
2. Ouvrez `generate-icons.html` pour générer les PNG
3. Téléchargez et copiez les fichiers dans `public/`

## 🌐 Test du PWA

### Lighthouse Audit

1. Ouvrez Chrome DevTools (F12)
2. Allez dans l'onglet Lighthouse
3. Sélectionnez "Progressive Web App"
4. Cliquez sur "Analyze page load"

Vous devriez obtenir un score proche de 100%.

### Vérification manuelle

- [ ] L'application se charge hors-ligne
- [ ] L'icône personnalisée s'affiche
- [ ] L'application s'installe sur desktop
- [ ] L'application s'installe sur mobile
- [ ] Le thème de couleur est appliqué
- [ ] L'application fonctionne en mode standalone

## 🔒 Configuration HTTPS

Pour un environnement de production, assurez-vous que :

1. Votre domaine a un certificat SSL valide
2. Le service worker est servi depuis le même origine
3. Les assets sont également servis via HTTPS

Pour les tests locaux, vous pouvez utiliser :
```bash
npx local-ssl-server --dist dist
```

## 📝 Structure des fichiers PWA

```
public/
├── manifest.json          # Manifest PWA
├── sw.js                  # Service Worker
├── icon.svg               # Icône source SVG
├── icon-192.png           # Icône 192x192
├── icon-512.png           # Icône 512x512
├── apple-touch-icon.png   # Icône iOS
└── favicon-32.png         # Favicon

src/
├── hooks/
│   └── usePWAInstall.ts   # Hook d'installation PWA
└── components/
    └── InstallPrompt.tsx  # Composant de prompt d'installation
```

## 🐛 Dépannage

### L'installation ne se propose pas
- Vérifiez que le site est servi en HTTPS
- Assurez-vous que le service worker est enregistré
- Vérifiez que le manifest.json est accessible
- Essayez en mode navigation privée

### Les icônes ne s'affichent pas
- Vérifiez que les fichiers PNG existent dans `public/`
- Assurez-vous que les chemins dans manifest.json sont corrects
- Videz le cache du navigateur

### L'application ne fonctionne pas hors-ligne
- Vérifiez que le service worker est actif dans DevTools
- Assurez-vous que les assets sont dans la liste STATIC_ASSETS
- Rechargez la page après activation du service worker

## 📚 Ressources

- [Documentation PWA MDN](https://developer.mozilla.org/fr/docs/Web/Progressive_web_apps)
- [Lighthouse PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Builder](https://www.pwabuilder.com/)
