export function validDeadline(value){return value===''||value===null||value===undefined||typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function overdue(course,completed,now=Date.now()){return !completed&&!!course.dueDate&&now>Date.parse(course.dueDate+'T23:59:59.999-05:00');}
export function dueSoon(course,completed,now=Date.now()){if(completed||!course.dueDate)return false;const remaining=Date.parse(course.dueDate+'T23:59:59.999-05:00')-now;return remaining>=0&&remaining<=7*86400000;}
export function trainingStatus(course,completed,now=Date.now()){return completed?'Completado':overdue(course,false,now)?'Vencido':dueSoon(course,false,now)?'Por vencer':'Pendiente';}
export function prioritizeTraining(courses,progress,now=Date.now()){
 const pending=courses.filter(c=>!progress.some(p=>p.course_id===c.id&&p.completed));
 const rank=c=>overdue(c,false,now)?0:dueSoon(c,false,now)?1:progress.some(p=>p.course_id===c.id&&p.lessons?.length)?2:3;
 return [...pending].sort((a,b)=>rank(a)-rank(b)||(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
}
