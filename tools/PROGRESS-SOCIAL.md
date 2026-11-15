# FORGE — communauté locale et suivi durable

L'utilisateur confirme un fonctionnement local avec communication volontaire de certaines données. Aucun backend ni annuaire global : invitations et mises à jour sont échangées entre appareils par fichier/code/lien de partage. Le fil et le classement reflètent les dernières données reçues, avec date de fraîcheur. Photos, poids et taille restent privés par défaut ; aucun export de données corporelles sans opt-in explicite. Les changements de confidentialité nécessitent une nouvelle transmission pour modifier une copie reçue.

- [x] 1. Amis, invitations, échanges signés/chiffrés et confidentialité.
- [ ] 2. Calendrier mois/semaine/jour, planification, détails et déplacement.
- [ ] 3. Bibliothèque de 60+ défis quotidiens, validation, XP, historique.
- [ ] 4. Responsive/accessibilité et PWA installable avec service worker prudent.
- [ ] 5. Badges par catégories/paliers, XP durable, classement équitable et plafonds.
- [ ] 6. Récapitulatif glissant de 30 jours, stories et partage d'image.
- [ ] 7. Données personnelles, unités, historique, IMC et estimations réutilisées.

Préserver l'authentification, les clés `forge_data_*`, les anciennes sauvegardes et les données existantes. Toutes les nouveautés UI passent par l'i18n FR/EN. Tests et commit/push par lot fonctionnel ; aucune donnée sociale de démonstration.

Lot 1 validé : cartes et invitations ECDSA, clés privées non extractibles dans IndexedDB, mises à jour et réactions entre amis chiffrées ECDH/HKDF/AES-GCM, import/export JSON ou code. Recherche dans les cartes reçues uniquement. Fil/profil filtrés à l'export et à la réception ; photos/avatar/poids/taille privés sans opt-in. Expiration des partages après sept jours et révocation par nouvel échange. Tests social-smoke à deux comptes isolés (invitation/acceptation, chiffrement, signature altérée refusée, corps non autorisé retiré, révocation et identité stable après rechargement), i18n-check, static-paths et i18n-smoke validés. Le classement sera raccordé au lot 5. Non testés : partage natif physique entre téléphones, Safari.
