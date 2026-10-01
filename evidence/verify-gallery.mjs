// Replay with ego-browser nodejs < evidence/verify-gallery.mjs, using an active TaskSpace id below.
const fs=await import('node:fs/promises'),crypto=await import('node:crypto');
const task=await taskSpace(16),page=task.page('p1');
// Ego executes in its own runtime; set this to the checkout path when replaying.
const root='/Volumes/BigBoom/01-Project/仝学-学/参考项目/3D 人体展示/output/tongxue-research-gallery-20261002';
const base=process.env.GALLERY_URL||'http://127.0.0.1:8745',label=base.includes('127.0.0.1')?'local':'public';
const report={url:base,time:new Date().toISOString(),pages:[],styles:[],rapid:[]};
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const ready=()=>page.waitForFunction(()=>document.querySelector('.stage').dataset.state==='ready',undefined,{timeout:60000});
const save=()=>fs.writeFile(root+'/evidence/'+label+'-audit.json',JSON.stringify(report,null,2));
await page.cdp('Network.enable');await page.cdp('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto(base+'/?acceptance='+Date.now()+'#01/home');await ready();
for(const i of (label==='local'?Array.from({length:20},(_,i)=>i):[0,5,10,19])){
 const id=String(i+1).padStart(2,'0');
 await page.click(`.choice[data-index="${i}"]`);
 await page.waitForFunction(i=>{const img=document.querySelector(`.choice[data-index="${i}"] img`);return img.complete&&img.naturalWidth>0;},i,{timeout:30000});
 for(const key of ['home','papers','demos','service']){
  await page.click(`.page-tab[data-page="${key}"]`);await ready();
  const row=await page.evaluate(()=>{
   const q=s=>document.querySelector(s),img=q('#concept'),notes=q('#designNotes');
   return {hash:location.hash,src:img.currentSrc,title:q('#title').textContent,design:q('#designStyle').textContent,original:q('#original').href,download:q('#download').href,size:[img.naturalWidth,img.naturalHeight],notesVisible:q('#designBody').checkVisibility(),notesBelow:notes.getBoundingClientRect().top>=q('.focus').getBoundingClientRect().bottom,notesSections:q('#designBody').querySelectorAll('dt').length,methodTerms:['生信分析','医学统计','人工智能','预测建模'].every(t=>notes.textContent.includes(t))};
  });
  assert(row.hash===`#${id}/${key}`&&row.src.includes(`/images/${id}-${key}.png?`)&&row.src===row.original&&row.src===row.download&&row.title===row.design.replace(' · ',' / ')&&row.notesVisible&&row.notesBelow&&row.notesSections===13&&row.methodTerms,JSON.stringify(row));
  report.pages.push(row);
 }
 await page.click('#overviewButton');
 assert(await page.evaluate(id=>{const q=s=>document.querySelector(s);return !q('.overview').hidden&&[...document.querySelectorAll('.tile img')].every(i=>i.src.includes('/'+id+'-'))&&q('#designNotes').getBoundingClientRect().top>=q('.overview').getBoundingClientRect().bottom;},id),'Overview '+id);
 await page.click('#overviewButton');assert(await page.evaluate(()=>!document.querySelector('.focus').hidden),'Return single');
 for(const key of ['home','papers','demos','service']){await page.click('#overviewButton');await page.click(`.tile[data-page="${key}"]`);await ready();assert(await page.evaluate(({id,key})=>location.hash===`#${id}/${key}`,{id,key}),'Tile link');}
 await page.click('#motionButton');assert(await page.evaluate(()=>document.querySelector('#motionButton').getAttribute('aria-pressed')==='false'&&document.getAnimations().filter(a=>a.effect.target.closest('.fx')).every(a=>a.playState==='paused')),'Pause');
 await page.click('#motionButton');assert(await page.evaluate(()=>document.getAnimations().some(a=>a.effect.target.closest('.fx')&&a.playState==='running')),'Play');
 await page.click('#fitSize');assert(await page.evaluate(()=>document.querySelector('#fitSize').getAttribute('aria-pressed')==='true'),'Fit');
 await page.click('#nativeSize');assert(await page.evaluate(()=>{const i=document.querySelector('#concept');return i.getBoundingClientRect().width*devicePixelRatio<=i.naturalWidth+1;}),'Native');
 const expected=await page.evaluate(()=>document.querySelector('#original').href),popupWait=page.waitForEvent('popup');await page.click('#original');const popup=await popupWait;
 await popup.waitForFunction(()=>document.images[0]?.complete&&document.images[0]?.naturalWidth>0,undefined,{timeout:60000});assert(await popup.url()===expected,'Original');await popup.close();
 const downWait=page.waitForEvent('download',{timeout:60000});await page.click('#download');const download=await downWait;const saved=root+'/evidence/download-check.png';await download.saveAs(saved);
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');assert(hash(await fs.readFile(saved))===hash(await fs.readFile(root+'/public/images/'+id+'-service.png')),'Download bytes');
 await page.click('#next');assert(await page.evaluate(id=>location.hash.startsWith('#'+id+'/'),String((i+1)%20+1).padStart(2,'0')),'Next');await page.click('#previous');assert(await page.evaluate(id=>location.hash.startsWith('#'+id+'/'),id),'Previous');
 report.styles.push({id,thumbnail:true,overview:true,tiles:4,motion:true,sizing:true,original:true,download:true,previousNext:true});await save();console.log('Verified '+id);
}
await page.cdp('Network.enable');await page.cdp('Network.setCacheDisabled',{cacheDisabled:true});
await page.cdp('Network.emulateNetworkConditions',{offline:false,latency:700,downloadThroughput:500000,uploadThroughput:500000});
try{
 for(const selector of ['.choice[data-index="0"]','.page-tab[data-page="papers"]','.choice[data-index="5"]','.page-tab[data-page="home"]','.choice[data-index="19"]','.page-tab[data-page="demos"]']){
  await page.click(selector);const state=await page.evaluate(()=>({hash:location.hash,state:document.querySelector('.stage').dataset.state,visibility:getComputedStyle(document.querySelector('#concept')).visibility,message:document.querySelector('#loadMessage').textContent}));assert(state.state==='loading'&&state.visibility==='hidden','Stale image '+JSON.stringify(state));report.rapid.push(state);
 }
}finally{await page.cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await page.cdp('Network.setCacheDisabled',{cacheDisabled:false});}
await ready();assert(await page.evaluate(()=>location.hash==='#20/demos'&&document.querySelector('#concept').currentSrc.includes('/20-demos.png?')),'Rapid final');
await page.cdp('Network.setCacheDisabled',{cacheDisabled:true});await page.cdp('Network.setBlockedURLs',{urls:['*20-papers.png*']});
try{await page.click('.page-tab[data-page="papers"]');await page.waitForFunction(()=>document.querySelector('.stage').dataset.state==='error',undefined,{timeout:15000});assert(await page.evaluate(()=>!document.querySelector('#retryImage').hidden&&getComputedStyle(document.querySelector('#concept')).visibility==='hidden'),'Error feedback');}
finally{await page.cdp('Network.setBlockedURLs',{urls:[]});await page.cdp('Network.setCacheDisabled',{cacheDisabled:false});}
await page.click('#retryImage');await ready();report.retry=true;
await page.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
await page.click('.choice[data-index="0"]');await ready();await page.click('.choice[data-index="19"]');await ready();
await page.click('.page-tab[data-page="home"]');await ready();
report.mobile=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,notesVisible:document.querySelector('#designBody').checkVisibility()}));assert(report.mobile.documentWidth===390&&report.mobile.notesVisible,'Mobile overflow');
await page.evaluate(()=>scrollTo(0,document.querySelector('#designNotes').getBoundingClientRect().top+scrollY-160));await page.screenshot({path:root+'/evidence/'+label+'-mobile.png'});
await page.cdp('Emulation.clearDeviceMetricsOverride',{});await page.evaluate(()=>scrollTo(0,document.querySelector('#designNotes').getBoundingClientRect().top+scrollY-240));
await page.screenshot({path:root+'/evidence/'+label+'-design-notes.png'});
const mdWait=page.waitForEvent('download',{timeout:30000});await page.click('.design-links a');const md=await mdWait;await md.saveAs(root+'/evidence/DESIGN-download.md');assert(await fs.readFile(root+'/evidence/DESIGN-download.md','utf8')===await fs.readFile(root+'/public/DESIGN.md','utf8'),'Design download');
report.designDownload=true;
await page.click('.brand');await ready();assert(await page.evaluate(()=>location.hash==='#01/home'),'Brand home');
await page.keyboard.press('ArrowRight');await ready();assert(await page.evaluate(()=>location.hash==='#02/home'),'Keyboard next');
await page.keyboard.press('ArrowLeft');await ready();assert(await page.evaluate(()=>location.hash==='#01/home'),'Keyboard previous');report.navigation=true;
await page.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await page.reload();await ready();assert(await page.evaluate(()=>document.querySelector('#motionButton').getAttribute('aria-pressed')==='false'&&document.body.classList.contains('paused')),'Reduced motion default');
await page.click('#motionButton');assert(await page.evaluate(()=>document.getAnimations().some(a=>a.effect.target.closest('.fx')&&a.playState==='running')),'Reduced motion manual play');
await page.cdp('Emulation.setEmulatedMedia',{features:[]});report.reducedMotion=true;
assert(report.pages.length===(label==='local'?80:16),'Expected page coverage');report.passed=true;await save();console.log({pages:report.pages.length,styles:report.styles.length,passed:true});
