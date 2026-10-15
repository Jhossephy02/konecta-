export function isSampleAccount(user){
 const profile=typeof user.profile==='string'?JSON.parse(user.profile):user.profile||{};
 return !!(profile.showcase||profile.temporaryAccess||/@(?:demo\.local|pruebas\.invalid)$/i.test(user.email||''));
}
