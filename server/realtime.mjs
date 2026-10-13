import {tenant} from './access.mjs';
export function realtime({userFor,heartbeat=15000}){
 const clients=new Set();
 function send(client,event){if(client.res.writableEnded||client.res.destroyed)return false;if(client.res.writableLength>65536){client.res.end();return false;}return client.res.write(`event: ${event}\ndata: {}\n\n`);}
 function validate(client){try{const user=userFor(client.req);if(tenant(user)!==client.company){send(client,'context');client.res.end();return null;}return user;}catch{send(client,'auth');client.res.end();return null;}}
 function notify(company){for(const c of clients){const user=validate(c);if(user&&(tenant(user)===company||user.role==='superadmin'))send(c,'change');}}
 function subscribe(req,res,user){
  if([...clients].filter(c=>c.userId===user.id).length>=6){res.writeHead(429,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Máximo 6 conexiones en tiempo real por cuenta.'}));return;}
  res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();
  const client={req,res,userId:user.id,company:tenant(user)};clients.add(client);send(client,'ready');
  const timer=setInterval(()=>{if(validate(client))send(client,'heartbeat');},heartbeat);timer.unref();
  res.on('close',()=>{clearInterval(timer);clients.delete(client);});
 }
 function close(){for(const c of clients)c.res.end();clients.clear();}
 return {notify,subscribe,close};
}
