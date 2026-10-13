import {useEffect,useRef,useState} from 'react';
export default function useRealtime(user,refresh){
 const callback=useRef(refresh);callback.current=refresh;const[state,setState]=useState('connecting');
 useEffect(()=>{
  if(!user)return;let alive=true,source,timer,refreshing=false,queued=false;
  const synchronize=async()=>{if(refreshing){queued=true;return;}refreshing=true;try{await callback.current();if(alive)window.dispatchEvent(new Event('portal:updated'));}finally{refreshing=false;if(queued&&alive){queued=false;timer=setTimeout(synchronize,120);}}};
  const change=()=>{clearTimeout(timer);timer=setTimeout(synchronize,150);};
  const connect=()=>{source=new EventSource('/api/events');source.addEventListener('ready',()=>{if(alive){setState('live');change();}});source.addEventListener('change',change);source.addEventListener('context',()=>{source.close();change();});source.addEventListener('auth',()=>{source.close();setState('expired');synchronize();});source.onerror=()=>{if(alive)setState(navigator.onLine?'reconnecting':'offline');};};
  const online=()=>{source?.close();setState('connecting');connect();change();},offline=()=>setState('offline');
  const focus=()=>{if(document.visibilityState==='visible')change();};
  connect();window.addEventListener('online',online);window.addEventListener('offline',offline);document.addEventListener('visibilitychange',focus);
  return()=>{alive=false;clearTimeout(timer);source?.close();window.removeEventListener('online',online);window.removeEventListener('offline',offline);document.removeEventListener('visibilitychange',focus);};
 },[user?.id,user?.companyInfo?.id]);return state;
}
