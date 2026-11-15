# Coach local — vérification sur téléphone et Vercel

Adresse : https://forge-livid-nine.vercel.app/ (HTTPS). Utiliser un compte de test ou exporter son carnet avant les essais ; ne jamais effacer le stockage du site pour tester le modèle.

## Versions et provenance

- Bibliothèque : **@mlc-ai/web-llm 0.2.88**, Apache-2.0, copie exacte du paquet npm dans `assets/vendor/webllm-0.2.88/webllm.js`. Licence, empreintes SHA-256 et liste des fichiers dans `forge-vendor.json` du même dossier.
- Modèle : **mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC**, révision immuable **9bd564b064631febf14deadcac492efb761d60c3**. Poids et tokenizer téléchargés uniquement depuis ce dépôt Hugging Face et ses redirections CDN officielles. Modèle Qwen Apache-2.0 ; fiche de l'éditeur : https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct (français et anglais annoncés).
- WASM local : `Qwen2-1.5B-Instruct-q4f16_1_cs1k-webgpu.wasm`, dépôt officiel `mlc-ai/binary-mlc-llm-libs`, commit **146ed9cd4b4062e967b017fd2291f7106b50599f**, chemin `web-llm-models/v0_2_87/base/`. Cette bibliothèque est celle référencée par le registre de WebLLM 0.2.88 pour ce modèle.
- Téléchargement maximal affiché : **environ 900 Mo**, incluant bibliothèque, WASM, index, poids et tokenizer ; les caches déjà présents réduisent ce volume. Les 30 shards de poids représentent environ 868 Mo décimaux, auxquels s'ajoutent les autres fichiers. La valeur exacte des artefacts figure dans le manifeste. La consommation mémoire GPU de référence du registre est 1629,75 Mo ; contexte limité ici à 2048 tokens. `navigator.deviceMemory` connu inférieur à 4 Go déclenche le repli ; si la mémoire n'est pas exposée, l'activation reste un essai explicite.
- Documentation officielle consultée : https://webllm.mlc.ai/docs/user/basic_usage.html et https://webllm.mlc.ai/docs/user/api_reference.html. API employées : `CreateWebWorkerMLCEngine`, `initProgressCallback`, flux `chat.completions.create`, `interruptGenerate`, `unload`. Cache backend : Cache Storage (`cache`). La suppression parcourt uniquement les URL de cette révision et du WASM local, sans requête réseau ni suppression des autres caches.
- **Aucun COOP/COEP ajouté** : le runtime WebGPU en Worker utilisé ne dépend ni de SharedArrayBuffer ni de threads WASM. Le test d'inférence réel passe sans isolation cross-origin. Les en-têtes existants du manifeste et les autres ressources restent inchangés.

## Essais sur le téléphone

1. Ouvrir l'application, se connecter, visiter l'accueil. Aucun poids, WASM ou module WebLLM ne doit être demandé avant une action explicite sur le Coach. Les icônes SVG ne font aucune requête propre.
2. Ouvrir « Coach IA ». Sans WebGPU, sans `shader-f16` ou avec mémoire insuffisante : message traduit et bilans calculés disponibles. Vérifier que les bilans correspondent au carnet (dernière séance, volume sur 7 jours, dernier poids, moyenne des jours avec calories connues). Des jours absents ne valent jamais zéro ; les données partielles sont signalées.
3. Sur appareil compatible, en Wi-Fi, toucher « Activer le Coach IA ». Vérifier taille annoncée, progression, absence de gel de l'interface et état « prêt ». Une autorisation de stockage persistant peut être refusée par le navigateur : le message doit l'indiquer. Ne pas confondre la mémoire annoncée de l'appareil et la mémoire GPU réellement disponible.
4. Interrompre le réseau pendant le téléchargement, puis rétablir la connexion et reprendre l'activation. Les fichiers entièrement reçus doivent être réutilisés ; un shard interrompu peut repartir du début (pas de promesse de reprise à l'octet). Le bouton Arrêter doit interrompre le Worker et laisser le carnet intact.
5. Recharger une fois le modèle prêt, puis l'activer de nouveau : les shards en cache doivent être réutilisés. Tester aussi fermeture/réouverture du navigateur. En mode privé, le cache peut disparaître à la fermeture. Le navigateur peut évincer un cache non persistant.
6. Poser une question de bilan en français puis en anglais : les réponses chiffrées viennent du calcul local, même si le modèle est actif. Demander ensuite une explication de la double progression sans chiffres : elle doit arriver en streaming (phrases validées), dans la langue choisie. Arrêter pendant une réponse puis poser une autre question.
7. Ouvrir le réseau des outils de développement : seules des ressources statiques de FORGE et des fichiers publics du modèle sont demandés. Aucune requête à une API applicative, aucun envoi du carnet ou de la question. Les poids peuvent être servis par une URL CDN redirigée par Hugging Face ; aucun jeton/API key n'est requis.
8. Toucher « Supprimer le modèle » : rechargement et bilans locaux doivent rester possibles ; pseudo, compte, repas, programmes et photos restent présents. Les clés `forge_data_*` et `forge_session_v1` ne sont jamais effacées par cette action.
9. Vérifier 390×844 et bureau 1920×1080 : pas de débordement horizontal, boutons tactiles, focus clavier, états traduits FR/EN, aucune erreur console. Vérifier Safari/iOS séparément : l'absence de capacités doit mener au repli plutôt qu'à une erreur.

