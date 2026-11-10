#!/usr/bin/env python3
"""Reconstruit le catalogue Forge à partir de deux révisions publiques figées.

Python 3.10+ et Git suffisent. --verify-images utilise aussi Pillow et compare
les 13 correspondances ambiguës aux planches de contrôle publiées par Atlas.
Ce script ne télécharge pas la collection complète des GIF.
"""

import argparse
import collections
import csv
import datetime
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile


ATLAS_URL = "https://github.com/AnTh0nY47/atlas-muscu"
ATLAS_MAIN = "1a4f2a4389a79447cc5b3a23511fe214c8deaf64"
ATLAS_REVIEW = "9f53402c8eac88303a41320437d77012db335719"
BACKUP_URL = "https://github.com/omercotkd/exercises-gifs"
BACKUP_REVISION = "ebf642cd90fdf73a6c73e7127e93b607b12c229e"
RAW_BASE = f"https://raw.githubusercontent.com/omercotkd/exercises-gifs/{BACKUP_REVISION}/assets/"
FIXTURE_ID = "0656"
FIXTURE_SHA256 = "bdbc14c2f05ef140cc95531a9f530bd02a02bb1e5dc840ff29c50e26514c92bb"

# Six noms ont deux variantes : le nom seul ne permet pas de les attribuer.
# Le vélo a changé de suffixe. Ces 13 correspondances ont été contrôlées sur
# la première image ET l'image médiane des GIF, face aux planches Atlas.
# Valeur : ID du média, erreur moyenne RGB /255, erreur de l'autre variante.
VISUAL_MATCHES = {
    "2kattbR": ("0454", 1.0126190476190475, 38.82534013605442),
    "DOoWcnA": ("0576", 1.2203231292517005, 33.89701530612245),
    "E4PwJqI": ("1766", 1.0643367346938777, 25.603307823129253),
    "GwYwElT": ("0697", 0.769906462585034, 25.748707482993197),
    "H1PESYI": ("2138", 1.536215986394558, None),
    "Lsqrgh4": ("1394", 1.13375, 19.748154761904765),
    "T0yTjgW": ("0577", 1.663639455782313, 33.79776360544218),
    "Y4BRNQF": ("0655", 0.9343707482993198, 22.932721088435375),
    "Ye5Qxb0": ("1628", 1.1918877551020408, 38.662363945578235),
    "ipvgBnC": ("1371", 1.3843282312925171, 31.81625),
    "ktsFQAZ": ("0088", 1.0717091836734696, 31.753069727891152),
    "tgryw5Y": ("0656", 0.7046853741496599, 22.89744047619048),
    "ywaNfuh": ("0763", 1.0866241496598639, 19.515654761904763),
}


def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args])


def read_source(repo, revision, path):
    return git(repo, "show", f"{revision}:{path}")


def atomic_write(path, contents):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as handle:
        temporary = handle.name
        handle.write(contents)
    os.replace(temporary, path)


def numbered_fields(row, name):
    keys = sorted((key for key in row if key.startswith(name + "/")),
                  key=lambda key: int(key.split("/")[1]))
    return [row[key].strip() for key in keys if row[key].strip()]


