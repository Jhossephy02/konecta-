import { useEffect, useState } from 'react';
import ReferenceApp from './ReferenceApp';
import UnifiedApp from './UnifiedApp';
export default function App() {
  const [hash,setHash]=useState(location.hash);
  useEffect(()=>{const update=()=>setHash(location.hash);window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
  return ['#gissat','#gissat-login','#weconnect'].includes(hash)?<><a className="reference-return" href="#inicio">← Volver al portal unificado</a><ReferenceApp/></>:<UnifiedApp/>;
}
