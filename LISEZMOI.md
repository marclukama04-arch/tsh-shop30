# tsh.shop – boutique en ligne avec serveur (copie locale n°2)

Cette copie démarre sur le port **3001** avec ses propres données (articles de départ), donc elle peut tourner en même temps que l'ancienne (port 3000). Pour la lancer sous Windows : double-cliquez sur `demarrer`, puis ouvrez http://localhost:3001 (client) et http://localhost:3001/admin (admin).

- Boutique pour les clients : `https://VOTRE-SITE/`
- Espace admin (mot de passe) : `https://VOTRE-SITE/admin`

Fichiers : `public/index.html` = site client (sans aucun code admin), `public/admin.html` = espace admin (servi sur `/admin`). Les articles, images, stocks et commandes sont enregistrés sur le serveur : tout le monde voit les mêmes données.

## Lancer sur votre ordinateur (test)
1. Installez Node.js 18 ou plus (nodejs.org).
2. Dans ce dossier :
   - Windows (PowerShell) : `$env:ADMIN_PASSWORD="votre-mot-de-passe"; node server.js`
   - Mac / Linux : `ADMIN_PASSWORD="votre-mot-de-passe" node server.js`
3. Ouvrez http://localhost:3000 (boutique) et http://localhost:3000/admin (admin).

## Mettre en ligne (exemple : Render.com ou Railway.app)
1. Déposez ce dossier sur GitHub (ou envoyez le zip selon l'hébergeur).
2. Créez un « Web Service » Node : commande de démarrage `node server.js`.
3. Variables d'environnement : `ADMIN_PASSWORD` = votre mot de passe (obligatoire).
4. **Important** : ajoutez un disque persistant (Persistent Disk / Volume), montez-le par exemple sur `/data` et mettez `DATA_DIR=/data`. Sans disque, les articles, images et commandes sont effacés à chaque redémarrage.
5. Ajoutez votre domaine `tsh.shop` dans les réglages de l'hébergeur, puis les enregistrements DNS qu'il indique chez votre registrar.

## Utilisation
- Admin : ajoutez ou modifiez un article, changez une image, marquez « Épuisé », renommez, supprimez. Chaque changement est enregistré automatiquement (message « Enregistré »).
- Commandes : elles arrivent dans l'admin. Pour Airtel Money (+243 991212889), vérifiez le transfert sur votre téléphone puis cliquez « Marquer payé ».
- Sauvegarde : copiez régulièrement les dossiers `data` et `uploads`.

## Limites actuelles
- La vérification Airtel Money est manuelle. L'automatique demande l'API Airtel (ou Flutterwave / PawaPay) avec vos clés, à ajouter dans `server.js`.
- Un seul administrateur et un seul mot de passe. Si deux personnes modifient en même temps, la dernière sauvegarde l'emporte.
- Utilisez toujours le site en HTTPS (Render et Railway le fournissent) pour protéger le mot de passe.

## Héberger le site client séparément (optionnel)
Par défaut le serveur affiche le site. Si vous mettez `public/index.html` ailleurs (Netlify, par exemple), ouvrez-le et mettez l'adresse du serveur dans `const API=""` (ex. `const API="https://votre-nom.onrender.com"`).
