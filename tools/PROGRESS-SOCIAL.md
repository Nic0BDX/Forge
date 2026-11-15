# FORGE — communauté locale et suivi durable

L'utilisateur confirme un fonctionnement local avec communication volontaire de certaines données. Aucun backend ni annuaire global : invitations et mises à jour sont échangées entre appareils par fichier/code/lien de partage. Le fil et le classement reflètent les dernières données reçues, avec date de fraîcheur. Photos, poids et taille restent privés par défaut ; aucun export de données corporelles sans opt-in explicite. Les changements de confidentialité nécessitent une nouvelle transmission pour modifier une copie reçue.

- [x] 1. Amis, invitations, échanges signés/chiffrés et confidentialité.
- [x] 2. Calendrier mois/semaine/jour, planification, détails et déplacement.
- [x] 3. Bibliothèque de 60+ défis quotidiens, validation, XP, historique.
- [x] 4. Responsive/accessibilité et PWA installable avec service worker prudent.
- [ ] 5. Badges par catégories/paliers, XP durable, classement équitable et plafonds.
- [ ] 6. Récapitulatif glissant de 30 jours, stories et partage d'image.
- [ ] 7. Données personnelles, unités, historique, IMC et estimations réutilisées.

Préserver l'authentification, les clés `forge_data_*`, les anciennes sauvegardes et les données existantes. Toutes les nouveautés UI passent par l'i18n FR/EN. Tests et commit/push par lot fonctionnel ; aucune donnée sociale de démonstration.

Lot 1 validé : cartes et invitations ECDSA, clés privées non extractibles dans IndexedDB, mises à jour et réactions entre amis chiffrées ECDH/HKDF/AES-GCM, import/export JSON ou code. Recherche dans les cartes reçues uniquement. Fil/profil filtrés à l'export et à la réception ; photos/avatar/poids/taille privés sans opt-in. Expiration des partages après sept jours et révocation par nouvel échange. Tests social-smoke à deux comptes isolés (invitation/acceptation, chiffrement, signature altérée refusée, corps non autorisé retiré, révocation et identité stable après rechargement), i18n-check, static-paths et i18n-smoke validés. Le classement sera raccordé au lot 5. Non testés : partage natif physique entre téléphones, Safari.

Lots 2–3 validés : calendrier mois/semaine/jour, navigation tactile et clavier, création/édition/déplacement (glisser-déposer PC), états prévu/repos/fait/manqué, liens vers le programme, détails réels (durée/volume/photos privées/défis/badges). Marquer manuellement une séance faite n'ajoute ni séance réelle ni XP. Bibliothèque de 60 défis répartis en six catégories, choix déterministe par date sans répétition consécutive (800 jours testés), difficulté figée pour la journée, validation unique et récompense plafonnée à 120 XP/jour. Le journal d'XP historique n'est pas diminué. Les nouvelles transactions relisent le dernier carnet enregistré pour préserver les changements d'un autre onglet. calendar-smoke, challenges-smoke et i18n-smoke validés, persistance après rechargement et FR/EN ; mobile 390×844 et bureau 1920×1080. Le plafond global des anciennes récompenses sera raccordé au lot 5.

Lot 4 validé : service worker à cache versionné (`tools/build-sw.cjs` à relancer après chaque modification de l'app), manifest existant conservé, installation depuis les réglages. Cache de fichiers statiques uniquement, aucune API/donnée personnelle/poids IA/vidéo ; base d'aliments, recettes et images mises en cache uniquement lors de leur utilisation. Mise à jour des anciennes versions limitée aux caches `forge-shell-*`, sans effacer d'autres caches ni le carnet. pwa-smoke vérifie le démarrage/calendrier hors ligne avec session conservée ; nutrition-smoke confirme le chargement différé. Non testé : installation native sur téléphone physique/iOS ; les instructions sont intégrées.
