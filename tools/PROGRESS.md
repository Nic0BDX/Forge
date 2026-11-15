# FORGE — suivi des cinq phases

- [x] Phase 1 : base CIQUAL officielle et journal nutrition (recherche, groupes, favoris, récents, grammes, aliments personnels).
- [ ] Phase 2 : repas recommandés calculés et estimation calorique indicative.
- [ ] Phase 3 : programmes référencés dans Atlas et validation des séances.
- [ ] Phase 4 : sprite SVG original et icônes des aliments et séances.
- [ ] Phase 5 : Coach IA local, repli calculé et documentation de test mobile.

Chaque phase : contrôles pertinents, mise à jour de ce fichier, un commit puis `git push origin main`.
Ne jamais effacer les données utilisateur ; conserver la compatibilité des sauvegardes et repas existants.

## Reprise

Arrêt après la phase 1 pour limiter le contexte. **Prochaine étape : phase 2**, sans refaire la phase 1.
Règles de travail : `rg` avant lecture, extraits seulement, patchs ciblés, tous les textes FR/EN dans le système existant, un commit et `git push origin main` par phase. Ne jamais effacer `forge_data_*` ni réinitialiser la session par migration. Résumé de phase en trois lignes maximum ; indiquer les tests impossibles.

## Phase 1 livrée et vérifiée

- `tools/build-foods.cjs` télécharge les XML officiels CIQUAL 2025 (DOI 10.57745/RDMHWY, V1) et vérifie leurs empreintes officielles. Cache non versionné : `tools/.ciqual-cache/`. Génération déterministe : 536 aliments, 158 517 octets dans `assets/foods.json`, 13 groupes, noms FR/EN officiels, valeurs pour 100 g. Seuils, traces et valeurs absentes restent `null`. Aucune estimation nutritionnelle. Documentation : `assets/SOURCES-NUTRITION.md`.
- `js/features/food-library.js` et `css/food-library.css` : chargement à la demande, recherche sans casse/accents, filtre, favoris/récents, aperçu des portions, aliments personnels, objectifs quotidiens et avertissement des totaux partiels. Entrées et types de repas historiques conservés. Les anciens aliments de démonstration restent dans le stockage mais sont exclus des nouveaux choix ; les variantes modifiées par l'utilisateur restent proposées. Les rappels whey sont conservés, les nouvelles prises sans étiquette ont des macros inconnues au lieu d'une estimation générique.
- Schéma compatible : `DB.meals` garde `kcal/p/c/f` et les quatre types FR ; nouveaux champs optionnels `foodId/source/group/sugars/saturates/fiber/salt`. `DB.foods` contient les aliments personnels (`source: 'user'`), sans copie de CIQUAL. Préférences dans `DB.nutrition.favorites/recent`. Validation et export/import acceptent les valeurs nutritionnelles `null` et les anciens formats. Écritures par copie + `commitUserDB`, erreur quota sans écrasement.
- Vérifiés : `node tools/build-foods.cjs`, `node tests/i18n-check.cjs`, `node tests/static-paths.cjs`, `node tests/nutrition-smoke.cjs`, `node tests/i18n-smoke.cjs` (ce dernier lance aussi `account-storage-smoke`). Chromium local, 390×844 et 1920×1080, captures inspectées, aucune erreur console. Tests nutrition : somme des portions, favoris/récents, rechargement, anciens repas, aliments personnels et valeurs absentes, quota, chargement différé, FR/EN, stockage d'archive intact.
- Environnement local de test : PowerShell, `FORGE_PLAYWRIGHT=C:/Users/sicar/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright`, Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`. Captures dans le dossier temporaire système : `forge-nutrition-390.png` et `forge-nutrition-1920.png`.
- Non testés : appareil mobile physique, Safari/iOS, site Vercel après redéploiement. Les fonctionnalités et tests propres aux phases 2 à 5 restent à réaliser.

## Exigences restantes

### Phase 2

40–60 repas composés d'identifiants de `foods.json` et de grammages ; totaux calculés exclusivement à partir des ingrédients (propager les valeurs inconnues). Filtres moment (dont avant/après séance), objectif (masse/perte/maintien), omnivore/végétarien ; ajout au journal. Estimation Mifflin-St Jeor à partir de données explicites du profil, demander les données manquantes sans les déduire de `bodyType`. Vérifier la formule dans une source fiable actuelle ; mention traduite « estimation indicative, pas un avis médical », aucun déficit extrême. Ajouter le test de somme des ingrédients.

### Phase 3

Créer `tools/check-templates.cjs` : échec si un exercice est absent d'`atlasRecords` (`js/features/exercise-atlas.js`) ou dupliqué dans une séance. Références par identifiant Atlas, noms affichés depuis Atlas FR/EN. Full body 3 jours, haut/bas 4 jours, push/pull/legs ; chaque programme en variantes sans matériel/haltères/salle. 5–8 exercices, 45–70 min, polyarticulaires d'abord, séries/répétitions/repos par niveau, filtres niveau/matériel/durée/jours. Conseil de double progression et suggestion avant/après séance issue de phase 2. Conserver `installTemplate`, `startWorkout` et tous les programmes existants.

### Phase 4

Sprite original `assets/icons/sprite.svg` avec `<symbol>/<use>`, `currentColor`, trait arrondi, pastille dégradée noir/bordeaux ; tailles 24/40/56, survol léger, `aria-hidden`, aucune image internet ni modification des GIF Atlas. Groupes alimentaires : volaille/viande/poisson/œuf/laitier/féculent/légumineuse/légume/fruit/oléagineux/huile/sucré/boisson. Icônes dédiées : poulet/œuf/riz/pâtes/pain/banane/pomme/brocoli/saumon/lait/fromage/yaourt/avocat/amandes/whey. Correspondance aliment → icône avec repli groupe. Séances : push/pull/jambes/full body/haut/bas/abdos/cardio/sans matériel/haltères/salle et groupes musculaires. Intégrer dans aliments, repas, séances et programmes ; test d'icône pour chaque aliment et séance.

### Phase 5

Lire les documentations officielles actuelles WebLLM/Transformers.js, choisir petit instruct quantifié FR/EN idéalement <1 Go, versions exactes pinnées. Librairie locale `assets/vendor/`, poids du CDN officiel du modèle. En-têtes Vercel uniquement si exigés, tester leurs effets. Détection WebGPU/mémoire, activation explicite avec taille/Wi-Fi/progression/prêt/cache/reprise/suppression ; aucun chargement au démarrage. Streaming, arrêt, réponse limitée et questions rapides. Contexte local ~300 tokens (séances, volume, poids, calories 7 j), langue de l'app, données fournies seulement, signaler les manques, aucun avis médical. Repli sans WebGPU : réponses calculées à partir des données locales. Tests sans WebGPU/états/zéro serveur applicatif, `tools/IA-TEST-MANUEL.md` pour téléphone sur Vercel ; préciser le matériel réellement testé et les limites.

## Validation finale après phase 5

`tests/i18n-check.cjs`, `tests/i18n-smoke.cjs`, `tests/static-paths.cjs`, `tests/nutrition-smoke.cjs`, `tools/check-templates.cjs`, nouveaux tests de somme des recettes et d'icônes. Ancien repas lisible, aucune erreur console, mobile 390×844 et bureau 1920×1080. Résumé final demandé : cinq lignes indiquant le réalisé et le restant.
