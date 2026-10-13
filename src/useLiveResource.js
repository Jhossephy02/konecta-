import {useEffect,useRef} from 'react';
export default function useLiveResource(load,deps=[]){const callback=useRef(load);callback.current=load;useEffect(()=>{callback.current();const update=()=>callback.current();window.addEventListener('portal:updated',update);return()=>window.removeEventListener('portal:updated',update);},deps);}
