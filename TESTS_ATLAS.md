# Forge — validation Atlas Muscu

10 novembre 2026 · Jour 4 · 265 contrôles réussis, aucun échec.

| Suite | Résultat | Preuve |
|---|---:|---|
| Bibliothèque, démonstrations, séance et mobile | 74/74 | [resultats-atlas.json](tests/resultats-atlas.json) |
| Régression applicative, 342 états | 33/33 | [resultats-atlas-regression.json](tests/resultats-atlas-regression.json) |
| Accueil animé et activité | 66/66 | [resultats-atlas-accueil.json](tests/resultats-atlas-accueil.json) |
| Aperçu autonome et isolation des données | 22/22 | [resultats-atlas-apercu.json](tests/resultats-atlas-apercu.json) |
| Sauvegardes, migration et erreurs de stockage | 70/70 | [resultats-atlas-sauvegardes.json](tests/resultats-atlas-sauvegardes.json) |

Atlas vérifie les 1 324 identifiants, les 30 anciens exercices, les 1 354 fiches via pagination exhaustive, la recherche française/anglaise et sans accents, les filtres combinés, les consignes, le chargement du GIF, son erreur et son réessai, l’exercice sans média, l’ajout au jour choisi, les doublons et les alias, la panne de quota, le rechargement, l’import et l’export, la séance personnalisée, le brouillon et l’historique. Les séries, charges et le repos restent identiques avant et après la consultation d’une démonstration.

Le GIF fonctionnel est un vrai fichier source, servi par interception contrôlée pour rendre le test reproductible. Les tests vérifient aussi la panne réseau ; ils ne déclarent pas avoir téléchargé les 1 323 animations. La provenance, le manifeste Git et les limites du catalogue sont documentés dans [SOURCES_ATLAS.md](docs/SOURCES_ATLAS.md).

L’interface Atlas a été vérifiée à 320, 390, 768 et 1 280 px dans les deux thèmes : aucune coupure horizontale, boutons et formulaires d’au moins 44 px. L’aperçu conserve fiches et consignes sans réseau et isole les données fictives du carnet réel. Captures : [bibliothèque mobile](tests/captures-atlas/atlas-bibliotheque-390.png), [bibliothèque desktop](tests/captures-atlas/atlas-bibliotheque-1280.png), [fiche mobile](tests/captures-atlas/atlas-fiche-390.png), [fiche desktop](tests/captures-atlas/atlas-fiche-1280.png).

Les rapports Atlas et accueil enregistrent les empreintes des sources et de l’aperçu avant/après pour contrôler le gel. Chromium de bureau avec émulation de tailles : aucun téléphone physique testé. L’ouverture directe file:// est bloquée par le navigateur géré ; tests HTTP et rendu autonome sans réseau effectués sans contourner cette règle.

Trois GET HTTPS standards supplémentaires ont réussi : GIF 0656, 0001 et 0577, HTTP 200, décodage 360 × 360 / 12 images, empreintes identiques aux objets Git. [Rapport distant](tests/resultats-atlas-medias-live.json). Le navigateur de test standard refuse le certificat du proxy : son rendu distant reste non validé ; le rendu du GIF témoin et les erreurs réseau sont couverts par les 74 contrôles.

## Reproduire

Lancer `python3 -m http.server 8080 --bind 127.0.0.1` à la racine. Prérequis de test : Node, Playwright et Chromium. L’application elle-même n’a pas de dépendance à installer.

```bash
python3 preview/build-standalone.py
FORGE_TEST_OUTPUT=/tmp/forge-atlas node tests/atlas-smoke.cjs
FORGE_TEST_LABEL=atlas-regression FORGE_TEST_OUTPUT=/tmp/forge-atlas-regression node tests/mobile-smoke.cjs
FORGE_TEST_OUTPUT=/tmp/forge-atlas-home node tests/home-video-smoke.cjs
FORGE_ARTIFACTS=/tmp/forge-atlas-preview node tests/preview-smoke.cjs
FORGE_RESILIENCE_SCOPE=D06 FORGE_TEST_OUTPUT=/tmp/forge-atlas-backup node tests/resilience-smoke.cjs
```
