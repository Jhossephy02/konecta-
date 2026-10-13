import {useEffect,useRef,useState} from 'react';
import {Icon,Badge,Empty} from './ui';

export default function CoursePlayer({course,data,mutate,onFinish}){
 const progress=data.progress.find(p=>p.course_id===course.id),lessons=progress?.lessons||[];
 const[lesson,setLesson]=useState(Math.min(lessons.length,course.lessons.length-1));
 const[quiz,setQuiz]=useState(false),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const[focus,setFocus]=useState(false),[outline,setOutline]=useState(()=>!window.matchMedia('(max-width:1000px)').matches);
 const stage=useRef(null),first=useRef(true);
 const[textSize,setTextSize]=useState(18),[answers,setAnswers]=useState({});
 const answered=Object.keys(answers).length;
 const finished=lessons.length===course.lessons.length;
 const pct=Math.round(lessons.length/course.lessons.length*100);
 useEffect(()=>{if(first.current){first.current=false;return;}stage.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});},[lesson,quiz]);
 if(course.active===false||course.assigned===false)return <><a className="u-back" href="#historial">Volver a mi historial</a><Empty title={course.active===false?'Curso retirado':'Curso sin asignación vigente'}>Tu progreso, historial y constancias existentes se conservan.</Empty><a className="u-btn" href="#certificados">Ver mis constancias</a></>;
 async function complete(){setBusy(true);setError('');try{await mutate(`/courses/${course.id}/lesson`,'POST',{lesson});if(lesson<course.lessons.length-1)setLesson(lesson+1);else setQuiz(true);}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <div className={focus?'u-study u-study-focus':'u-study'} style={{'--study-text-size':textSize+'px'}}>
  <div className="u-study-tools"><a className="u-back" href="#aprendizaje"><Icon name="arrow-left"/> Volver a mi aprendizaje</a><button className="u-btn" aria-pressed={focus} onClick={()=>setFocus(!focus)}><Icon name={focus?'compress-alt':'book-reader'}/>{focus?'Salir del modo lectura':'Modo lectura'}</button></div>
  <div className="u-reading-controls" role="group" aria-label="Tamaño del texto"><span>Lectura cómoda</span><button type="button" className="u-btn" aria-label="Reducir tamaño del texto" disabled={textSize<=18} onClick={()=>setTextSize(s=>s-2)}>A−</button><output aria-live="polite">{textSize} px</output><button type="button" className="u-btn" aria-label="Aumentar tamaño del texto" disabled={textSize>=24} onClick={()=>setTextSize(s=>s+2)}>A+</button><small>Lección {lesson+1} de {course.lessons.length} · {pct}% completado</small></div>
  <div className="u-page-head"><div><span className="u-eyebrow">{course.category} · {course.duration} MINUTOS</span><h1>{course.title}</h1><p>{course.description}</p></div>{progress?.completed&&<Badge>Completado</Badge>}</div>
  <div className="u-player">
   <aside><div className="u-outline-heading"><h3>Contenido del curso</h3><button className="u-icon" aria-label={outline?'Ocultar lecciones':'Ver lecciones'} aria-expanded={outline} aria-controls="course-outline" onClick={()=>setOutline(!outline)}><Icon name={outline?'chevron-up':'chevron-down'}/></button></div>
    <div id="course-outline" className="u-outline-body" hidden={!outline}>
     <div className="u-progress" role="progressbar" aria-label="Avance de lecciones" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><span style={{width:pct+'%'}}/></div><small>{lessons.length} de {course.lessons.length} lecciones · {pct}%</small>
     {course.lessons.map((l,i)=><button key={i} disabled={busy||(i>0&&!lessons.includes(i-1))} aria-current={lesson===i&&!quiz?'step':undefined} className={lesson===i&&!quiz?'active':''} onClick={()=>{setLesson(i);setQuiz(false);setError('');}}><span>{lessons.includes(i)?<Icon name="check"/>:String(i+1).padStart(2,'0')}</span>{l.title}<Icon name={i>0&&!lessons.includes(i-1)?'lock':'chevron-right'}/></button>)}
     <button disabled={!finished||busy} onClick={()=>{setQuiz(true);setError('');}} className={quiz?'active':''}><span><Icon name="clipboard-check"/></span>Evaluación final<Icon name={finished?'chevron-right':'lock'}/></button>
    </div>
   </aside>
   <section className="u-lesson" ref={stage} key={quiz?'quiz':'lesson-'+lesson} aria-label={quiz?'Evaluación final':'Lección '+(lesson+1)} aria-busy={busy}>
    {error&&<p className="u-error" role="alert">{error}</p>}
    {quiz?<>
     <span className="u-eyebrow">COMPRUEBA LO APRENDIDO</span><h2>Evaluación final</h2><p>Responde todas las preguntas. Necesitas al menos 70% para aprobar.</p>
     {result&&<div role="status" className={`u-result ${result.passed?'passed':''}`}><strong>{result.score}% · {result.passed?'¡Lo lograste!':'Sigue practicando'}</strong><p>{result.passed?'Tu constancia ya está disponible.':'Revisa las lecciones e inténtalo nuevamente.'}</p>{result.passed&&<><a className="u-btn" href="#certificados">Ver mis constancias <Icon name="award"/></a>{onFinish&&<button className="u-btn primary" onClick={onFinish}><Icon name="sign-out-alt"/> Terminar y cambiar trabajador</button>}</>}</div>}
     <form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const values=new FormData(e.target);const answers=course.questions.map((_,i)=>Number(values.get('q'+i)));setResult(await mutate(`/courses/${course.id}/quiz`,'POST',{answers}));}catch(e){setError(e.message);}finally{setBusy(false);}}}>
      <div className="u-quiz-progress" role="status">{answered} de {course.questions.length} preguntas respondidas. Puedes revisar tus respuestas antes de enviar.</div>
      {course.questions.map((q,i)=><fieldset key={i} disabled={busy}><legend>{i+1}. {q.text}</legend>{q.options.map((option,j)=><label className={'u-radio'+(answers[i]===j?' selected':'')} key={j}><input type="radio" name={'q'+i} value={j} checked={answers[i]===j} onChange={()=>setAnswers(a=>({...a,[i]:j}))} required/>{option}</label>)}</fieldset>)}
      <footer><span>El resultado se registra al enviar.</span><button className="u-btn primary" disabled={busy||answered!==course.questions.length}>{busy?'Evaluando…':'Enviar evaluación'} <Icon name="arrow-right"/></button></footer>
     </form>
    </>:<>
     <div className={`u-lesson-art ${course.color}`}><Icon name={course.icon}/><span>LECCIÓN {String(lesson+1).padStart(2,'0')} / {String(course.lessons.length).padStart(2,'0')}</span></div>
     <span className="u-eyebrow">APRENDE A TU RITMO</span><h2>{course.lessons[lesson].title}</h2>
     <div className="u-lesson-copy">{course.lessons[lesson].content.split(/\n\n|\. /).map((p,i)=><p key={i}>{p}{/[.!?]$/.test(p)?'':'.'}</p>)}</div>
     <div className="u-lesson-note"><Icon name="lightbulb"/><p>Tómate un momento para revisar lo aprendido antes de continuar.</p></div>
     <footer><span>{lessons.includes(lesson)?'✓ Lección completada':'Tu avance se guarda al completar'}</span><button className="u-btn primary" disabled={busy} onClick={complete}>{busy?'Guardando avance…':lesson===course.lessons.length-1?'Ir a la evaluación':'Completar y continuar'} <Icon name="arrow-right"/></button></footer>
    </>}
   </section>
  </div>
 </div>;
}
