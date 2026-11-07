const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {spawn} = require('node:child_process');
const ROOT = __dirname;
const WEB = path.join(ROOT, 'www');
const config = require('./game-config.json');
const BASE = config.base;
const pending = new Map();
const external = ['game-cdn.poki.com'];
fs.mkdirSync(path.join(ROOT, 'logs'), {recursive:true});
function log(x) {fs.appendFileSync(path.join(ROOT,'logs/downloads.jsonl'), JSON.stringify({time:new Date().toISOString(),...x})+'\n');}
function localize(s) {
  for(const host of external) s=s.replaceAll('https://'+host+'/', '/__remote/'+host+'/').replaceAll('http://'+host+'/', '/__remote/'+host+'/');
  return s;
}
function locate(uri) {
  const u = new URL(uri, 'http://localhost');
  let rel = decodeURIComponent(u.pathname).replace(/^\//,'');
  if(!rel || rel.endsWith('/')) rel+='index.html';
  if (/[<>:"|?*\x00-\x1f]/.test(rel) || rel.includes('\\')) throw new Error('Invalid path');
  const dest=path.resolve(WEB,rel);
  if(!dest.startsWith(WEB+path.sep)) throw new Error('Path outside www');
  let url;
  if(rel.startsWith('__remote/')) {
    const host=rel.split('/')[1];
    if(!external.includes(host)) throw new Error('Origin outside game scope');
    url='https://'+rel.slice('__remote/'.length)+u.search;
  } else url=new URL(rel+u.search,BASE).href;
  return {dest,url,rel};
}
async function download(uri) {
  const {dest,url,rel}=locate(uri);
  if(fs.existsSync(dest)) return dest;
  if(pending.has(dest)) return pending.get(dest);
  const promise=(async()=>{
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    const tmp=dest+'.download';
    await new Promise((resolve,reject)=>{
      const child=spawn('curl.exe',['-sS','-L','--fail','--compressed','--retry','2','--connect-timeout','15','--max-time','120','--referer','https://poki.com/','-o',tmp,'-w','%{http_code}',url],{windowsHide:true});
      let status='',err='';
      child.stdout.on('data',x=>status+=x);child.stderr.on('data',x=>err+=x);
      child.on('error',reject);
      child.on('close',code=>{
        if(code===0 && /^2\d\d$/.test(status.trim())) resolve();
        else {if(fs.existsSync(tmp))fs.unlinkSync(tmp);log({url,status,error:err.trim()});reject(new Error('Upstream '+status+': '+rel));}
      });
    });
    if(/\.(html|js|css|json)$/i.test(dest)) fs.writeFileSync(tmp,localize(fs.readFileSync(tmp,'utf8')));
    fs.renameSync(tmp,dest);
    log({url,status:200,path:rel,bytes:fs.statSync(dest).size});
    return dest;
  })();
  pending.set(dest,promise);
  try{return await promise;}finally{pending.delete(dest);}
}
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.woff':'font/woff','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  try {
    log({event:'nginx-404',uri:req.url});
    const file=await download(req.url);
    res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Length':fs.statSync(file).size,'X-Game-Cache':'downloaded-after-404'});
    if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
  } catch(e) {res.writeHead(404,{'Content-Type':'text/plain'});res.end(e.message);}
}).listen(config.helperPort,'127.0.0.1',()=>console.log('curl helper: '+config.helperPort));
