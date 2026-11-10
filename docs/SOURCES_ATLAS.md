# Catalogue Atlas Muscu intégré à Forge

Forge conserve les **1 324 fiches de l'index public Atlas**, avec leurs identifiants, leurs noms français et anglais. Le catalogue embarqué contient les muscles, le matériel et **7 710 consignes traduites**, disponibles sans appel API. **1 323 fiches possèdent un lien vers une démonstration animée** ; le GIF « Pont de Londres » (`bLyQokI`, ancien ID `0609`) manque dans la sauvegarde et reste explicitement indisponible.

Le mode `complete` du fichier JavaScript signifie que les 1 324 fiches sont présentes. Il ne signifie ni que les 1 324 animations sont disponibles, ni que tous les liens distants ont été testés depuis le navigateur.

## Sources et versions

| Contenu | Source figée |
| --- | --- |
| Identifiants, noms français/anglais | [Atlas Muscu, revue/index.json](https://github.com/AnTh0nY47/atlas-muscu/blob/9f53402c8eac88303a41320437d77012db335719/revue/index.json), publié le 26 septembre 2026 |
| Traductions des consignes | [Atlas Muscu, data/](https://github.com/AnTh0nY47/atlas-muscu/tree/1a4f2a4389a79447cc5b3a23511fe214c8deaf64/data), priorité à `fr-manuel.json`, puis `fr-cache.json` |
| Muscles, matériel, consignes anglaises | [Exercise GIFs Backup, exercises.csv](https://github.com/omercotkd/exercises-gifs/blob/ebf642cd90fdf73a6c73e7127e93b607b12c229e/exercises.csv) |
| Animations externes | [Exercise GIFs Backup, assets/](https://github.com/omercotkd/exercises-gifs/tree/ebf642cd90fdf73a6c73e7127e93b607b12c229e/assets), URL fixée au même commit |

Le dépôt de sauvegarde cite le jeu [Fitness Exercises with Animations](https://www.kaggle.com/datasets/edoardoba/fitness-exercises-with-animations/data). Atlas cite ExerciseDB comme source de ses données et animations. Aucun code applicatif Atlas n'a été copié dans Forge.

Les informations proviennent de ces snapshots et non d'une extraction actuelle de l'API. L'API `https://oss.exercisedb.dev/api/v1/exercises` était inaccessible depuis l'environnement de travail le 3 novembre 2026 : refus HTTP 403 du proxy. Son total actuel et sa pagination n'ont donc pas pu être vérifiés. Les URL des médias correspondent à des chemins réels dans le dépôt Git ; leur disponibilité HTTP depuis le réseau du visiteur peut varier.

## Rapprochement contrôlé

- **1 311 fiches** : correspondance unique sur le nom anglais exact.
- **12 fiches** : six noms possédant chacun deux variantes. Les variantes ont été départagées en comparant la première image et l'image médiane des GIF aux planches de revue Atlas.
- **1 fiche** : `stationary bike run` dans Atlas correspond à `stationary bike run v. 3` dans la sauvegarde ; la même comparaison visuelle confirme le mouvement.

Les 13 rapprochements visuels ont une erreur moyenne de 0,70 à 1,66 sur 255 après redimensionnement à 140 × 140 pixels. Les autres variantes produisent des erreurs de 19,5 à 38,8. Le montage a aussi été inspecté visuellement. La jointure est bijective : 1 324 identifiants Atlas distincts et 1 324 identifiants de sauvegarde distincts.

Les noms français sont ceux de l'index Atlas. Pour chaque étape, la traduction manuelle est prioritaire sur le cache ; aucune étape française manquante n'a été inventée. Toutes les fiches ont leurs consignes complètes en français et en anglais. Cela établit la complétude de l'import ; les indications d'entraînement restent celles des sources, sans prétendre à une révision technique de chaque mouvement.

[atlas-source-audit.json](atlas-source-audit.json) contient les compteurs exacts, empreintes SHA-256 des entrées, correspondances particulières et limites des vérifications.

## Vérification des animations

Les **1 323 chemins de GIF** sont présents dans l'arbre Git de la révision choisie. Treize GIF ont été réellement téléchargés par Git, décodés et contrôlés comme animations pour lever les ambiguïtés. Aucun téléchargement massif des animations n'a été effectué.

Le **10 novembre 2026**, trois GET HTTPS réels avec curl ont aussi renvoyé `200` et `image/gif` : `0656` (Pompe sur swiss ball, 252 569 octets), `0001` (Sit-up 3/4, 278 858 octets) et `0577` (Développé pectoraux machine, 391 676 octets). Pillow a décodé les trois animations : 360 × 360 pixels et 12 images chacune. Leurs octets et empreintes correspondent aux objets Git de la révision figée. Ces requêtes utilisent la configuration TLS et le proxy existants, sans interception ni désactivation de la vérification TLS. Ce contrôle porte sur **trois médias**, pas sur les 1 323 liens.

L'affichage distant dans **Chromium standard n'a pas été validé** : ce navigateur refuse le certificat du proxy de l'environnement (`ERR_CERT_AUTHORITY_INVALID`). Les contrôles d'interface utilisant le GIF témoin local et les trois téléchargements HTTPS ci-dessus constituent des vérifications distinctes. Le [rapport des médias distants](../tests/resultats-atlas-medias-live.json) conserve ces résultats et leurs limites. L'audit d'import généré reste inchangé pour préserver sa reproductibilité.

Le fichier de test `tests/fixtures/atlas-demo.gif` est une copie binaire exacte du GIF `assets/0656.gif` : fiche Atlas `tgryw5Y`, « Pompe sur swiss ball », 360 × 360 pixels, 12 images, 252 569 octets. SHA-256 : `bdbc14c2f05ef140cc95531a9f530bd02a02bb1e5dc840ff29c50e26514c92bb`. Il sert à contrôler l'affichage du lecteur dans les tests. Un test utilisant ce témoin local ne prouve pas l'accessibilité des 1 323 URL distantes.

## Attribution et licences

Crédits : **Atlas Muscu / ExerciseDB**, avec hébergement de sauvegarde **omercotkd/exercises-gifs**. Le dépôt Atlas inspecté ne comporte aucun fichier de licence. Le dépôt de sauvegarde comporte un fichier MIT, mais son README déclare explicitement que son auteur ne possède pas les contenus et que les droits appartiennent à leurs créateurs et au propriétaire du jeu de données. **Forge n'attribue donc pas une licence MIT aux GIF ni aux traductions Atlas.**

Les GIF sont chargés depuis leur hébergeur externe lors de l'ouverture d'une démonstration. Seul le témoin technique décrit ci-dessus est livré localement pour les tests. Les textes importés conservent la provenance documentée ici.

## Reproduire l'import

Prérequis : Git et Python 3.10+. Pillow est nécessaire uniquement avec `--verify-images`.

```bash
git clone --filter=blob:none --no-checkout https://github.com/AnTh0nY47/atlas-muscu.git /tmp/forge-atlas-source
git -C /tmp/forge-atlas-source fetch origin 9f53402c8eac88303a41320437d77012db335719
git clone --filter=blob:none --no-checkout https://github.com/omercotkd/exercises-gifs.git /tmp/forge-gif-source
python3 docs/import-atlas.py --atlas-repo /tmp/forge-atlas-source --backup-repo /tmp/forge-gif-source --import-date 2026-11-10
```

Les révisions figurent dans le script et sont figées. `--output-dir /chemin/temporaire` permet une reconstruction séparée avant comparaison. L'option `--verify-images` refait le contrôle visuel quantitatif des 13 correspondances ; elle ne récupère pas les 1 323 GIF.

Le script vérifie les décomptes, l'unicité et la bijection des identifiants, la présence des traductions, le manifeste des GIF et l'empreinte du témoin. Il échoue avant écriture si une de ces contraintes diverge. Il génère `js/data/atlas-exercises.js`, `docs/atlas-source-audit.json` et `tests/fixtures/atlas-demo.gif`. Les fiches, programmes et historiques déjà enregistrés dans Forge ne sont pas modifiés par cet import.

## Avis de licence du dépôt de sauvegarde

Texte du fichier `LICENSE` de `omercotkd/exercises-gifs`, reproduit pour conserver son avis de copyright. Comme précisé ci-dessus, le README du même dépôt décline la propriété des contenus ; cet avis ne suffit donc pas à attribuer une licence MIT aux animations ou aux traductions Atlas.

```text
MIT License

Copyright (c) 2026 omercotkd

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
