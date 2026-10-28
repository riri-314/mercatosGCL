const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright-core');
const base = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5175';
let browser;
let activePage;
let activeErrors;
(async () => {
 browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',headless:true,args:['--no-sandbox'] });
 for (const role of ['buyer','admin']) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors=[];
  activePage=page;
  activeErrors=errors;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  await page.goto(base + '/comitards');
  await page.getByRole('tab',{name:'Cercle Beta',exact:true}).waitFor({timeout:20000});
  await page.goto(base + '/login');
  await page.getByLabel('Email',{exact:true}).fill(`demo-${role}@example.test`);
  await page.getByLabel('Mot de passe',{exact:true}).fill('EmulatorOnly123!');
  await page.getByRole('button',{name:'Connexion',exact:true}).click();
  await page.waitForURL(base + '/');
  await page.goto(base + '/account');
  try {
    if(role==='buyer') await page.getByRole('heading',{name:'Mon cercle',exact:true}).waitFor({timeout:15000});
    else await page.getByRole('heading',{name:'Administration',exact:true}).waitFor({timeout:15000});
  } catch(error) {
    console.log('BROWSERSTATE',page.url(),await page.locator('body').innerText());
    console.log('BROWSERERRORS',errors);
    throw error;
  }
  assert.equal(await page.getByRole('button',{name:'DEBUG VOTE',exact:true}).count(),0);
  await page.getByRole('button',{name:'Créer nouveau comitard',exact:true}).click();
  await page.getByRole('textbox',{name:'Nom',exact:true}).waitFor();
  await page.locator('input[type="file"]').setInputFiles({
    name:'demo.png',mimeType:'image/png',
    buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jFzQAAAAASUVORK5CYII=','base64'),
  });
  await page.getByRole('button',{name:'Supprimer image',exact:true}).waitFor();
  if(role==='admin') {
    await page.getByRole('tab',{name:'Éditions',exact:true}).click();
    await page.getByRole('button',{name:'Créer une nouvelle édition',exact:true}).click();
    await page.locator('[contenteditable="true"]').waitFor();
    await page.getByText('Page 1',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Suivant',exact:true}).click();
    await page.locator('[role="row"][data-id="1"]').waitFor();
    await page.getByText('Page 2',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Précédent',exact:true}).click();
    await page.locator('[role="row"][data-id="13"]').waitFor();
  }
  await page.waitForTimeout(500);
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${role} login, edition data, deferred forms and picture compression; no browser exceptions`);
  await context.close();
 }
 await browser.close();
})().catch(async e=>{
 console.error(e);
 if(activePage && !activePage.isClosed()) console.error('BROWSERSTATE',activePage.url(),await activePage.locator('body').innerText(),'BROWSERERRORS',activeErrors);
 process.exitCode=1;
}).finally(()=>browser?.close());