def verify_images(atlas_repo, backup_repo, index):
    from PIL import Image, ImageChops, ImageSequence, ImageStat

    sheets = {}
    for exercise in index:
        if exercise["id"] not in VISUAL_MATCHES:
            continue
        media_id, expected_error, _ = VISUAL_MATCHES[exercise["id"]]
        sheet_number = (exercise["n"] - 1) // 20 + 1
        if sheet_number not in sheets:
            data = read_source(atlas_repo, ATLAS_REVIEW,
                               f"revue/planche-{sheet_number:03}.png")
            sheets[sheet_number] = Image.open(io.BytesIO(data))
        position = (exercise["n"] - 1) % 20
        left, top = (position % 4) * 290, (position // 4) * 198
        references = [
            sheets[sheet_number].crop((left + 2, top + 2, left + 142, top + 142)),
            sheets[sheet_number].crop((left + 146, top + 2, left + 286, top + 142)),
        ]
        data = read_source(backup_repo, BACKUP_REVISION, f"assets/{media_id}.gif")
        animation = Image.open(io.BytesIO(data))
        frames = [frame.convert("RGB") for frame in ImageSequence.Iterator(animation)]
        if len(frames) < 2:
            raise ValueError(f"GIF non animé : {media_id}")
        samples = [frames[0].resize((140, 140)), frames[len(frames) // 2].resize((140, 140))]
        errors = [sum(ImageStat.Stat(ImageChops.difference(reference.convert("RGB"), sample)).mean) / 3
                  for reference, sample in zip(references, samples)]
        mean_error = sum(errors) / 2
        if mean_error > 2 or abs(mean_error - expected_error) > 0.2:
            raise ValueError(f"Correspondance visuelle divergente : {exercise['id']} / {media_id}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--atlas-repo", required=True, type=Path)
    parser.add_argument("--backup-repo", required=True, type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--import-date", default=datetime.date.today().isoformat())
    parser.add_argument("--verify-images", action="store_true")
    args = parser.parse_args()
    datetime.date.fromisoformat(args.import_date)

    index_bytes = read_source(args.atlas_repo, ATLAS_REVIEW, "revue/index.json")
    csv_bytes = read_source(args.backup_repo, BACKUP_REVISION, "exercises.csv")
    manual_bytes = read_source(args.atlas_repo, ATLAS_MAIN, "data/fr-manuel.json")
    cache_bytes = read_source(args.atlas_repo, ATLAS_MAIN, "data/fr-cache.json")
    index = json.loads(index_bytes)
    rows = list(csv.DictReader(io.StringIO(csv_bytes.decode("utf-8-sig"))))
    manual, cache = json.loads(manual_bytes), json.loads(cache_bytes)
    assets = set(git(args.backup_repo, "ls-tree", "-r", "--name-only", BACKUP_REVISION).decode().splitlines())

    if len(index) != 1324 or len(rows) != 1324:
        raise ValueError("Le décompte des révisions figées a changé.")
    if len({entry["id"] for entry in index}) != 1324 or len({row["id"] for row in rows}) != 1324:
        raise ValueError("Identifiants source dupliqués.")
    by_name = collections.defaultdict(list)
    by_id = {row["id"]: row for row in rows}
    for row in rows:
        by_name[row["name"]].append(row)

    if args.verify_images:
        verify_images(args.atlas_repo, args.backup_repo, index)

    exercises, missing_media, used_ids = [], [], set()
    manual_steps = cache_steps = exact_matches = 0
    for entry in sorted(index, key=lambda entry: entry["id"]):
        match = VISUAL_MATCHES.get(entry["id"])
        if match:
            row = by_id[match[0]]
            if entry["id"] != "H1PESYI" and row["name"] != entry["name"]:
                raise ValueError("Le nom d'une variante visuelle ne correspond plus.")
        else:
            candidates = by_name[entry["name"]]
            if len(candidates) != 1:
                raise ValueError(f"Correspondance non résolue : {entry['id']}")
            row = candidates[0]
            exact_matches += 1
        if row["id"] in used_ids:
            raise ValueError("Deux fiches Atlas ont reçu le même média source.")
        used_ids.add(row["id"])

        instructions_en = numbered_fields(row, "instructions")
        instructions_fr = []
        for instruction in instructions_en:
            if manual.get(instruction):
                instructions_fr.append(manual[instruction])
                manual_steps += 1
            elif cache.get(instruction):
                instructions_fr.append(cache[instruction])
                cache_steps += 1
            else:
                raise ValueError(f"Consigne sans traduction : {entry['id']}")
        if not entry["fr"] or not instructions_en:
            raise ValueError("Fiche sans nom français ou sans consignes.")
        media_exists = f"assets/{row['id']}.gif" in assets
        if not media_exists:
            missing_media.append({"id": entry["id"], "mediaBackupId": row["id"], "nameFr": entry["fr"]})
        exercises.append({
            "id": entry["id"], "nameFr": entry["fr"], "nameEn": entry["name"],
            "gifUrl": RAW_BASE + row["id"] + ".gif" if media_exists else None,
            "bodyParts": [row["bodyPart"]], "targetMuscles": [row["target"]],
            "secondaryMuscles": numbered_fields(row, "secondaryMuscles"),
            "equipments": [row["equipment"]],
            "instructionsFr": instructions_fr, "instructionsEn": instructions_en,
            "mediaBackupId": row["id"],
        })

    if exact_matches != 1311 or used_ids != set(by_id):
        raise ValueError("La jointure n'est pas complète et bijective.")
    if [item["mediaBackupId"] for item in missing_media] != ["0609"]:
        raise ValueError("La liste des GIF manquants a changé.")
    if manual_steps + cache_steps != 7710:
        raise ValueError("Le décompte des consignes a changé.")

    fixture = read_source(args.backup_repo, BACKUP_REVISION, f"assets/{FIXTURE_ID}.gif")
    if hashlib.sha256(fixture).hexdigest() != FIXTURE_SHA256 or fixture[:6] not in (b"GIF89a", b"GIF87a"):
        raise ValueError("Le GIF témoin n'est pas identique à l'échantillon vérifié.")

    revisions = {"atlasIndex": ATLAS_REVIEW, "atlasTranslations": ATLAS_MAIN, "mediaBackup": BACKUP_REVISION}
    payload = {
        "mode": "complete", "total": len(exercises), "mediaTotal": len(exercises) - len(missing_media),
        "source": ATLAS_URL, "mediaSource": BACKUP_URL, "revisions": revisions,
        "importedAt": args.import_date, "indexPublishedAt": "2026-09-26T20:18:52Z",
        "mediaAvailability": "git-manifest-verified; remote-http-not-verified",
        "exercises": exercises,
    }
    visual_audit = [{"atlasId": aid, "mediaBackupId": values[0], "meanAbsoluteError": values[1],
                     "otherVariantError": values[2]}
                    for aid, values in VISUAL_MATCHES.items()]
    audit = {
        "importedAt": args.import_date, "observedAt": "2026-11-03", "revisions": revisions,
        "sources": {"atlas": ATLAS_URL, "backup": BACKUP_URL,
                    "api": "https://oss.exercisedb.dev/api/v1/exercises",
                    "backupOrigin": "https://www.kaggle.com/datasets/edoardoba/fitness-exercises-with-animations/data"},
        "counts": {"atlasIndex": len(index), "metadataRows": len(rows), "uniqueAtlasIds": len(exercises),
                   "uniqueMediaIds": len(used_ids), "exactUniqueNameMatches": exact_matches,
                   "visuallyResolvedMatches": len(VISUAL_MATCHES), "frenchNames": len(exercises),
                   "completeFrenchInstructions": len(exercises), "instructionSteps": manual_steps + cache_steps,
                   "manualTranslationSteps": manual_steps, "cacheTranslationSteps": cache_steps,
                   "gifPathsPresentInGit": len(exercises) - len(missing_media),
                   "actualAnimatedGifSamplesReviewed": 13, "currentRemoteHttpGifChecks": 0},
        "missingMedia": missing_media,
        "visualMatching": {"method": "First and middle GIF frames resized to 140x140; compared to Atlas revue contact sheets.",
                           "reviewedAt": "2026-11-03", "recheckedDuringThisImport": args.verify_images,
                           "matches": visual_audit},
        "sourceSha256": {"atlasIndex": hashlib.sha256(index_bytes).hexdigest(),
                         "metadataCsv": hashlib.sha256(csv_bytes).hexdigest(),
                         "manualTranslations": hashlib.sha256(manual_bytes).hexdigest(),
                         "cachedTranslations": hashlib.sha256(cache_bytes).hexdigest()},
        "network": {"apiAccessibleFromExecutionEnvironment": False, "apiFailure": "HTTP 403, CONNECT proxy refusal",
                    "apiTotalVerified": False, "apiPaginationVerified": False,
                    "gifHost": "raw.githubusercontent.com", "gifHostHttpAvailabilityVerified": False,
                    "gitObjectsVerified": True},
        "fixture": {"path": "tests/fixtures/atlas-demo.gif", "atlasId": "tgryw5Y", "mediaBackupId": FIXTURE_ID,
                    "sourceUrl": RAW_BASE + FIXTURE_ID + ".gif", "sha256": FIXTURE_SHA256,
                    "bytes": len(fixture), "width": 360, "height": 360, "frames": 12},
        "licenseNotes": {"atlasLicenseFileFound": False, "backupLicenseFile": "MIT",
                         "backupAuthorDisclaimsOwnershipOfMedia": True,
                         "mediaLicenseInferredFromBackupLicense": False,
                         "terms": "Les licences des médias et traductions ne sont pas établies par le seul LICENSE du dépôt de sauvegarde."},
    }
    # Échappement nécessaire pour inclure aussi ce JSON dans l'aperçu HTML autonome.
    serialized = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    for character, escaped in (("<", "\\u003c"), (">", "\\u003e"), ("\u2028", "\\u2028"), ("\u2029", "\\u2029")):
        serialized = serialized.replace(character, escaped)
    script = ("// Généré par docs/import-atlas.py ; provenance et limites : docs/SOURCES_ATLAS.md.\n"
              "window.FORGE_ATLAS_DATA = " + serialized + ";\n").encode("utf-8")
    atomic_write(args.output_dir / "js/data/atlas-exercises.js", script)
    atomic_write(args.output_dir / "docs/atlas-source-audit.json", (json.dumps(audit, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
    atomic_write(args.output_dir / "tests/fixtures/atlas-demo.gif", fixture)
    print(json.dumps(audit["counts"], ensure_ascii=False))


if __name__ == "__main__":
    main()
