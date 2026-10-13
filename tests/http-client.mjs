import {request} from 'node:http';
export async function transportFetch(url,options={}){
 if(!new Headers(options.headers).has('Host'))return fetch(url,options);
 return new Promise((resolve,reject)=>{const req=request(url,{agent:false,method:options.method||'GET',headers:Object.fromEntries(new Headers(options.headers))},res=>{const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:res.statusCode,headers:res.headers})));});req.on('error',reject);req.end(options.body);});
}
export async function secureTestFetch(url,options={}){
 const method=(options.method||'GET').toUpperCase();if(['GET','HEAD'].includes(method))return transportFetch(url,options);
 const headers=new Headers(options.headers||{}),origin=new URL(url).origin;
 const tokenResponse=await transportFetch(origin+'/api/csrf',{headers:{Cookie:headers.get('Cookie')||'',...(headers.has('Host')?{Host:headers.get('Host')}:{}),...(headers.has('X-Forwarded-Proto')?{'X-Forwarded-Proto':headers.get('X-Forwarded-Proto')}:{})}});
 const token=await tokenResponse.json();const nonce=tokenResponse.headers.get('set-cookie')?.split(';')[0];if(nonce)headers.set('Cookie',[headers.get('Cookie'),nonce].filter(Boolean).join('; '));headers.set('X-CSRF-Token',token.token||'');return transportFetch(url,{...options,headers});
}

