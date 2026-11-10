# Forge — journal de l’intégration Atlas Muscu

**Jour 4 · 10 novembre 2026 · demande Atlas terminée et validée.**

Forge dispose désormais de **1 324 fiches Atlas**, avec noms français, **7 710 consignes françaises** et références de démonstration. La bibliothèque permet de chercher un exercice, filtrer les résultats, ouvrir sa fiche et l’ajouter à un programme. Les **30 exercices historiques Forge** sont conservés, ainsi que l’accueil animé et les autres fonctions existantes.

Livrable préparé : [Forge-Exercices-Atlas.zip](../livraisons/Forge-Exercices-Atlas.zip). Consulter aussi l’[aperçu autonome](../APERCU.html), le [tableau de bord](../AVANCEMENT.html) et le [plan Atlas](PLAN_ATLAS.md). Le responsable principal finalise l’archive et synchronise les documents officiels ; les archives précédentes restent conservées.

## Ce qui a changé et pourquoi

- **Catalogue étendu** : 1 324 fiches issues des sources Atlas complètent les 30 entrées Forge, sans fusion ambiguë de leurs noms ni suppression des identifiants `ex0` à `ex29`.
- **Bibliothèque utilisable dans Forge** : recherche, filtres, pagination, fiche avec muscles, matériel, consignes et démonstration, puis ajout à un programme. La présentation reste cohérente avec les cartes sombres et les accents du site.
- **Démonstrations avec états explicites** : 1 323 GIF sont présents dans la source examinée. La fiche **« Pont de Londres »** reste accessible malgré sa démonstration absente. Une erreur de média ne doit pas bloquer les consignes ou l’entraînement.
- **Compatibilité vérifiée** : les suites Atlas, régression, accueil, aperçu et sauvegardes ont été exécutées avant livraison ; les résultats sont détaillés ci-dessous.

Le README original Atlas a été lu en entier. Le dépôt de référence est figé au commit `1a4f2a4389a79447cc5b3a23511fe214c8deaf64`. Son annonce « plus de 1 500 mouvements » ne remplace pas le décompte réel de 1 324 fiches récupérées pour cette intégration.

## Tâches terminées au Jour 4

| Tâche | Responsable | Travail réalisé | État |
|---|---|---|---|
| X01 — sources, données et attributions | Développeur | Récupération, décompte, provenance, identifiants et limites des médias documentés | ✅ 10 novembre 2026 |
| X02 — bibliothèque, démonstrations et ajout aux séances | Développeur | Intégration après le contrat de données, composants du Designer et textes de Contenu | ✅ 10 novembre 2026 |
| X03 — tests et couverture de livraison | Testeur mobile | Contrôles sur les sources gelées, régression et preuves avant archive | ✅ 10 novembre 2026 |

Le Chef de projet tient le plan et le journal. Le responsable principal gère README, feuille de route officielle, `POINT_DE_REPRISE.md`, `AVANCEMENT.html`, archive et publication. Les contributions du Designer et de Contenu à X02 ne sont pas comptées comme des tâches supplémentaires.

## Annonce d’avancement

**Avancement global : ████████████░░░░ 76 % — 29/38 tâches terminées.**

| Agent | Terminées / total | Pourcentage | Barre |
|---|---:|---:|---|
| Chef de projet | 4/5 | 80 % | █████████████░░░ |
| Designer UI/UX | 5/6 | 83 % | █████████████░░░ |
| Développeur | 11/14 | 79 % | █████████████░░░ |
| Testeur mobile | 6/9 | 67 % | ███████████░░░░░ |
| Contenu & idées | 3/4 | 75 % | ████████████░░░░ |

Calcul : tâches terminées ÷ tâches totales × 100, arrondi à l’entier ; aucune part de tâche en cours n’est comptée. L’ajout des trois tâches Atlas avait donné 26/38 = 68 % ; leur validation porte le total à 29/38 = 76 %.

