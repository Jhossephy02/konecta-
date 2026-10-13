let csrfPromise;
function csrf(){if(!csrfPromise)csrfPromise=fetch('/api/csrf',{credentials:'same-origin',cache:'no-store'}).then(async r=>{const b=await r.json();if(!r.ok)throw Error(b.error||'No se pudo proteger el formulario.');return b.token;}).catch(e=>{csrfPromise=null;throw e;});return csrfPromise;}
export async function secureFetch(url,options={}){
 const method=(options.method||'GET').toUpperCase(),write=!['GET','HEAD'].includes(method);
 const run=async()=>{const headers=new Headers(options.headers||{});if(write)headers.set('X-CSRF-Token',await csrf());return fetch(url,{...options,credentials:'same-origin',cache:'no-store',headers});};
 let response=await run();if(write&&response.status===403){const error=await response.clone().json().catch(()=>({}));if(error.code==='CSRF'){csrfPromise=null;response=await run();}}
 if(write&&response.ok&&/^\/api\/(?:login|logout)(?:$|\?)/.test(url))csrfPromise=null;
 return response;
}
export async function api(path,options={}){const response=await secureFetch(`/api${path}`,{...options,headers:{'Content-Type':'application/json',...options.headers},body:options.body===undefined?undefined:JSON.stringify(options.body)});const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error||'No se pudo completar la operación.'),{status:response.status,code:data.code,security:data.security});return data;}
export async function uploadFile(recordId,file){const response=await secureFetch(`/api/records/${recordId}/attachment`,{method:'POST',headers:{'Content-Type':file.type||'text/plain','X-File-Name':encodeURIComponent(file.name)},body:file});const data=await response.json();if(!response.ok)throw Error(data.error||'No se pudo guardar el adjunto.');return data;}
