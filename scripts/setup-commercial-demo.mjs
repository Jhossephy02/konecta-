import assert from 'node:assert/strict';
import {secureTestFetch} from '../tests/http-client.mjs';
const base='http://127.0.0.1:3001/api';
assert.equal((await(await fetch(base+'/config')).json()).demoEnabled,true,'Requiere demostración local.');
let cookie='';async function api(path,method='GET',body,extra={}){const r=await secureTestFetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':Buffer.isBuffer(body)?'image/png':'application/json',...extra},body:body===undefined?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body)});if(r.headers.get('set-cookie')?.startsWith('portal_session='))cookie=r.headers.get('set-cookie').split(';')[0];const data=await r.json();assert.ok(r.ok,JSON.stringify(data));return data;}
await api('/demo','POST',{role:'superadmin'});const companies=await api('/platform/companies');const company=companies.find(c=>c.name==='El Reino de las Alas · Demostración')||companies.find(c=>c.slug.startsWith('simulacion-'));assert.ok(company,'Ejecuta primero la simulación de empresa.');
await api('/platform/context','POST',{companyId:company.id});await api('/company-settings','PATCH',{name:'El Reino de las Alas · Demostración',accent:'#03122E'});
const source=companies.find(c=>c.slug==='paraiso');if(source){const r=await fetch(base+'/platform/companies/'+source.id+'/logo',{headers:{Cookie:cookie}});if(r.ok)await api('/company-logo','POST',Buffer.from(await r.arrayBuffer()),{'Content-Type':r.headers.get('content-type'),'X-Brand-Color':'#03122E'});}
const {items}=await api('/content');if(!items.some(c=>c.data?.title==='Bienvenidos a El Reino de las Alas'))await api('/content','POST',{type:'anuncios',data:{title:'Bienvenidos a El Reino de las Alas',description:'DEMO COMERCIAL · Aquí cada persona aprende a su ritmo, consulta su boleta y presenta solicitudes con su cuenta. Los responsables revisan las justificaciones de su equipo. Todos los nombres, importes y casos mostrados son ficticios.'}});
console.log(JSON.stringify({name:'El Reino de las Alas · Demostración',url:'/conecta/'+company.slug+'/#inicio',id:company.id}));

