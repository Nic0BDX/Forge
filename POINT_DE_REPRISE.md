# Forge — Point de reprise

**Mode : PAUSE demandée par le propriétaire.** Attendre une nouvelle demande avant de poursuivre.
Jour en cours : **4**. Dernier checkpoint : **2026-11-10T18:54:43+01:00** (Europe/Paris).
État du jour : **en cours**.

## Tâches terminées — ne pas les refaire

**29/38 tâches terminées (76 %).**

- Jour 1 : P01, P02, P03, U01, U02, D01, D02, D03, D04, T01, T02, T03, C01, C02, C04.
- Jour 2 : P05, D05, D06.
- Jour 3 : U03, D07, T05.
- Jour 4 : V01, V02, A01, A02, A03, X01, X02, X03.

## Travail exactement en cours

**Tâche : Aucune : choisir la prochaine tâche utile.**

ATLAS TERMINÉ ET VALIDÉ : X01, X02 et X03 livrées. 1324 fiches Atlas, 7710 consignes FR, 1323 liens GIF vérifiés dans Git ; Pont de Londres reste sans animation. Les 30 anciens exercices sont conservés, 15 avec correspondance exacte de démonstration. Recherche FR/EN, filtres, pagination, ajout au jour choisi, démonstration pendant séance et catalogId persistant. Validation : 74 contrôles Atlas, 33 de régression sur 342 états, 66 accueil, 22 aperçu et 70 sauvegardes = 265 réussis, aucun échec. Trois GET HTTPS de GIF réels vérifiés en plus ; rendu distant Chromium standard non validé à cause du certificat du proxy. Aucun téléphone physique ni file:// testé. ZIP Forge-Exercices-Atlas.zip et copie Forge-Jour-4-Atlas.zip ; APERCU autonome avec GIF externes. Autres finitions en attente ; ne pas refaire accueil A01–A03 ni Atlas X01–X03.

Les étapes ci-dessus décrivent les fichiers réellement préparés. Une tâche en cours ne donne aucun crédit partiel.

## Prochaine action

**Prochaine tâche : V03**

Lire docs/JOURNAL_ATLAS.md et TESTS_ATLAS.md. Cette demande est terminée. Attendre la prochaine instruction avant de reprendre C03, U04, V03 globale ou P04. Propositions : GIF manquant, relecture des traductions, favoris. Reprendre le point de reprise sans refaire les tâches validées.

## Preuves du dernier checkpoint

- `tests/resultats-atlas.json` · SHA-256 `309b87804959acf24150fead282bcfafdcc8b89cbc08cdd6c43837cc8def1bd5`
- `tests/resultats-atlas-regression.json` · SHA-256 `d15b713d70b991e029fcd0a4a5c4ac54a3edefb797b991137c3d0e0b918c2d20`
- `tests/resultats-atlas-accueil.json` · SHA-256 `880ecc3b79e1f859607d75213f220cea95f38743ec0c7bf00ccf05cd16a6b15e`
- `tests/resultats-atlas-apercu.json` · SHA-256 `8e9a6dedfa957c2bdef9bb71afe61654e9b111ab9375da08548661e74d5eb2cb`
- `tests/resultats-atlas-sauvegardes.json` · SHA-256 `24daf63a7c1f7a628fd88b332ee43baaad978f021cf420552ab57e0d8d5e04f9`
- `tests/resultats-atlas-medias-live.json` · SHA-256 `1cefc3e369fcf9ea4ec02ea4e630a4b2a94b0902621296f9c1dffdf49277069e`

## Archives et procédure de reprise

- ZIP courant : `Forge-Actuel.zip` dans le dossier des livrables (`/workspace/artifacts` dans cet environnement).
- Chaque ZIP inclut `Forge/ARCHIVE_MANIFEST.json` avec les empreintes des fichiers. Le fichier `.sha256` voisin vérifie le ZIP entier.
- Les archives `Forge-Jour-N.zip` des journées clôturées sont conservées ; aucune n’est écrasée.
- Avant de commencer la journée suivante, envoyer le message de clôture : lien du ZIP quotidien validé, progression globale et par agent, tâches du jour/en cours/restantes, blocages, journal, AVANCEMENT.html et trois améliorations prévues.
- Si une tâche est encore en cours et non validée, mettre à jour la description de reprise sans publier les sources ; le ZIP courant reste la dernière version testée.
- Si `docs/.checkpoint-pending.json` existe, une publication a été interrompue : inspecter puis exécuter `python3 docs/checkpoint.py --recover` avant toute nouvelle tâche.
- À « reprends » ou « continue », lire ce fichier, `docs/checkpoint.json` et la feuille de route. Ne pas refaire les tâches terminées. Reprendre les étapes indiquées.
- Après chaque tâche testée : appeler `docs/checkpoint.py --complete ID ... --evidence RAPPORT`. Le mode pause reste prioritaire : attendre une nouvelle demande avant de poursuivre.
- Ne pas lancer un checkpoint pendant que d’autres agents modifient les sources ; le script refuse une modification concurrente détectée.
- Quand toutes les tâches sont effectivement terminées, écrire une nouvelle feuille d’au moins 15 tâches utiles. Ne pas déclarer terminés les services indisponibles.

## Blocages externes conservés

- D08 : Choix du service de comptes et accès nécessaires indisponibles.
- D09 : Fournisseur IA, serveur et accès nécessaires indisponibles.
- D10 : Offre, tarifs et compte prestataire de paiement non fournis.
- T04 : Aucun appareil physique iOS ou Android attaché.
- T06 : Dépend des intégrations D08, D09 et D10.

## Environnement

`python3 -m http.server 8080 --bind 127.0.0.1` depuis la racine. Tests Playwright et Chromium (`/usr/bin/chromium`). Le navigateur géré bloque `file://` ; utiliser HTTP sans contourner cette règle.