- ✅ **Terminées dans cette mission** : X01 et X02 — Développeur ; X03 — Testeur mobile, au Jour 4, le 10 novembre.
- 🔄 **Toujours ouvertes hors mission Atlas** : C03 — Contenu ; V03 — Testeur mobile. Leur poursuite attend une nouvelle instruction.
- ⬜ **À faire hors mission Atlas** : U04 — Designer ; P04 — Chef de projet.
- ⬜ **Bloquées comme auparavant** : D08, D09 et D10 — Développeur ; T04 et T06 — Testeur mobile. L’intégration Atlas ne résout pas ces dépendances externes.

## Tests et preuves

| Suite | Résultat | Rapport |
|---|---:|---|
| Catalogue et parcours Atlas | **74/74** | [Résultats Atlas](../tests/resultats-atlas.json) |
| Régression générale | **33/33**, sur **342 états**, aucun débordement | [Résultats régression](../tests/resultats-atlas-regression.json) |
| Accueil animé | **66/66** | [Résultats accueil](../tests/resultats-atlas-accueil.json) |
| Aperçu autonome | **22/22** | [Résultats aperçu](../tests/resultats-atlas-apercu.json) |
| Sauvegardes et imports | **70/70** | [Résultats sauvegardes](../tests/resultats-atlas-sauvegardes.json) |

**Total : 265 contrôles réussis, 0 échec, 0 erreur JavaScript.** Les résultats ont été transmis par le responsable principal après les tests sur les sources gelées.

La couverture conserve les anciens programmes et exercices personnalisés, les parcours de séance, séries et historique, les imports, l’accueil avec corps animé, les activités et pas, la nutrition, les souvenirs, l’avant/après, le calendrier, le profil, les thèmes et accents. Les rubriques connexion, coach et premium restent présentes avec leurs limites existantes ; aucun nouveau service distant n’est annoncé comme connecté.

Ces suites contrôlent les parcours et les états d’erreur des démonstrations. Elles ne constituent pas une vérification réseau exhaustive des 1 323 GIF. Trois téléchargements HTTPS standards supplémentaires ont réussi et les GIF ont été décodés (rapport complémentaire ci-dessous). La présence des fichiers dans la source ne prouve pas leur disponibilité permanente chez un hébergeur tiers.

## Provenance, médias et limites

Atlas attribue ses données et animations à ExerciseDB. Les noms et consignes françaises proviennent des sources Atlas et mêlent traductions manuelles et automatiques ; ils ne sont pas présentés comme intégralement relus par un professionnel. Les métadonnées s’appuient aussi sur une sauvegarde CSV dans Git. Ces origines doivent rester distinguées dans les attributions.

Aucun fichier de licence n’a été identifié à la racine du dépôt Atlas lors de sa lecture. Une éventuelle mention MIT dans une source de code ou de métadonnées ne suffit pas à établir les conditions des GIF. La licence propriétaire de Forge ne couvre pas automatiquement les contenus externes ; seules les conditions réellement trouvées doivent être reproduites.

Les démonstrations distantes nécessitent Internet. Le catalogue et les consignes restent consultables localement ; l’aperçu autonome ne promet pas les GIF hors ligne. La démonstration manquante de **« Pont de Londres »** est une limite connue et affichée. Aucun exercice n’a été supprimé pour masquer cette absence.

## Trois pistes pour une demande ultérieure

1. Rechercher une démonstration adaptée pour « Pont de Londres » et en vérifier la provenance avant ajout.
2. Relire par lots les traductions françaises ambiguës, en conservant leur correspondance avec le texte source.
3. Ajouter des favoris locaux pour retrouver rapidement ses exercices fréquents.

Ces pistes ne sont pas engagées et ne modifient pas le total des 38 tâches. **La demande Atlas est terminée ; les autres finitions restent en attente.**


Contrôle distant complémentaire : trois GET HTTPS standards ont retourné trois GIF décodables, identiques aux objets Git. Le rendu HTTP distant dans Chromium standard reste non validé (certificat du proxy) ; aucun résultat obtenu avec une exception TLS n’est retenu. Voir [le rapport](../tests/resultats-atlas-medias-live.json). Cela ne vérifie pas les 1 323 hébergements.
