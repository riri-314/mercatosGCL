const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright-core');

const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173';
const output = process.env.PREVIEW_OUTPUT_DIR || path.join(os.tmpdir(), 'mercatos-results-preview');
fs.mkdirSync(output, { recursive: true });

// Serve synthetic snapshots at the data boundary, leaving the actual UI intact.
function fixture(state) {
  return `
    const now = Date.now();
    const ts = ms => ({ seconds: Math.floor(ms / 1000), nanoseconds: 0, toMillis: () => ms, toDate: () => new Date(ms) });
    const profile = (firstname, name, nickname, index) => ({
      firstname, name, nickname, picture: '/assets/images/default_profile_picture.svg',
      post: 'Membre du comité', age: 22, nbEtoiles: 3, teneurTaule: 6,
      etatCivil: 'Célibataire', pointFort: 'Toujours de bonne humeur', pointFaible: 'Les réveils du lundi',
      estLeSeul: 'À connaître toutes les chansons du cercle', campus: 1,
      ...('${state}' === 'empty' ? {} : {
        enchereStart: ts(now - 3600000),
        enchereStop: ts(now + ('${state}' === 'finished' || index === 2 ? -60000 * (index + 1) : 3600000 * (index + 1))),
        encheres: Object.fromEntries(Array.from({length: 6}, (_, i) => [firstname + i, {
          sender: i % 2 ? 'buyer' : 'other', vote: 2 + i * 3 + index,
          date: ts(now - 3600000 + Math.min(i, 4) * 300000 + (i === 5 ? 350 : 0)),
        }])),
      }),
    });
    const edition = { edition: 7, active: true, start: ts(now - 86400000), stop: ts(now + 86400000),
      nbFut: 100, nbComitard: 5, enchereMin: 1, enchereMax: 100,
      cercles: {
        seller: { name: 'Cercle Alpha', nbFut: 100, comitards: {
          camille: profile('Camille', 'Martin', 'La relève', 0),
          jules: profile('Jules', 'Dubois', 'Le grand talent', 1),
          elodie: profile('Élodie', 'Laurent', 'La tornade', 2),
        } },
        buyer: { name: 'Cercle Beta', nbFut: 50, comitards: {} },
        other: { name: 'Cercle des Étudiants en Sciences Économiques', nbFut: 80, comitards: {} },
      },
    };
    const data = { id: 'synthetic-preview', data: () => edition };
    export const useData = () => ({ data, fetchedTime: now, refetchData: () => {} });
    export const DataProvider = ({ children }) => children;
  `;
}

const auth = `
  export const useAuth = () => ({ user: { uid: 'buyer', displayName: 'Cercle Beta', email: 'demo-buyer@example.test' }, loading: false, isAdmin: () => false });
  export const AuthProvider = ({ children }) => children;
`;

