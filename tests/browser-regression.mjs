import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('out');
const evidenceDir=path.resolve(process.env.BROWSER_EVIDENCE_DIR || 'test-results/browser');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.mp3':'audio/mpeg','.m4a':'audio/mp4'};
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  if(!url.pathname.startsWith('/cripted/')) {res.writeHead(404).end();return;}
  let file=path.resolve(root,decodeURIComponent(url.pathname.slice('/cripted/'.length)));
  if(!file.startsWith(root+path.sep)&&file!==root) {res.writeHead(403).end();return;}
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  const buffer=await readFile(file),type=types[path.extname(file)]||'application/octet-stream';
  const range=/bytes=(\d+)-(\d*)/.exec(req.headers.range||'');
  if(range) {
   const start=Number(range[1]),end=Math.min(range[2]?Number(range[2]):buffer.length-1,buffer.length-1);
   res.writeHead(206,{'Content-Type':type,'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${buffer.length}`,'Content-Length':end-start+1});res.end(buffer.subarray(start,end+1));
  } else {res.writeHead(200,{'Content-Type':type,'Content-Length':buffer.length});res.end(buffer);}
 } catch {res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
server.unref();
const base=`http://127.0.0.1:${server.address().port}/cripted`;
const browser=await chromium.launch({headless:true});
const results=[],errors=[];
await mkdir(evidenceDir,{recursive:true});
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage();let audioRequests=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',r=>{if(r.url().includes('/audio/'))audioRequests.push(r.url());});
 for(const algo of ['des','aes','rc5','idea','gost','rc4','rc6','cast','blowfish']) {
  audioRequests=[];
  await page.goto(`${base}/algorithms/${algo}/`);
  await page.getByLabel('النص الأصلي (Plaintext):',{exact:false}).fill('  رسالة 🔐 اختبار\nنهاية  ');
  await page.getByLabel('المفتاح السري (Key / Password):',{exact:false}).fill('test-key');
  await page.getByRole('button',{name:/تشفير الكتلة/}).click();
  await page.waitForFunction(()=>/^[0-9a-f]+$/.test(document.querySelector('output').textContent));
  await page.getByRole('button',{name:/فك التشفير.*Decrypt/}).click();
  await page.waitForFunction(()=>document.querySelector('output').textContent==='  رسالة 🔐 اختبار\nنهاية  ');
  assert.equal(await page.locator('audio').getAttribute('src'),null);
  assert.equal(audioRequests.length,0);
  results.push(`${algo}: UI roundtrip and zero initial audio`);
  console.log('PASS',algo);
 }
 // Pending transcript seek and offline save must not initialize the media element.
 await page.goto(`${base}/algorithms/rc4/`);audioRequests=[];
 const transcript=page.locator('[id="podcast-transcript-rc4"]');
 await transcript.locator('button').nth(1).click();
 assert.equal(await page.locator('audio').getAttribute('src'),null);
 assert.equal(audioRequests.length,0);
 await page.getByRole('button',{name:/حفظ في الكاش|^حفظ$/}).click();
 await page.getByText('محفوظ في كاش المتصفح (Offline Ready)').waitFor();
 assert.equal(await page.locator('audio').getAttribute('src'),null);
 results.push('Transcript seek and explicit offline save preserve unset src');
 await page.getByRole('button',{name:'تشغيل البودكاست',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('audio').getAttribute('src')?.startsWith('blob:'));
 await page.waitForFunction(()=>!document.querySelector('audio').paused);
 await page.getByRole('button',{name:'إيقاف مؤقت',exact:true}).click();
 results.push('Explicit Play uses cached audio and pauses');
 await page.goto(`${base}/algorithms/blowfish/`);
 await page.getByRole('button',{name:'تشغيل البودكاست',exact:true}).click();
 await page.getByText('محفوظ في كاش المتصفح (Offline Ready)').waitFor();
 await page.waitForFunction(()=>document.querySelector('audio').getAttribute('src')?.startsWith('blob:'));
 await page.waitForFunction(()=>!document.querySelector('audio').paused);
 await page.getByRole('button',{name:'إيقاف مؤقت',exact:true}).click();
 await context.setOffline(true);
 await page.getByRole('button',{name:'تشغيل البودكاست',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('audio').paused);
 await context.setOffline(false);
 results.push('Automatic cache adoption preserves playback and resumes while offline');
 // Image state survives switching modes; bounds errors never overwrite the payload.
 for(const [name,width] of [['desktop',1440],['tablet',768],['mobile',390]]) {
  await page.setViewportSize({width,height:1000});
  await page.goto(`${base}/steganography/`);
  const field=page.getByLabel('الرسالة السرية المراد تضمينها (Secret Message):');
  const msg='رسالة سرية 🔐';await field.fill(msg);
  await page.getByRole('button',{name:/إخفاء الرسالة داخل/}).click();
  const snapshot=await page.locator('canvas').evaluate(c=>c.toDataURL());
  await page.getByRole('button',{name:'إخفاء في الملفات الصوتية (WAV LSB)',exact:true}).click();
  await page.getByRole('button',{name:'إخفاء في الصور الرقمية (BMP LSB)',exact:true}).click();
  assert.equal(await page.locator('canvas').evaluate(c=>c.toDataURL()),snapshot);
  await page.getByRole('button',{name:/استخراج الرسالة من/}).click();
  await page.locator('p.font-mono').filter({hasText:msg}).waitFor();
  await field.fill('a'.repeat(5001));
  await page.getByRole('button',{name:/إخفاء الرسالة داخل/}).click();
  await page.getByRole('button',{name:/استخراج الرسالة من/}).click();
  await page.locator('p.font-mono').filter({hasText:'a'.repeat(5001)}).waitFor();
  await field.fill('x'.repeat(14397));
  await page.getByRole('button',{name:/إخفاء الرسالة داخل/}).click();
  await page.getByText(/الرسالة أكبر من سعة الصورة/).waitFor();
  const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(metrics.scroll<=metrics.width+1,`${name} overflow ${JSON.stringify(metrics)}`);
  await field.fill(msg);
  await page.screenshot({path:path.join(evidenceDir,`${name}.png`),fullPage:true});
  await page.getByRole('button',{name:'Dark mode',exact:true}).click();
  await page.waitForFunction(()=>document.documentElement.classList.contains('dark'));
  assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
  await page.screenshot({path:path.join(evidenceDir,`${name}-dark.png`),fullPage:true});
  await page.getByRole('button',{name:'Light mode',exact:true}).click();
  results.push(`${name}: preserved canvas, 5001-byte extraction, overflow rejection, layout`);
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(`${base}/algorithms/aes/`);
 const menu=page.getByRole('button',{name:'خوارزميات التشفير',exact:true});
 await menu.focus();await page.keyboard.press('Enter');assert.equal(await menu.getAttribute('aria-expanded'),'true');
 await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');
 assert.ok(await menu.evaluate(el=>el===document.activeElement));
 // SPA navigation must reset algorithm inputs.
 await menu.press('Enter');await page.locator('#algorithm-navigation').getByRole('link',{name:/RC6/}).click();
 await page.waitForURL('**/algorithms/rc6/');
 assert.ok((await page.getByLabel('النص الأصلي (Plaintext):',{exact:false}).inputValue()).includes('RC6'));
 results.push('Keyboard Escape focus return and SPA algorithm reset');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:results.length,results,errors},null,2));
 await writeFile(path.join(evidenceDir,'results.json'),JSON.stringify({results,errors},null,2));
} finally {await browser.close();await new Promise(r=>server.close(r));}
