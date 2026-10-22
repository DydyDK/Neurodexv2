# Neurodex

**L’encyclopédie à collectionner de l’esprit humain.** Un jeu de cartes à collectionner éducatif : chaque série présente un concept de psychologie ou de neurosciences, appuyé sur des sources académiques.

Ce dépôt contient le prototype web mobile (React), version 0.3.

## Tester sur téléphone en 5 minutes (GitHub Pages)

1. Crée un dépôt sur GitHub et pousse ce dossier sur la branche `main`.
2. Dans **Settings › Pages**, choisis **GitHub Actions** comme source.
3. Attends la fin du déploiement dans l’onglet **Actions** (environ 1 minute).
4. Ouvre l’adresse indiquée (du type `https://ton-compte.github.io/neurodex/`) sur ton téléphone.
5. Pour l’utiliser comme une vraie appli : **Partager › Sur l’écran d’accueil** sur iPhone (Safari), ou **⋮ › Ajouter à l’écran d’accueil** sur Android (Chrome). L’appli s’ouvre alors en plein écran avec son icône.

Pour ouvrir autant de boosters que voulu pendant les tests, ajoute `#test` à la fin de l’adresse. Un bouton « Test : booster Shiny + Mythe + Ultra » apparaît alors sur l’accueil.

## Tester en local

Prérequis : Node.js 18 ou plus récent.

```bash
npm install
npm run dev
```

Le terminal affiche une adresse « Network » (par exemple `http://192.168.1.20:5173`) : ouvre-la sur un téléphone connecté au même Wi-Fi.

```bash
npm run build     # site statique dans dist/
npm run preview   # sert le build localement
```

Remarque : le gyroscope (« Pencher avec le téléphone ») n’est autorisé par les navigateurs que sur une adresse **https**. En local sur le Wi-Fi, utilise plutôt le glisser au doigt ; sur GitHub Pages, tout fonctionne.

## Ce que contient la version 0.3

- **70 cartes** : 10 séries de 4 cartes, 10 cartes maîtresses, 10 Shiny en pleine illustration prismatique, 5 Mythes démasqués, 5 Chercheuses et chercheurs en Ultra Shiny.
- **Vidéo d’explication de 30 secondes** au tout premier booster (rejouable avec « Comment ça marche ? »).
- **Booster du jour** à déchirer au doigt, révélation en crescendo (de la plus commune à la plus rare), effets spéciaux pour les Shiny, Mythes et Ultra Shiny.
- **Inspection 3D** : chaque carte se penche au doigt ou avec le gyroscope, reflets et holographie suivent l’angle, verso consultable.
- **Éclats de savoir** (booster du jour et doublons) et **atelier** pour fabriquer les cartes manquantes.
- **Collection** : fresques des séries, onglet des cartes bonus.
- Sauvegarde locale et demande d’e-mail (prototype : rien n’est envoyé à un serveur).

## Équilibrage

| Type | Cartes | Fréquence |
| --- | --- | --- |
| Commune | 20 (illustration, histoire vraie) | 3 par booster |
| Peu commune | 10 (mécanisme) | emplacement 4 (75 %), emplacement 5 (15 %) |
| Rare | 10 (expérience) | emplacement 4 (25 %), emplacement 5 (85 %) |
| Shiny | 10 | environ 1 booster sur 8, garantie au 10e booster sans Shiny |
| Mythe démasqué | 5 | environ 1 booster sur 25 |
| Ultra Shiny | 5 | environ 1 booster sur 40 ; un Mythe ou une Ultra garanti au 30e booster |
| Carte maîtresse | 10 | série complète |

Éclats : +10 par booster du jour ; doublons +5 / +10 / +20 / +50 / +100 selon la rareté. Atelier : 40 / 80 / 150 / 400 / 800.

Les taux se règlent dans `src/App.jsx` (fonctions `rollSlot` et `draw`, constantes `DUP`, `COST`, `PITY_SHINY`, `PITY_BIG`).

## Structure

```
src/
  App.jsx            l’appli : accueil, intro, booster, révélation, collection, atelier, inspection 3D
  main.jsx           démarrage, ciel étoilé
  styles.css
  data/
    cards.json       les 70 cartes (HTML/SVG, format 630 × 880)
    catalog.js       séries et catalogue (rareté, libellés)
    art.js           dos de carte, illustration du booster
    hills.js         collines de fond
public/              icônes, manifeste pour l’écran d’accueil
prototype/index.html version autonome en un seul fichier
```

## Avant toute diffusion publique

- Vérifier les références, dates et chiffres marqués « à vérifier » dans les publications d’origine.
- Prévoir un vrai serveur pour la sauvegarde par e-mail (connexion par lien envoyé par e-mail).
- Définir la licence du dépôt (par défaut : tous droits réservés).
