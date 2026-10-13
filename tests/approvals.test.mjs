import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canRead,canResolve} from '../server/access.mjs';
test('justificaciones: responsables aprueban su equipo, sin autoaprobación ni acceso clínico',()=>{
 const user=(id,role,supervisorId='',companyId='a')=>({id,role,profile:JSON.stringify({companyId,supervisorId})});
 const staff=[user('e','employee','s'),user('s','supervisor','d'),user('d','deputy','m'),user('m','manager'),user('a','admin'),user('h','hr'),user('p','payroll'),user('t','trainer'),user('sst','sst'),user('external','employee'),user('other','admin','','b')];
 const record={user_id:'e',module:'justificaciones',data:'{}'};
 for(const person of staff)assert.equal(canResolve(person,record,staff),['s','d','m','a','h'].includes(person.id),person.id);
 for(const id of ['s','d','m']){const leader=staff.find(u=>u.id===id);assert.equal(canResolve(leader,{...record,user_id:'external'},staff),false);assert.equal(canResolve(leader,{...record,user_id:id},staff),false);assert.equal(canRead(leader,{...record,module:'descansos'},staff),false);}
});