async function run() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',
    headless: true, args: ['--no-sandbox'],
  });
  try {
    for (const width of (process.env.PREVIEW_WIDTH ? [Number(process.env.PREVIEW_WIDTH)] : [320, 390, 768, 1440])) {
      for (const state of ['empty', 'running', 'finished']) {
        const context = await browser.newContext({
          viewport: { width, height: 844 }, isMobile: width < 600, hasTouch: width < 600,
          locale: 'fr-BE', timezoneId: 'Europe/Brussels',
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => {
          const url = new URL(route.request().url());
          if (!['127.0.0.1', 'localhost', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.abort();
          if (['/src/data/DataProvider.tsx', '/src/data/data-context.ts'].includes(url.pathname)) return route.fulfill({ contentType: 'application/javascript', body: fixture(state) });
          if (['/src/auth/AuthProvider.tsx', '/src/auth/auth-context.ts'].includes(url.pathname)) return route.fulfill({ contentType: 'application/javascript', body: auth });
          return route.continue();
        });
        const screenshot = async (name, fullPage = true) => {
          if (width === 390 || width === 1440) {
            await page.mouse.move(0, 0);
            await page.screenshot({ path: path.join(output, `${name}-${width === 390 ? 'mobile' : 'desktop'}.png`), fullPage });
          }
        };
        const geometry = async label => {
          const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
          assert.ok(size.scroll <= size.client, `${width}px ${state} ${label} overflows: ${JSON.stringify(size)}`);
        };

        await page.goto(base + '/');
        const tabs = page.getByRole('tablist', { name: 'État des enchères' });
        await tabs.waitFor();
        await page.getByText('Bonjour, Cercle Beta.', { exact: true }).waitFor();
        if (width < 900) {
          const bounds = await tabs.boundingBox();
          const tabBounds = await Promise.all((await tabs.getByRole('tab').all()).map(tab => tab.boundingBox()));
          assert.ok(Math.abs(tabBounds[0].width - bounds.width / 2) <= 1, 'First tab should use half the available width');
          assert.ok(Math.abs(tabBounds[1].width - bounds.width / 2) <= 1, 'Second tab should use half the available width');
        }
        assert.equal(await page.getByText('Édition 7', { exact: true }).count(), 0);
        await geometry('results');

        if (state === 'empty') {
          await page.getByRole('heading', { name: 'Pas encore d’enchères' }).waitFor();
          assert.equal(await page.getByRole('textbox', { name: 'Rechercher une enchère' }).count(), 0);
          await screenshot('results-empty');
          await page.getByRole('tab', { name: 'Enchères remportées', exact: true }).click();
          await page.getByRole('heading', { name: 'Pas encore d’enchères' }).waitFor();
        } else if (state === 'finished') {
          await page.getByRole('heading', { name: 'Toutes les enchères sont terminées' }).waitFor();
          await screenshot('results-finished');
          await page.getByRole('button', { name: 'Voir les enchères remportées', exact: true }).click();
          await page.getByRole('button', { name: 'Voir la fiche de Camille Martin', exact: true }).waitFor();
          assert.equal(await page.locator('.MuiCardHeader-root').count(), 3);
          await page.locator('.recharts-wrapper').first().waitFor();
          await screenshot('results-winners');
          await page.getByRole('button', { name: 'Voir la fiche de Camille Martin', exact: true }).click();
          await checkModal(false, true);
        } else {
          await page.getByRole('button', { name: 'Voir la fiche de Camille Martin', exact: true }).waitFor();
          await page.locator('.recharts-wrapper').first().waitFor();
          await screenshot('results-running');
          await page.getByRole('button', { name: 'Voir la fiche de Camille Martin', exact: true }).click();
          await checkModal(false);
          await page.goto(base + '/comitards');
          await page.getByRole('tab', { name: 'Cercle Alpha', exact: true }).click();
          await page.getByRole('button', { name: 'Voir la fiche de Camille Martin', exact: true }).first().click();
          await checkModal(true);
        }

        async function checkModal(voting, finished = false) {
          const dialog = page.getByRole('dialog', { name: 'Camille Martin', exact: true });
          await dialog.waitFor();
          const bounds = await dialog.boundingBox();
          assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1 && bounds.y >= 0 && bounds.y + bounds.height <= 845, 'Modal should fit the viewport');
          const header = dialog.locator('header');
          assert.match(await header.innerText(), finished ? /Enchère gagnante\s+17 fûts/ : /Dernière enchère\s+17 fûts/);
          assert.match(await header.innerText(), finished ? /Remportée par/ : /Fin de l’enchère/);
          const close = header.getByRole('button', { name: 'Fermer la fiche', exact: true });
          const closeBounds = await close.boundingBox();
          const summaryBounds = await header.locator(':scope > div').last().boundingBox();
          assert.ok(summaryBounds.x + summaryBounds.width <= closeBounds.x, 'End date and close button must not overlap');
          assert.ok(closeBounds.width >= 44 && closeBounds.height >= 44, 'Close button must remain easy to tap');
          assert.equal(await dialog.getByRole('button', { name: 'Fermer', exact: true }).count(), 0);
          if (!voting) await screenshot(finished ? 'comitard-winner' : 'comitard-modal', false);
          const scroll = dialog.locator(':scope > div').last();
          await scroll.evaluate(element => { element.scrollTop = element.scrollHeight; });
          const table = dialog.getByRole('table', { name: 'Historique des enchères' });
          await table.waitFor();
          assert.match(await table.locator('tbody tr').first().innerText(), /\d{2}:\d{2}:\d{2},\d{3}/, 'Close bids should show milliseconds');
          assert.ok(await table.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'Bid history must fit its container');
          assert.equal(Math.round((await close.boundingBox()).y), Math.round(closeBounds.y), 'Close button must stay visible while scrolling');
          if (voting) {
            await dialog.getByRole('button', { name: 'Enchérir', exact: true }).waitFor();
            await screenshot('comitard-history', false);
          }
          await geometry('modal');
          await close.click();
          assert.equal(await page.getByRole('dialog').count(), 0);
        }

        assert.deepEqual(errors, [], `Browser errors at ${width}px, ${state}`);
        console.log(`PASS ${width}px ${state}: responsive tabs, page states, modal, no overflow or browser exceptions`);
        await context.close();
      }
      await checkLoadingAndRefresh(browser, width);
    }
    console.log(`Screenshots: ${output}`);
  } finally {
    await browser.close();
  }
}

async function checkLoadingAndRefresh(browser, width) {
  const context = await browser.newContext({
    viewport: { width, height: 844 }, isMobile: width < 600, hasTouch: width < 600,
    locale: 'fr-BE', timezoneId: 'Europe/Brussels', reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const errors = [];
  let loading = true;
  let dataLoading = false;
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.abort();
    if (['/src/data/DataProvider.tsx', '/src/data/data-context.ts'].includes(url.pathname)) return route.fulfill({
      contentType: 'application/javascript',
      body: fixture('running').replace('({ data, fetchedTime: now,', `({ data: ${dataLoading ? 'null' : 'data'}, fetchedTime: now,`),
    });
    if (['/src/auth/AuthProvider.tsx', '/src/auth/auth-context.ts'].includes(url.pathname)) return route.fulfill({
      contentType: 'application/javascript',
      body: `export const useAuth=()=>({user:null,loading:${loading},isAdmin:()=>false}); export const AuthProvider=({children})=>children;`,
    });
    return route.continue();
  });
  const screenshot = async name => {
    if (width === 390 || width === 1440) {
      await page.mouse.move(0, 0);
      await page.screenshot({ path: path.join(output, `${name}-${width === 390 ? 'mobile' : 'desktop'}.png`) });
    }
  };
  const geometry = async () => {
    const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    assert.ok(size.scroll <= size.client, `Loading or refresh layout should fit at ${width}px`);
  };

  await page.goto(base + '/');
  await page.getByRole('status', { name: 'Chargement du mercato' }).waitFor();
  await geometry();
  const screenHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  assert.ok(screenHeight <= 844, 'Startup loader should not add page scrolling');
  await screenshot('loading');

  loading = false;
  await page.goto(base + '/');
  const refresh = page.getByRole('button', { name: 'Actualiser les enchères', exact: true });
  await refresh.waitFor();
  const bounds = await refresh.boundingBox();
  assert.ok(bounds.width >= 44 && bounds.height >= 44, 'Refresh should have a comfortable tap target');
  await page.locator('.recharts-wrapper').first().waitFor();
  await geometry();
  await screenshot('results-visitor');
  await refresh.click();
  assert.equal(await refresh.getAttribute('aria-busy'), 'true');
  assert.equal(await refresh.isDisabled(), true);
  await page.waitForFunction(() => !document.querySelector('[aria-label="Actualiser les enchères"]').disabled);
  assert.equal(await refresh.getAttribute('aria-busy'), 'false');
  await page.getByRole('heading', { name: 'Résultats', exact: true }).waitFor();

  dataLoading = true;
  await page.goto(base + '/comitards');
  const inlineLoader = page.getByRole('status', { name: 'Chargement du mercato' });
  await inlineLoader.waitFor();
  assert.ok((await inlineLoader.boundingBox()).height <= 280, 'Inline loading should not occupy an extra viewport');
  await geometry();
  await screenshot('directory-loading');
  assert.deepEqual(errors, [], `Loading and refresh errors at ${width}px`);
  console.log(`PASS ${width}px: startup loading, inline loading, visitor refresh and reduced motion`);
  await context.close();
}

run().catch(error => { console.error(error); process.exitCode = 1; });
