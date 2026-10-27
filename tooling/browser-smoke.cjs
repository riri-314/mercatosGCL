const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright-core');
let browser;
(async () => {
 browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',headless:true,args:['--no-sandbox'] });
 for (const role of ['buyer','admin']) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  await page.goto('http://127.0.0.1:5175/comitards');
  await page.getByText('Cercle Beta',{exact:true}).waitFor({timeout:20000});
  await page.goto('http://127.0.0.1:5175/login');
  await page.getByLabel('Email',{exact:true}).fill(`demo-${role}@example.test`);
  await page.getByLabel('Mot de passe',{exact:true}).fill('EmulatorOnly123!');
  await page.getByRole('button',{name:'Connexion',exact:true}).click();
  await page.waitForURL('http://127.0.0.1:5175/');
  await page.goto('http://127.0.0.1:5175/account');
  try {
    if(role==='buyer') await page.getByText(/Bonjour, bienvenue/).waitFor({timeout:15000});
    else await page.getByText('Créer une nouvelle édition',{exact:true}).waitFor({timeout:15000});
  } catch(error) {
    console.log('BROWSERSTATE',page.url(),await page.locator('body').innerText());
    console.log('BROWSERERRORS',errors);
    throw error;
  }
  await page.waitForTimeout(500);
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${role} login, edition data and account route; no browser exceptions`);
  await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>browser?.close());
