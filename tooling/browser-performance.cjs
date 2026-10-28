const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright-core');
const fs = require('node:fs');
(async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser', headless: true, args: ['--no-sandbox'] });
 const results = [];
 for (let run=0; run<3; run++) {
  const context = await browser.newContext({ viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error=>errors.push(error.message));
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:4173/') ? route.continue() : route.abort());
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:200000,uploadThroughput:100000});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await page.getByText(/Aucune enchère n'est en cours/).waitFor({timeout:45000});
  const visible = await page.evaluate(()=>performance.now());
  await page.waitForTimeout(300);
  const metrics = await page.evaluate(()=>({paints:performance.getEntriesByType('paint').map(p=>({name:p.name,ms:p.startTime})),scripts:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.js')).map(r=>({name:r.name.split('/').pop(),bytes:r.decodedBodySize}))}));
  results.push({run,visible,errors,...metrics});
  await context.close();
 }
 await browser.close();
 if (process.argv[2]) fs.writeFileSync(process.argv[2],JSON.stringify(results,null,2));
 console.log(JSON.stringify(results.map(r=>({run:r.run,visibleMs:Math.round(r.visible),fcpMs:Math.round(r.paints.find(p=>p.name==='first-contentful-paint')?.ms||0),scriptBytes:r.scripts.reduce((sum,s)=>sum+s.bytes,0),scripts:r.scripts.length,errors:r.errors})),null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
