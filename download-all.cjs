const fs=require('node:fs');
const path=require('node:path');
const config=require('./game-config.json');
const origin=`http://127.0.0.1:${config.port}/`;
async function main(){
 const urls=new Set();
 const index=fs.readFileSync(path.join(__dirname,'www/index.html'),'utf8');
 for(const m of index.matchAll(/(?:src|href)=["']([^"']+)["']/g)) if(!/^(?:https?:|data:|#)/.test(m[1]))urls.add(m[1]);
 if(config.name==='9 Ball Pool') {
  const response=await fetch(origin+'config.json');if(!response.ok)throw new Error('Missing config.json');
  const manifest=await response.json();
  for(const scene of manifest.scenes||[])urls.add(scene.url);
  for(const asset of Object.values(manifest.assets||{})) {
   if(asset.file?.url)urls.add(asset.file.url);
   for(const variant of Object.values(asset.file?.variants||{}))if(variant.url)urls.add(variant.url);
  }
  const modules=fs.readFileSync(path.join(__dirname,'www/__settings__.js'),'utf8');
  for(const m of modules.matchAll(/(?:glueUrl|wasmUrl|fallbackUrl)'?\s*:\s*'([^']+)'/g))urls.add(m[1]);
 }
 const list=[...urls],results=[];let next=0;
 await Promise.all(Array.from({length:6},async()=>{while(next<list.length){const uri=list[next++];try{const res=await fetch(new URL(uri,origin));const body=await res.arrayBuffer();results.push({uri,status:res.status,bytes:body.byteLength});}catch(e){results.push({uri,error:e.message});}}}));
 fs.writeFileSync(path.join(__dirname,'logs/prefetch.json'),JSON.stringify(results,null,2));
 const failed=results.filter(x=>x.status!==200);console.log(JSON.stringify({total:results.length,failed},null,2));
 if(failed.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