## Garde-fous et limites

Le contexte compact est construit depuis les relevés réels (séances, volumes, poids, calories des jours renseignés). Il ne contient ni email, ni mot de passe, ni photo. Aucun historique de conversation n'est enregistré ou transmis. Le Worker/contexte est réinitialisé au changement de compte, tout en conservant les poids publics en cache. Les réponses sont rendues avec `textContent` ; aucun HTML du modèle n'est exécuté.

Le modèle est petit et n'est pas une source de statistiques fiable. L'essai réel initial a confondu volume et minutes et inventé un nombre de séances. En conséquence, les questions chiffrées sont traitées par calcul déterministe ; les segments générés contenant des chiffres ou affirmant absents des champs connus sont rejetés et remplacés par le bilan local. Le prompt contient les faits qualitatifs calculés et le conseil de progression de l'application, interdit les inventions et les avis médicaux. Le filtre est conservateur, et **ne garantit pas l'exactitude de toute observation qualitative** : le bilan calculé reste accessible pour comparer. Aucun avis médical, traitement ni déficit extrême n'est produit par le calcul local.

## Contrôles automatisés

Avec `FORGE_PLAYWRIGHT` pointant sur Playwright :

```powershell
node tests/i18n-check.cjs
node tests/static-paths.cjs
node tests/i18n-smoke.cjs
node tests/nutrition-smoke.cjs
node tests/training-smoke.cjs
node tests/illustrations-smoke.cjs
node tests/local-coach-smoke.cjs
node tools/check-templates.cjs
```

`local-coach-smoke` vérifie le vrai module et son Worker, le cache natif ciblé, le repli sans WebGPU et les états d'interface avec un moteur simulé (chargement, arrêt, reprise, streaming, erreur, suppression). Les scénarios simulés ne sont pas présentés comme de l'inférence réelle.

Test d'intégration explicite, avec téléchargement réel d'environ 900 Mo et GPU compatible :

```powershell
node tests/coach-real-smoke.cjs
```

Le rapport `forge-coach-real-report.json` est écrit dans le dossier temporaire système. Le test couvre activation, questions FR/EN, cache des shards, rechargement sans retéléchargement de shard et suppression du modèle sans modification du carnet. Le test réel précédent a confirmé ces opérations dans Chrome headless 157, WebGPU + shader-f16, mémoire exposée 16 Go, sans appel d'API applicative.

## Ce qui reste à vérifier manuellement

- Appareil Android ou iPhone physique : débit, température, batterie, pression mémoire et fluidité pendant un long usage.
- Safari/iOS réel et fermeture/réouverture complète du navigateur ; les captures de viewport Chromium ne remplacent pas ces essais.
- Coupure réseau physique au milieu d'un shard et reprise après redémarrage du téléphone : les interruptions/états sont testés automatiquement avec un moteur simulé, les caches et le rechargement le sont avec le modèle réel.
- Validation exhaustive de la qualité des réponses du modèle : les tests FR/EN ne constituent pas une validation médicale ni une garantie d'absence d'hallucination.
