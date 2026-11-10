/* Forge — catalogue Atlas, compatibilité des carnets et démonstrations.
 * Exécuter après gel des sources et reconstruction de APERCU.html.
 * FORGE_BASE_URL=http://127.0.0.1:8080 FORGE_TEST_OUTPUT=/tmp/forge-atlas node tests/atlas-smoke.cjs
 * Les comptes et carnets sont synthétiques, dans un contexte Chromium neuf.
 * Les GIF sont interceptés avec un vrai fichier fixture : ces contrôles ne
 * prouvent pas la disponibilité actuelle des 1 323 médias du fournisseur.
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');

const root = path.resolve(__dirname, '..');
const base = process.env.FORGE_BASE_URL || 'http://127.0.0.1:8080';
const output = process.env.FORGE_TEST_OUTPUT || '/tmp/forge-atlas';
const fixturePath = process.env.FORGE_ATLAS_GIF_FIXTURE || path.join(root, 'tests/fixtures/atlas-demo.gif');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const walk = folder => fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(folder, entry.name);
  return entry.isDirectory() ? (entry.name === '__pycache__' ? [] : walk(file)) : [file];
});
const sourcePaths = ['index.html', ...['js', 'css', 'assets', 'preview'].flatMap(folder => walk(path.join(root, folder))
  .filter(file => /\.(js|css|html|svg|png|webp|gif|json|py)$/.test(file)).map(file => path.relative(root, file)))].sort();
const sourceHashes = () => Object.fromEntries(sourcePaths.map(file => [file, sha256(fs.readFileSync(path.join(root, file)))]));
const initialSourceHashes = sourceHashes();
const initialApercuHash = sha256(fs.readFileSync(path.join(root, 'APERCU.html')));
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce', locale: 'fr-FR', timezoneId: 'Europe/Paris' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const report = {
    checkedAt: new Date().toISOString(), browser: await browser.version(), checks: [], errors: [], layouts: [],
    mediaVerification: { mode: 'GIF fixture intercepté et panne réseau simulée', liveProviderRequests: 0, allRemoteMediaVerified: false }
  };
  const captureErrors = p => p.on('pageerror', error => report.errors.push(error.message));
  captureErrors(page);
  const check = (name, value, detail) => {
    report.checks.push({ name, status: value ? 'passed' : 'failed', ...(detail === undefined ? {} : { detail }) });
    assert.ok(value, name);
  };
  const cards = p => p.locator('.ax-exercise-card[data-exercise-id]');
  const visibleIds = p => cards(p).evaluateAll(elements => elements.map(el => el.dataset.exerciseId));
  const open = async (id, p = page) => { await p.evaluate(value => openExerciseModal(value), id); await p.locator('.ax-detail').waitFor(); };
  const close = async (p = page) => { await p.keyboard.press('Escape'); await p.locator('#modal.show').waitFor({ state: 'hidden' }); };
  const showLibrary = async (p = page) => { await p.evaluate(() => nav('exercises')); await p.locator('.ax-library').waitFor(); };
  const reset = async () => { await page.locator('#ax-reset').click(); };
  const requestDemo = async (p = page) => {
    const image = p.locator('#ax-demo-media');
    if (await image.count() && await image.getAttribute('src')) return;
    const button = p.locator('.ax-demo-controls button').filter({ hasText: /lire|lancer|charger|voir|reprendre|réessayer/i }).first();
    if (await button.count()) await button.click();
  };
  let gifMode = 'success', gifRequests = 0, gifUrls = new Set();
  try {
    check('Le GIF fixture est présent et possède un en-tête GIF réel', fs.existsSync(fixturePath) && /^GIF8[79]a/.test(fs.readFileSync(fixturePath).subarray(0, 6).toString()));
    const gifFixture = fs.readFileSync(fixturePath);
    report.mediaVerification.fixture = { file: path.relative(root, fixturePath), bytes: gifFixture.length, sha256: sha256(gifFixture) };
    await context.route(url => gifUrls.has(url.href.split('?')[0]), async route => {
      gifRequests++;
      if (gifMode === 'error') return route.abort('internetdisconnected');
      return route.fulfill({ status: 200, contentType: 'image/gif', body: gifFixture });
    });
    await page.goto(base + '/index.html');
    await page.evaluate(() => {
      const email = 'atlas-tests@forge.example';
      AUTH = { [email]: { email, name: 'Test Atlas' } };
      localStorage.setItem('forge_accounts_v1', JSON.stringify(AUTH));
      localStorage.setItem('forge_session_v1', email);
      DB = defaultDB(); DB.profile.setup = true; DB.profile.name = 'Test Atlas';
      DB.programs = [
        { id: 'atlas-program-a', name: 'Programme à conserver', next: 0, days: [
          { id: 'atlas-day-a1', name: 'Ancienne séance', exercises: [{ id: 'ancien-squat', name: 'Squat', sets: 3, repsMin: 8, repsMax: 12, rest: 90 }] },
          { id: 'atlas-day-a2', name: 'Mouvement personnel', exercises: [{ id: 'perso', name: 'Mon mouvement personnel sans catalogue', sets: 2, repsMin: 6, repsMax: 10, rest: 45 }] }
        ] },
        { id: 'atlas-program-b', name: 'Programme cible', next: 0, days: [
          { id: 'atlas-day-b1', name: 'Lundi intact', exercises: [{ id: 'ancien-couche', name: 'Développé couché', sets: 3, repsMin: 8, repsMax: 12, rest: 90 }] },
          { id: 'atlas-day-b2', name: 'Jeudi choisi', exercises: [] }
        ] }
      ];
      DB.activeProgram = 'atlas-program-a';
      DB.sessions = [{ id: 'atlas-historique-ancien', date: today(), iso: new Date().toISOString(), program: 'Programme à conserver', day: 'Ancienne séance', duration: 60, volume: 100, sets: 1, exercises: [{ name: 'Squat', sets: [{ weight: '10', reps: '10', rpe: '7', done: true }] }] }];
      commitUserDB(DB); view = 'exercises'; render();
    });
    await page.locator('.ax-library').waitFor();
    const data = await page.evaluate(() => ({
      source: Array.isArray(window.FORGE_ATLAS_DATA) ? window.FORGE_ATLAS_DATA : window.FORGE_ATLAS_DATA.exercises,
      catalog: exerciseCatalog.map(e => ({ id: e.id, name: e.name, nameEn: e.nameEn, muscle: e.muscle, equipment: e.equipment, muscles: e.muscles, equipments: e.equipments, gifUrl: e.gifUrl }))
    }));
    check('Les 1 324 fiches Atlas sont intégrées', data.source.length === 1324, { actual: data.source.length });
    check('Les identifiants source Atlas sont uniques', new Set(data.source.map(e => e.id)).size === data.source.length);
    check('Le catalogue conserve les 30 exercices Forge et les 1 324 fiches Atlas', data.catalog.length === 1354 && Array.from({ length: 30 }, (_, i) => 'ex' + i).every(id => data.catalog.some(e => e.id === id)));
    check('Chaque identifiant Atlas est stable et distinct', data.source.every(e => data.catalog.some(item => item.id === 'atlas-' + e.id)) && new Set(data.catalog.map(e => e.id)).size === data.catalog.length);
    check('La seule fiche sans GIF reste explicitement identifiée', data.source.filter(e => e.gifUrl).length === 1323 && data.source.filter(e => !e.gifUrl).length === 1 && data.source.find(e => !e.gifUrl).id === 'bLyQokI');
    check('Les fiches gardent leurs noms et consignes source', data.source.every(e => typeof e.nameFr === 'string' && e.nameFr.length && typeof e.nameEn === 'string' && e.nameEn.length && Array.isArray(e.instructionsFr) && e.instructionsFr.length && Array.isArray(e.instructionsEn) && e.instructionsEn.length));
    gifUrls = new Set(data.source.filter(e => e.gifUrl).map(e => e.gifUrl.split('?')[0]));
    const chosen = data.source.find(e => e.gifUrl && /[éèêàùçîôûëï]/i.test(e.nameFr));
    check('Une fiche française accentuée est disponible pour le parcours', Boolean(chosen));
    const chosenId = 'atlas-' + chosen.id;
    const errorExercise = data.source.find(e => e.gifUrl && e.id !== chosen.id);
    const offlineExercise = data.source.find(e => e.gifUrl && e.id !== chosen.id && e.id !== errorExercise.id);
    report.catalog = { sourceCount: data.source.length, legacyCount: 30, totalCount: data.catalog.length, gifLinks: gifUrls.size, exerciseUnderTest: { id: chosenId, nameFr: chosen.nameFr, nameEn: chosen.nameEn } };
    const firstPageIds = await visibleIds(page);
    check('La bibliothèque limite le premier écran à 24 cartes sans GIF', firstPageIds.length === 24 && await page.locator('#exerciseGrid img[src]').count() === 0 && gifRequests === 0);
    check('La provenance Atlas et ExerciseDB est visible', await page.locator('.ax-library').innerText().then(text => /Atlas/i.test(text) && /ExerciseDB/i.test(text)));
    check('La première page désactive le bouton précédent', await page.locator('.ax-prev').isDisabled());
    await page.locator('.ax-next').click();
    const secondPageIds = await visibleIds(page);
    check('La page suivante présente 24 autres exercices', secondPageIds.length === 24 && secondPageIds.every(id => !firstPageIds.includes(id)));
    await page.locator('.ax-prev').click();
    check('Revenir en arrière restitue exactement la première page', JSON.stringify(await visibleIds(page)) === JSON.stringify(firstPageIds));
    const paginatedIds = [];
    for (let count = 0; count < 100; count++) {
      paginatedIds.push(...await visibleIds(page));
      if (await page.locator('.ax-next').isDisabled()) break;
      await page.locator('.ax-next').evaluate(button => button.click());
    }
    check('Toutes les fiches sont accessibles par pagination, sans perte ni doublon', paginatedIds.length === data.catalog.length && new Set(paginatedIds).size === data.catalog.length && data.catalog.every(e => paginatedIds.includes(e.id)));
    check('La pagination ne télécharge aucun GIF en arrière-plan', gifRequests === 0);
    await reset();
    const plainName = chosen.nameFr.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    await page.locator('#exerciseSearch').fill(plainName);
    check('La recherche française ignore accents et casse', (await visibleIds(page)).includes(chosenId));
    await page.locator('#exerciseSearch').fill(chosen.nameEn);
    check('Le nom anglais retrouve la même fiche', (await visibleIds(page)).includes(chosenId));
    await page.locator('#exerciseSearch').fill('aucun-exercice-forge-introuvable-987654321');
    check('Une recherche sans résultat affiche un état vide', await cards(page).count() === 0 && /aucun/i.test(await page.locator('.ax-library').innerText()));
    await reset();
    check('Réinitialiser retire la recherche et revient au début', await page.locator('#exerciseSearch').inputValue() === '' && JSON.stringify(await visibleIds(page)) === JSON.stringify(firstPageIds));
    const filterChoice = await page.evaluate(() => {
      const muscles = [...document.querySelector('#exerciseMuscle').options].map(o => o.value).filter(Boolean);
      const materials = [...document.querySelector('#exerciseEquip').options].map(o => o.value).filter(Boolean);
      return exerciseCatalog.find(e => muscles.includes(e.muscle) && materials.includes(e.equipment));
    });
    check('Les filtres exposent un couple muscle et matériel du catalogue', Boolean(filterChoice));
    await page.locator('#exerciseMuscle').selectOption(filterChoice.muscle);
    await page.locator('#exerciseEquip').selectOption(filterChoice.equipment);
    const filteredIds = await visibleIds(page);
    check('Les filtres muscle et matériel se combinent', filteredIds.length > 0 && filteredIds.every(id => data.catalog.some(e => e.id === id && e.muscles.includes(filterChoice.muscle) && e.equipments.includes(filterChoice.equipment))));
    await reset();
    const beforeRead = await page.evaluate(() => JSON.stringify(DB));
    await page.locator('#exerciseSearch').fill(chosen.nameEn);
    await page.locator('.ax-exercise-card[data-exercise-id="' + chosenId + '"]').click();
    await page.locator('.ax-detail').waitFor();
    check('Ouvrir une fiche ne modifie pas le carnet', await page.evaluate(() => JSON.stringify(DB)) === beforeRead);
    check('Les consignes françaises sont affichées dans la fiche', await page.locator('.ax-instructions').innerText().then(text => chosen.instructionsFr.every(step => text.includes(step))));
    await requestDemo();
    await page.waitForFunction(() => { const img = document.getElementById('ax-demo-media'); return img?.complete && img.naturalWidth > 0; });
    check('Le lecteur affiche le GIF fixture réel', await page.locator('#ax-demo-media').evaluate(img => img.naturalWidth > 0 && img.naturalHeight > 0) && gifRequests > 0);
    await close();
    check('Échap ferme la fiche et rend le focus à sa carte', await page.evaluate(id => document.activeElement?.dataset.exerciseId === id, chosenId));
    gifMode = 'error';
    // Une autre URL évite le cache des images déjà décodées par Chromium.
    await open('atlas-' + errorExercise.id);
    await requestDemo();
    await page.locator('#ax-demo-error').waitFor({ state: 'visible' });
    check('Une panne du média montre un message et conserve les consignes', /indisponible|connexion|charg|erreur|réseau/i.test(await page.locator('#ax-demo-error').innerText()) && await page.locator('.ax-instructions').isVisible());
    check('La panne du média ne modifie aucune donnée du carnet', await page.evaluate(() => JSON.stringify(DB)) === beforeRead);
    gifMode = 'success';
    const retry = page.locator('.ax-detail').getByRole('button', { name: /réessayer/i });
    check('Le lecteur propose de réessayer après une panne', await retry.count() > 0);
    await retry.first().click();
    await page.waitForFunction(() => { const img = document.getElementById('ax-demo-media'); return img?.complete && img.naturalWidth > 0; });
    check('Réessayer restaure la démonstration sans fermer la fiche', await page.locator('.ax-detail').isVisible());
    await close();
    await open('atlas-bLyQokI');
    check('Une fiche sans média reste honnête et utilisable', /indisponible|sans démonstration|non disponible|aucune démonstration/i.test(await page.locator('.ax-detail').innerText()) && await page.locator('.ax-instructions').isVisible() && await page.locator('#ax-add-exercise').isEnabled());
    await close();
    await open(chosenId);
    await page.locator('#ax-target-program').selectOption('atlas-program-b');
    await page.locator('#ax-target-day').selectOption({ index: 1 });
    const beforeStorageFailure = await page.evaluate(() => {
      window.__atlasOriginalSetItem = Storage.prototype.setItem;
      const snapshot = JSON.stringify(DB);
      Storage.prototype.setItem = function (key, value) {
        if (key === 'forge_data_atlas-tests@forge.example') throw new DOMException('Quota de test', 'QuotaExceededError');
        return window.__atlasOriginalSetItem.call(this, key, value);
      };
      return snapshot;
    });
    await page.locator('#ax-add-exercise').click();
    const unchangedAfterFailure = await page.evaluate(expected => {
      Storage.prototype.setItem = window.__atlasOriginalSetItem; delete window.__atlasOriginalSetItem;
      return JSON.stringify(DB) === expected;
    }, beforeStorageFailure);
    check('Un échec de stockage ne crée aucun exercice en mémoire ni faux succès', unchangedAfterFailure && await page.locator('.ax-detail').isVisible() && /pas été enregistré|stockage/i.test(await page.locator('#toast').innerText()));
    await page.locator('#ax-add-exercise').click();
    const afterAdd = await page.evaluate(() => ({ programs: DB.programs, activeProgram: DB.activeProgram, sessions: DB.sessions }));
    const added = afterAdd.programs[1].days[1].exercises[0];
    check('L’ajout cible exactement le programme et le jour choisis', afterAdd.programs[1].days[1].exercises.length === 1 && added.catalogId === chosenId && added.name === chosen.nameFr && afterAdd.programs[0].days[0].exercises.length === 1 && afterAdd.programs[0].days[1].exercises.length === 1 && afterAdd.programs[1].days[0].exercises.length === 1);
    check('L’ajout conserve l’ancien historique et les programmes non ciblés', isDeepStrictEqual(afterAdd.programs[0], JSON.parse(beforeRead).programs[0]) && afterAdd.sessions.length === 1 && afterAdd.sessions[0].id === 'atlas-historique-ancien');
    await open(chosenId);
    await page.locator('#ax-target-program').selectOption('atlas-program-b');
    await page.locator('#ax-target-day').selectOption({ index: 1 });
    if (await page.locator('#ax-add-exercise').isEnabled()) await page.locator('#ax-add-exercise').click();
    check('Le même exercice n’est pas ajouté deux fois à la même séance', await page.evaluate(() => DB.programs[1].days[1].exercises.length === 1));
    await open('atlas-EIeI8Vf');
    await page.locator('#ax-target-program').selectOption('atlas-program-b');
    await page.locator('#ax-target-day').selectOption({ index: 0 });
    await page.locator('#ax-add-exercise').click();
    check('Une fiche Atlas ne duplique pas son ancien équivalent Forge', await page.evaluate(() => DB.programs[1].days[0].exercises.length === 1 && DB.programs[1].days[0].exercises[0].name === 'Développé couché'));
    await page.evaluate(() => closeModal());
    await page.reload();
    await page.waitForFunction(() => typeof DB !== 'undefined' && DB.profile.name === 'Test Atlas');
    check('Le choix de catalogue survit à un rechargement du carnet', await page.evaluate(id => DB.programs[1].days[1].exercises[0].catalogId === id, chosenId));
    check('L’export/import conserve les IDs Atlas et les anciennes séances', await page.evaluate(id => { const restored = validateBackup(JSON.parse(JSON.stringify(DB))); return restored.programs[1].days[1].exercises[0].catalogId === id && restored.sessions[0].exercises[0].name === 'Squat'; }, chosenId));
    check('Une ancienne sauvegarde sans catalogId reste importable', await page.evaluate(() => { const old = JSON.parse(JSON.stringify(DB)); old.programs.forEach(p => p.days.forEach(d => d.exercises.forEach(e => delete e.catalogId))); return validateBackup(old).programs.length === 2; }));
    check('Un catalogId invalide est refusé à l’import', await page.evaluate(() => { const invalid = JSON.parse(JSON.stringify(DB)); invalid.programs[1].days[1].exercises[0].catalogId = { invalid: true }; try { validateBackup(invalid); return false; } catch { return true; } }));
    await page.evaluate(() => startWorkout('atlas-program-b', 1));
    await page.locator('.es-ex').waitFor();
    check('La séance active conserve le catalogId Atlas', await page.evaluate(id => session.exercises[0].catalogId === id, chosenId));
    await page.getByLabel('Charge série 1', { exact: true }).fill('25');
    await page.getByLabel('Répétitions série 1', { exact: true }).fill('10');
    await page.getByLabel('RPE série 1', { exact: true }).fill('7');
    await page.getByRole('button', { name: 'Valider la série 1', exact: true }).click();
    await page.evaluate(() => { if (!restPaused) toggleRestPause(); });
    const beforeSessionDemo = await page.evaluate(() => ({ exercises: JSON.stringify(session.exercises), remaining: remainingRestMs(), paused: restPaused }));
    await page.locator('.ax-session-demo').first().click();
    await page.locator('.ax-detail').waitFor();
    await requestDemo();
    await close();
    check('La démonstration en séance préserve séries, charges et repos', await page.evaluate(expected => JSON.stringify(session.exercises) === expected.exercises && remainingRestMs() === expected.remaining && restPaused === expected.paused, beforeSessionDemo));
    await page.reload();
    await page.waitForFunction(() => typeof readWorkoutDraft === 'function');
    check('Le brouillon persistant conserve le catalogId et la série validée', await page.evaluate(id => { const d = readWorkoutDraft(); return d?.session.exercises[0].catalogId === id && d.session.exercises[0].sets[0].weight === '25' && d.session.exercises[0].sets[0].done; }, chosenId));
    await page.evaluate(() => resumeWorkout());
    check('La reprise de séance restaure la démonstration accessible', await page.locator('.ax-session-demo').count() === 1);
    await page.locator('.es-end').getByRole('button', { name: 'Terminer la séance', exact: true }).click();
    await page.waitForFunction(() => view === 'summary');
    check('L’historique final conserve ID Atlas, volume et ancien carnet', await page.evaluate(id => DB.sessions.length === 2 && DB.sessions[0].exercises[0].catalogId === id && DB.sessions[0].volume === 250 && DB.sessions[0].sets === 1 && DB.sessions[1].id === 'atlas-historique-ancien', chosenId));
    check('L’historique avec catalogId passe aussi par l’export/import', await page.evaluate(id => validateBackup(JSON.parse(JSON.stringify(DB))).sessions[0].exercises[0].catalogId === id, chosenId));
    await page.evaluate(() => startWorkout('atlas-program-a', 1));
    check('Un mouvement personnel reste utilisable sans lien de démonstration erroné', await page.locator('.es-ex').count() === 1 && await page.locator('.ax-session-demo').count() === 0 && await page.getByLabel('Charge série 1', { exact: true }).isVisible());
    await page.evaluate(() => { clearWorkoutDraft(); stopWorkoutRuntime(); nav('home'); });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.mobile-nav').getByRole('button', { name: 'Séances', exact: true }).click();
    await page.locator('.vf-tabs').getByRole('button', { name: 'Exercices', exact: true }).click();
    check('La bibliothèque est accessible depuis la navigation mobile', await page.locator('.ax-library').isVisible());
    for (const theme of ['dark', 'light']) {
      await page.evaluate(value => { DB.settings.theme = value; render(); }, theme);
      for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        await showLibrary();
        const listLayout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, smallButtons: [...document.querySelectorAll('.ax-library button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 43.5 || r.height < 43.5); }).map(b => b.textContent.trim()) }));
        check('Bibliothèque sans débordement ' + theme + ' à ' + width + ' px', listLayout.scrollWidth <= width, listLayout);
        if (width <= 390) check('Cibles tactiles de la bibliothèque ' + theme + ' à ' + width + ' px', listLayout.smallButtons.length === 0, listLayout.smallButtons);
        await open(chosenId);
        const detailLayout = await page.locator('#modalbox').evaluate(el => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, width: innerWidth, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, pageScrollWidth: document.documentElement.scrollWidth }; });
        check('Fiche lisible sans débordement ' + theme + ' à ' + width + ' px', detailLayout.left >= -1 && detailLayout.right <= width + 1 && detailLayout.scrollWidth <= detailLayout.clientWidth + 1 && detailLayout.pageScrollWidth <= width, detailLayout);
        report.layouts.push({ theme, width, listLayout, detailLayout });
        if (theme === 'dark' && [390, 1280].includes(width)) await page.screenshot({ path: path.join(output, 'atlas-fiche-' + width + '.png'), fullPage: true });
        await close();
        if (theme === 'dark' && [390, 1280].includes(width)) await page.screenshot({ path: path.join(output, 'atlas-bibliotheque-' + width + '.png'), fullPage: true });
      }
    }
    await page.goto(base + '/APERCU.html');
    await page.locator('.vf-dashboard').waitFor();
    await showLibrary();
    check('L’aperçu autonome inclut les 1 354 fiches et isole les données démo', await page.evaluate(() => exerciseCatalog.length === 1354 && window.__forgeDemoIsolated === true));
    await page.locator('#exerciseSearch').fill(chosen.nameEn);
    check('L’aperçu autonome conserve la recherche anglaise', (await visibleIds(page)).includes(chosenId));
    const offlinePage = await context.newPage();
    captureErrors(offlinePage);
    await context.setOffline(true);
    await offlinePage.setContent(fs.readFileSync(path.join(root, 'APERCU.html'), 'utf8'), { waitUntil: 'load' });
    await offlinePage.locator('.vf-dashboard').waitFor();
    await showLibrary(offlinePage);
    await offlinePage.locator('#exerciseSearch').fill(plainName);
    check('Sans réseau, le catalogue et la recherche autonome restent disponibles', (await visibleIds(offlinePage)).includes(chosenId));
    gifMode = 'error';
    const beforeOffline = await offlinePage.evaluate(() => JSON.stringify(DB));
    await open('atlas-' + offlineExercise.id, offlinePage);
    await requestDemo(offlinePage);
    await offlinePage.locator('#ax-demo-error').waitFor({ state: 'visible' });
    check('Sans réseau, les consignes restent consultables sans perte de données', await offlinePage.locator('.ax-instructions').isVisible() && await offlinePage.evaluate(() => JSON.stringify(DB)) === beforeOffline);
    await context.setOffline(false);
    await offlinePage.close();
    check('Aucune erreur JavaScript non gérée', report.errors.length === 0, report.errors);
    check('Les sources sont restées gelées pendant les contrôles Atlas', JSON.stringify(initialSourceHashes) === JSON.stringify(sourceHashes()));
    check('L’aperçu validé n’a pas changé pendant les contrôles Atlas', initialApercuHash === sha256(fs.readFileSync(path.join(root, 'APERCU.html'))));
    report.mediaVerification.interceptedRequests = gifRequests;
  } catch (error) {
    report.failure = error.stack;
    process.exitCode = 1;
    try { await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }); } catch {}
  } finally {
    report.passed = report.checks.filter(c => c.status === 'passed').length;
    report.failed = report.checks.filter(c => c.status === 'failed').length + (report.failure && !report.checks.some(c => c.status === 'failed') ? 1 : 0);
    report.sourceFileSha256 = initialSourceHashes;
    report.sourceSha256 = sha256(JSON.stringify(initialSourceHashes));
    report.apercuSha256 = initialApercuHash;
    report.testSha256 = sha256(fs.readFileSync(__filename));
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ passed: report.passed, failed: report.failed, report: path.join(output, 'report.json'), failure: report.failure }, null, 2));
    await browser.close();
  }
})();
