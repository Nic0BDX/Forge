# Source des données nutritionnelles

**Source : table CIQUAL, ANSES.** Anses. 2025. Table de composition nutritionnelle des aliments Ciqual 2025.
Jeu officiel, version 1 : https://doi.org/10.57745/RDMHWY — publié le 19 novembre 2025.
Licence Ouverte / Open Licence Etalab 2.0 : https://spdx.org/licenses/etalab-2.0.html.

`node tools/build-foods.cjs` télécharge les quatre exports XML officiels dans un cache ignoré par Git (`tools/.ciqual-cache/`). Leurs empreintes MD5 sont vérifiées contre celles du dépôt officiel :

| Export officiel | Identifiant de téléchargement |
| --- | --- |
| alim_2025_11_03.xml | 666252 |
| alim_grp_2025_11_03.xml | 666250 |
| const_2025_11_03.xml | 666246 |
| compo_2025_11_03.xml | 666249 |

Téléchargement : `https://entrepot.recherche.data.gouv.fr/api/access/datafile/IDENTIFIANT`.
Les noms français et anglais, identifiants et groupes sources sont conservés. Les groupes simplifiés et la sélection de produits courants sont propres à FORGE. L'état cru/cuit provient uniquement d'une mention explicite du nom ; sinon `null`.

Valeurs pour **100 g de partie comestible**, y compris les boissons : énergie UE 1169/2011 (constituant 328, kcal), protéines N × facteur Jones (25000), glucides (31000), sucres (32000), lipides (40000), acides gras saturés (40302), fibres (34100), sel (10004), en grammes hors énergie.
Aucune valeur n'est estimée : données absentes, traces et valeurs avec seuil (`<`) deviennent `null`. Un zéro n'est conservé que s'il est explicitement présent dans l'export. Les totaux incomplets sont signalés dans l'application ; aucune donnée manquante n'est assimilée à zéro.

Les anciens repas et aliments personnels sont conservés. Les six aliments de démonstration historiques, non sourcés, sont exclus des nouveaux choix ; leurs repas déjà enregistrés ne sont pas recalculés. Les aliments personnels restent identifiés comme tels et ne sont pas attribués à l'ANSES.

## Repas et estimation indicative

`tools/build-recipes.cjs` produit 48 propositions à partir de 16 bases et de trois compositions/portions par objectif, avec accompagnements distincts. Les grammages sont des propositions de recettes ; toutes les valeurs nutritionnelles sont calculées exclusivement depuis `foods.json`. Toute valeur inconnue d'un ingrédient rend le total correspondant inconnu. Ni calories ni macros ne sont écrites à la main.

Estimation au repos : Mifflin et al., 1990, https://pubmed.ncbi.nlm.nih.gov/2305711/ : `10 × poids(kg) + 6,25 × taille(cm) − 5 × âge + 5` (homme), ou `−161` (femme), population de l'étude de 19 à 78 ans. Aucun sexe n'est déduit de l'espace Homme/Femme de l'accueil.
Activité choisie explicitement : facteurs 1,4 / 1,8 / 2,2, valeurs représentatives des catégories PAL FAO/WHO/UNU (1,40–1,69 ; 1,70–1,99 ; 2,00–2,40), https://www.fao.org/4/y5686e/y5686e07.htm.
Le maintien vaut repos × PAL. Les variations de ±10 % sont une politique indicative de l'application, pas une validation clinique ; la proposition de perte ne descend jamais sous l'estimation au repos. Les informations manquantes sont demandées, sans valeur supposée. Le résultat n'est enregistré comme objectif calorique qu'après une action explicite.
