export function validDeadline(value){return value===''||value===null||value===undefined||typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function overdue(course,completed,now=Date.now()){return !completed&&!!course.dueDate&&now>Date.parse(course.dueDate+'T23:59:59.999-05:00');}
