import {randomBytes} from 'node:crypto';
export function identity(db){
 db.exec('CREATE TABLE IF NOT EXISTS login_identifiers(user_id TEXT PRIMARY KEY REFERENCES users(id),identifier TEXT NOT NULL UNIQUE COLLATE NOCASE)');
 function ensure(userId,requested){if(requested!==undefined&&typeof requested!=='string')throw Object.assign(Error('ID inválido.'),{status:400});const old=db.prepare('SELECT identifier FROM login_identifiers WHERE user_id=?').get(userId);if(old)return old.identifier;const value=requested?.trim().toUpperCase()||'EMP-'+randomBytes(5).toString('hex').toUpperCase();if(!/^[A-Z0-9][A-Z0-9_-]{3,31}$/.test(value))throw Object.assign(Error('El ID debe tener entre 4 y 32 letras, números o guiones.'),{status:400});if(db.prepare('SELECT 1 FROM login_identifiers WHERE identifier=?').get(value))throw Object.assign(Error('Este ID ya está registrado.'),{status:409});db.prepare('INSERT INTO login_identifiers VALUES(?,?)').run(userId,value);return value;}
 function find(value){return db.prepare('SELECT u.* FROM users u LEFT JOIN login_identifiers i ON i.user_id=u.id WHERE i.identifier=? COLLATE NOCASE OR u.email=? COLLATE NOCASE').get(value,value);}
 return {ensure,find};
}

export function validateDni(value){if(typeof value!=="string"||!/^\d{8}$/.test(value.trim()))throw Object.assign(Error("Ingresa un DNI de 8 dígitos."),{status:400});return value.trim();}
