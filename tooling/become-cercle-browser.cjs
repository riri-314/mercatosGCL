const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createRequire } = require('node:module');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright-core');
const firebaseRequire = createRequire(path.join(__dirname, '../functions/package.json'));
const { initializeApp, deleteApp } = firebaseRequire('firebase-admin/app');
const { getFirestore } = firebaseRequire('firebase-admin/firestore');

const projectId = 'demo-mercatos-security';
for (const name of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
  if (process.env.GCLOUD_PROJECT !== projectId || !/^(127\.0\.0\.1|localhost):\d+$/.test(process.env[name] || '')) {
    throw new Error('Account switching browser checks require local demo emulators');
  }
}
const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5176';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Use a local preview server');
const output = path.join(os.tmpdir(), 'mercatos-become-preview');
fs.mkdirSync(output, { recursive: true });

async function run() {
  const app = initializeApp({ projectId });
  const db = getFirestore(app);
  const editionRef = db.doc('editions/demo-edition');
  const fixture = (await editionRef.get()).data();
  assert.ok(fixture, 'Seed the synthetic emulator data before running');
  fixture.cercles['demo-seller'].comitards['demo-profile'].picture = '/assets/images/default_profile_picture.svg';
  fixture.cercles['demo-buyer'].comitards.own = {
    ...fixture.cercles['demo-seller'].comitards['demo-profile'], firstname: 'Alice', nickname: 'La relève',
  };
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser', headless: true, args: ['--no-sandbox'],
  });
  let activePage;
  try {
    for (const width of (process.env.PREVIEW_WIDTH ? [Number(process.env.PREVIEW_WIDTH)] : [320, 390, 1440])) {
      await editionRef.set(fixture);
      const context = await browser.newContext({
        viewport: { width, height: 900 }, isMobile: width < 600, hasTouch: width < 600,
        locale: 'fr-BE', timezoneId: 'Europe/Brussels',
      });
      const page = await context.newPage();
      activePage = page;
      const errors = [];
      context.on('page', tab => tab.on('pageerror', error => errors.push(error.message)));
      page.on('pageerror', error => errors.push(error.message));
      await context.route('**/*', route => {
        const host = new URL(route.request().url()).hostname;
        return ['127.0.0.1', 'localhost', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(host) ? route.continue() : route.abort();
      });
      async function login(role) {
        await page.goto(base + '/login');
        const config = await page.evaluate(async () => {
          const { app, useEmulators } = await import('/src/firebase_config.ts');
          return { projectId: app.options.projectId, useEmulators };
        });
        assert.deepEqual(config, { projectId, useEmulators: true }, 'The browser must use the demo emulators');
        await page.getByLabel('Email', { exact: true }).fill(`demo-${role}@example.test`);
        await page.getByLabel('Mot de passe', { exact: true }).fill('EmulatorOnly123!');
        await page.getByRole('button', { name: 'Connexion', exact: true }).click();
        await page.waitForURL(base + '/');
        await page.goto(base + '/account');
      }
      async function state(tab = page) {
        return tab.evaluate(async () => {
          const { auth } = await import('/src/firebase_config.ts');
          const token = await auth.currentUser?.getIdTokenResult();
          return { uid: auth.currentUser?.uid ?? null, cercleSession: token?.claims.cercleSession ?? false };
        });
      }
      async function geometry() {
        const layout = await page.evaluate(() => {
          const banner = document.querySelector('[aria-label="Session cercle active"]').getBoundingClientRect();
          const header = document.querySelector('.MuiAppBar-root').getBoundingClientRect();
          return { bannerBottom: banner.bottom, headerTop: header.top, scroll: document.documentElement.scrollWidth, width: innerWidth };
        });
        assert.ok(layout.scroll <= layout.width, `No page overflow at ${width}px`);
        assert.ok(layout.headerTop >= layout.bannerBottom - 1, 'Header must sit below the warning');
      }
      async function screenshot(name) {
        if (width === 390 || width === 1440) {
          await page.mouse.move(0, 0);
          await page.screenshot({ path: path.join(output, `${name}-${width === 390 ? 'mobile' : 'desktop'}.png`) });
        }
      }

      await login('admin');
      await page.getByRole('heading', { name: 'Administration', exact: true }).waitFor();
      assert.deepEqual(await state(), { uid: 'demo-admin', cercleSession: false });
      const otherTab = await context.newPage();
      await otherTab.goto(base + '/account');
      await otherTab.getByRole('heading', { name: 'Administration', exact: true }).waitFor();
      if (width < 600) await page.getByRole('combobox', { name: 'Section', exact: true }).selectOption('cercles');
      else await page.getByRole('tab', { name: 'Cercles', exact: true }).click();
      const become = page.getByRole('button', { name: 'Se connecter en tant que Cercle Alpha', exact: true });
      await become.waitFor();
      await page.waitForFunction(() => !document.querySelector('[aria-label="Se connecter en tant que Cercle Alpha"]').disabled);
      await become.click();
      await page.getByRole('heading', { name: 'Mon cercle', exact: true }).waitFor();
      // A modal hides the rest of the document from assistive technology, while
      // the fixed visual banner remains above it. Measure the element directly.
      const banner = page.locator('[aria-label="Session cercle active"]');
      await banner.waitFor();
      assert.match(await banner.innerText(), /Cercle Alpha/);
      assert.deepEqual(await state(), { uid: 'demo-buyer', cercleSession: true });
      await otherTab.getByRole('alert', { name: 'Session cercle active', exact: true }).waitFor();
      assert.deepEqual(await state(otherTab), { uid: 'demo-buyer', cercleSession: true });
      assert.equal(await page.getByRole('heading', { name: 'Administration', exact: true }).count(), 0);
      await geometry();
      await screenshot('become-cercle');
      await page.reload();
      await banner.waitFor();
      await page.getByRole('heading', { name: 'Mon cercle', exact: true }).waitFor();
      assert.deepEqual(await state(), { uid: 'demo-buyer', cercleSession: true });

      const ownProfile = width < 900 ? page.getByRole('article', { name: 'Alice Exemple', exact: true }) : page.locator('[role="row"][data-id="demo-buyer/own"]');
      if (width < 900) await ownProfile.getByRole('button', { name: 'Modifier', exact: true }).click();
      else await ownProfile.getByRole('menuitem', { name: 'Edit', exact: true }).click();
      const form = page.getByRole('dialog', { name: 'Modifier le comitard', exact: true });
      await form.waitFor();
      const formBounds = await form.boundingBox();
      const bannerBounds = await banner.boundingBox();
      assert.ok(formBounds.y >= bannerBounds.y + bannerBounds.height - 1 && formBounds.y + formBounds.height <= 901, 'Profile editor must fit below the warning');
      await page.getByRole('button', { name: 'Fermer le formulaire', exact: true }).click();

      await page.goto(base + '/comitards');
      await page.getByRole('tab', { name: 'Cercle Beta', exact: true }).click();
      await page.getByRole('button', { name: 'Voir la fiche de Camille Exemple', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Camille Exemple', exact: true });
      await dialog.waitFor();
      const bounds = await dialog.boundingBox();
      assert.ok(bounds.y >= (await banner.boundingBox()).height && bounds.y + bounds.height <= 901, 'Auction modal must fit below the warning');
      const amount = dialog.getByLabel('Enchère', { exact: true });
      await amount.fill('5');
      await amount.press('Tab');
      await dialog.getByRole('button', { name: 'Enchérir', exact: true }).click();
      await dialog.getByText('Vote enregistré', { exact: true }).waitFor();
      const edition = (await editionRef.get()).data();
      assert.equal(edition.cercles['demo-buyer'].nbFut, 95);
      assert.equal(Object.values(edition.cercles['demo-seller'].comitards['demo-profile'].encheres)[0].sender, 'demo-buyer');
      await screenshot('become-cercle-modal');
      await page.getByRole('button', { name: 'Fermer la fiche', exact: true }).click();
      const status = await page.evaluate(async () => {
        const { auth } = await import('/src/firebase_config.ts');
        const response = await fetch('http://127.0.0.1:5001/demo-mercatos-security/europe-west1/getdisabledstatus', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await auth.currentUser.getIdToken()}` },
          body: JSON.stringify({ data: { editionId: 'demo-edition' } }),
        });
        return response.status;
      });
      assert.equal(status, 403, 'The cercle login must not retain admin permissions');

      await banner.getByRole('button', { name: 'Se déconnecter', exact: true }).click();
      await page.waitForURL(base + '/login');
      await page.getByLabel('Email', { exact: true }).waitFor();
      assert.deepEqual(await state(), { uid: null, cercleSession: false });
      await otherTab.waitForFunction(() => !document.querySelector('[aria-label="Session cercle active"]'));
      assert.deepEqual(await state(otherTab), { uid: null, cercleSession: false });
      assert.equal(await banner.count(), 0);
      await login('buyer');
      await page.getByRole('heading', { name: 'Mon cercle', exact: true }).waitFor();
      assert.deepEqual(await state(), { uid: 'demo-buyer', cercleSession: false });
      assert.equal(await banner.count(), 0, 'Ordinary cercle login must not inherit the warning');
      assert.deepEqual(errors, [], `Browser exceptions at ${width}px`);
      console.log(`PASS ${width}px: admin-to-cercle switch, cross-tab sync, reload, red banner, dialogs, emulator bid, denied admin access, logout and normal user login`);
      await context.close();
    }
    console.log(`Screenshots: ${output}`);
  } catch (error) {
    if (activePage && !activePage.isClosed()) {
      await activePage.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {});
      console.error('BROWSERSTATE', activePage.url(), (await activePage.locator('body').innerText()).slice(0, 12000));
    }
    throw error;
  } finally {
    await browser.close();
    await deleteApp(app);
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
