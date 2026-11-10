# Forge — intégration du catalogue Atlas Muscu

**Jour 4 · actualisation du 10 novembre 2026 · demande limitée aux exercices et à leurs démonstrations.** Le propriétaire demande d’intégrer [Atlas Muscu](https://github.com/AnTh0nY47/atlas-muscu) dans Forge. Le travail part du carnet existant et conserve l’accueil animé déjà livré. Les autres finitions et services distants ne sont pas repris automatiquement.

**Demande Atlas terminée : X01, X02 et X03 validées le 10 novembre 2026, au Jour 4.** Ce plan conserve la répartition et les critères d’acceptation ; le [journal Atlas](JOURNAL_ATLAS.md) donne les résultats et les limites. Le responsable principal synchronise les documents officiels et prépare l’archive à partir des sources validées.

## État de départ

Avant cette demande, le README, `POINT_DE_REPRISE.md` et `docs/roadmap.json` indiquaient **26 tâches terminées sur 35, soit 74 %**, au Jour 4. A01, A02 et A03 sont livrées : ne pas refaire l’accueil animé. La bibliothèque de départ contient **30 exercices** avec identifiants `ex0` à `ex29`. Ils sont conservés comme entrées historiques distinctes ; les **1 324 fiches Atlas** viennent en complément et ne doivent pas écraser leurs références. Les programmes, séances, séries, records et historiques existants doivent rester utilisables après intégration.

Le dépôt Atlas examiné est figé au commit **`1a4f2a4389a79447cc5b3a23511fe214c8deaf64`**. Son README annonce plus de 1 500 mouvements, avec démonstrations animées, muscles, matériel et consignes. Il précise que les données et animations proviennent d’**ExerciseDB**, que les images restent hébergées chez ce fournisseur et que les traductions françaises mélangent corrections manuelles et traduction automatique.

Le constat de récupération transmis par le responsable des données est de **1 324 fiches**, avec leurs noms français et **7 710 consignes françaises** issues des sources Atlas. Les métadonnées proviennent d’une sauvegarde CSV dans Git. **1 323 GIF sont réellement présents dans la source examinée ; la démonstration de « Pont de Londres » manque.** Ce décompte est distinct de l’annonce « plus de 1 500 » du README Atlas. Le catalogue intégré et les parcours couverts ont été validés par les suites listées ci-dessous. « Tous les exercices » signifie ici **toutes les fiches effectivement disponibles dans la source retenue**, pas une couverture universelle de tous les mouvements de musculation.

## Trois tâches, dans l’ordre

| ID | Priorité | Responsable | Travail et critères d’acceptation | Dépendance | État au 10 novembre |
|---|---|---|---|---|---|
| X01 | P0 | Développeur — données | Identifier la source exacte, récupérer le catalogue complet, conserver les identifiants stables, normaliser muscles/matériel et consignes, contrôler les traductions disponibles et les liens de démonstration. Livrer un décompte vérifiable, la provenance, la date et le commit de référence, les attributions et les conditions effectivement trouvées. Ne pas inventer une licence absente. | Lecture du dépôt et accès aux données | ✅ Validée — Jour 4, 10 novembre 2026. Décompte et provenance documentés ; GIF manquant signalé. |
| X02 | P0 | Développeur — intégration | Intégrer le catalogue dans la bibliothèque Forge avec recherche française et anglaise, filtres, liste paginée ou chargement progressif, fiche avec démonstration et consignes, et ajout à une séance. Garder les trente exercices historiques et leur compatibilité. Les démonstrations externes ont un état de chargement et un message utile en cas d’échec. | Contrat de données X01, puis styles du Designer | ✅ Validée — Jour 4, 10 novembre 2026. Catalogue et parcours intégrés ; compatibilité couverte par les tests. |
| X03 | P0 | Testeur mobile | Contrôler le nombre de fiches, les identifiants, la recherche, les filtres, la pagination, les démonstrations, l’ajout aux programmes et la persistance. Vérifier les anciens carnets et les parcours de séance, les erreurs réseau, les petits écrans et l’aperçu autonome. Produire les preuves avant la nouvelle archive et la publication. | Gel du catalogue, des styles et de X02 | ✅ Validée — Jour 4, 10 novembre 2026. 265 contrôles réussis, aucun échec ni erreur JavaScript. |

Les trois tâches sont comptabilisées après validation de leurs preuves, sans crédit partiel. Les archives précédentes restent conservées.

## Répartition sans chevauchement

1. **Développeur — données** examine et récupère la source dans un dossier temporaire. Il fixe un contrat de données avec le responsable principal avant de produire les fichiers intégrés.
2. **Contenu & idées** relit les noms et consignes disponibles, signale la part de traduction automatique et prépare les textes de chargement, d’absence et de provenance. Il ne remplace pas les consignes par des recommandations improvisées.
3. **Designer UI/UX** prépare les composants de la bibliothèque dans le style noir/verre/citron, avec sept accents. Il travaille sur son fichier CSS dédié après accord sur le balisage ; il ne modifie ni les données ni les fonctions de sauvegarde.
4. **Développeur — intégration / responsable principal** relie les données et les composants aux fonctions Forge. Il préserve les identifiants du carnet et décide explicitement des correspondances entre anciens et nouveaux exercices, sans fusion automatique ambiguë des noms.
5. **Testeur mobile** prépare les assertions pendant l’intégration, puis teste sur les sources gelées. Les défauts constatés reviennent au propriétaire du fichier ; les suites pertinentes sont relancées après correction.
6. **Chef de projet / responsable principal** vérifie la couverture, met à jour README, journal, feuille de route, `AVANCEMENT.html` et `POINT_DE_REPRISE.md`, puis produit l’archive validée et synchronise GitHub. Aucun agent ne publie pendant qu’un autre écrit encore dans les sources.

## Compatibilité conservée et couverte

- Les trente exercices initiaux et les identifiants déjà enregistrés restent résolus. Un nouveau catalogue ne doit pas renommer silencieusement un exercice utilisé par un programme, une séance ou un record.
- Les noms personnalisés restent acceptés, même sans correspondance dans Atlas. L’absence de démonstration n’empêche pas de suivre une séance.
- L’ajout d’un exercice respecte le programme et le jour choisis, n’écrase pas un brouillon actif et ne détruit aucune série, charge, répétition, durée ou donnée d’historique.
- Les sauvegardes antérieures restent importables. Un identifiant de catalogue éventuellement ajouté doit être facultatif pour les anciens carnets et validé lorsqu’il est présent.
- Les autres rubriques, l’accueil animé, les sept accents, les thèmes et la séparation entre démo et carnet réel restent fonctionnels.

## Démonstrations et fonctionnement sans réseau

Les médias référencés par Atlas sont des animations attribuées à ExerciseDB. La récupération actuelle s’appuie également sur une sauvegarde Git ; la provenance précise de chaque ensemble doit rester documentée. L’intégration doit distinguer **catalogue et consignes disponibles localement** d’une **démonstration distante qui nécessite Internet**. L’aperçu HTML ne doit pas annoncer que tous les GIF sont embarqués ou disponibles hors ligne s’ils ne le sont pas.

La bibliothèque doit rester utilisable si un média échoue : nom, muscles, matériel, consignes et ajout à la séance restent présents. Prévoir un message clair et une action de réessai ; ne pas laisser un chargement sans fin. Les milliers de GIF ne doivent pas être téléchargés simultanément à l’ouverture de la liste. La résolution et la fluidité de la source gratuite ne doivent pas être présentées comme des vidéos haute définition.

La fiche « Pont de Londres » reste dans le catalogue, avec un état explicite de démonstration indisponible. Il ne faut ni supprimer l’exercice ni afficher une animation différente pour combler cette absence. Les 1 323 fichiers présents dans la source ne constituent pas à eux seuls 1 323 parcours navigateur validés.

Les suites navigateur valident les parcours de démonstration et leurs états d’erreur. Elles ne constituent pas un téléchargement réel exhaustif des 1 323 GIF distants. Trois GIF ont aussi été téléchargés en HTTPS standard et décodés avec succès (rapport complémentaire ci-dessous). Cet échantillon ne prouve pas la disponibilité permanente de tous les liens.

## Provenance et attributions

Documenter séparément le dépôt Atlas Muscu, le fournisseur ExerciseDB, les données récupérées et les traductions utilisées. Le dépôt examiné ne présente pas de fichier de licence identifié à sa racine lors de cette lecture ; cette observation ne doit pas être transformée en affirmation de domaine public. La licence propriétaire de Forge reste conservée et ne doit pas être présentée comme couvrant les contenus externes. Une éventuelle licence MIT du code ou d’une sauvegarde de métadonnées ne prouve pas qu’elle couvre les GIF : les conditions des données, traductions et animations doivent être distinguées, avec leur source et les limites effectivement constatées.

Le code de l’application Atlas n’a pas besoin d’être recopié pour intégrer ses données et démonstrations dans l’architecture existante de Forge. Les mentions de provenance utiles figurent dans les documents du projet et dans la bibliothèque, sans afficher des détails d’implémentation inutiles dans les parcours d’entraînement.

## Avancement après validation

L’ajout de X01, X02 et X03 a porté la feuille de route à **38 tâches**, soit **26/38 = 68 %** avant validation. Les trois tâches sont maintenant validées : **29/38 = 76 %**.

**Avancement global : ████████████░░░░ 76 %.**

| Agent | Avant ajout | Après ajout, avant validation | Après validation des trois tâches |
|---|---:|---:|---:|
| Chef de projet | 4/5 | 4/5 | 4/5 |
| Designer UI/UX | 5/6 | 5/6 | 5/6 |
| Développeur | 9/12 | 9/14 | 11/14 |
| Testeur mobile | 5/8 | 5/9 | 6/9 |
| Contenu & idées | 3/4 | 3/4 | 3/4 |

Formule : tâches terminées ÷ tâches totales × 100, arrondie à l’entier. Les contributions de coordination, de design et de contenu sont attribuées dans l’ordre de travail ci-dessus ; elles ne créent pas artificiellement des tâches terminées supplémentaires.

## Preuves de validation

| Suite | Résultat | Rapport |
|---|---:|---|
| Catalogue et parcours Atlas | 74/74 | [Résultats Atlas](../tests/resultats-atlas.json) |
| Régression générale | 33/33, 342 états, aucun débordement | [Résultats régression](../tests/resultats-atlas-regression.json) |
| Accueil animé | 66/66 | [Résultats accueil](../tests/resultats-atlas-accueil.json) |
| Aperçu autonome | 22/22 | [Résultats aperçu](../tests/resultats-atlas-apercu.json) |
| Sauvegardes et imports | 70/70 | [Résultats sauvegardes](../tests/resultats-atlas-sauvegardes.json) |

**Total : 265 contrôles réussis, 0 échec et 0 erreur JavaScript.** Ces résultats ont été transmis par le responsable principal après les tests sur les sources gelées. Ils ne certifient pas une disponibilité réseau permanente des médias tiers.

## Hors périmètre et fin de mission

C03, U04, V03 globale et P04 restent ouvertes. D08, D09, D10, T04 et T06 conservent leurs blocages existants. Cette demande ne vaut pas intégration d’un coach IA, d’un service de paiement ou de comptes distants.

La demande Atlas est terminée. Le livrable préparé est [Forge-Exercices-Atlas.zip](../livraisons/Forge-Exercices-Atlas.zip), avec l’[aperçu autonome](../APERCU.html), les preuves et les limites documentées. Le [tableau de bord](../AVANCEMENT.html) et les documents officiels sont synchronisés par le responsable principal. Les archives antérieures sont conservées. Les autres finitions restent en attente de la prochaine instruction.

## Trois améliorations futures proposées

Ces propositions ne sont pas ajoutées au périmètre ni au calcul actuel :

1. **Compléter la démonstration manquante de « Pont de Londres »** si une source adaptée et ses conditions d’utilisation peuvent être identifiées ; conserver l’état indisponible en attendant.
2. **Relire les traductions françaises par lots ciblés**, en commençant par les noms et consignes ambigus, avec conservation du texte source pour vérifier les corrections.
3. **Ajouter des favoris locaux dans la bibliothèque**, pour retrouver ses mouvements fréquents sans modifier les séances ni les programmes enregistrés.


Contrôle distant complémentaire : trois GET HTTPS standards ont retourné trois GIF décodables, identiques aux objets Git. Le rendu HTTP distant dans Chromium standard reste non validé (certificat du proxy) ; aucun résultat obtenu avec une exception TLS n’est retenu. Voir [le rapport](../tests/resultats-atlas-medias-live.json). Cela ne vérifie pas les 1 323 hébergements.
