import test from 'node:test';
import assert from 'node:assert/strict';
import {isSampleAccount} from '../server/account-classification.mjs';
test('diagnóstico distingue muestras de cuentas reales sin correo corporativo',()=>{
 assert.equal(isSampleAccount({email:'account-123@accounts.invalid',profile:'{}'}),false);
 assert.equal(isSampleAccount({email:'persona@empresa.pe',profile:'{}'}),false);
 for(const user of [{email:'admin@demo.local',profile:'{}'},{email:'test@pruebas.invalid',profile:'{}'},{email:'persona@example.invalid',profile:'{"showcase":true}'},{profile:{temporaryAccess:true}}])assert.equal(isSampleAccount(user),true);
});
