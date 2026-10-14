export function onboardingContext(user){return user.role+':'+Object.keys(user.permissions||{}).filter(key=>user.permissions[key]).sort().join(',');}
export function needsWelcome(user){const saved=user.profile?.onboarding;return !saved||saved.version!==3||saved.context!==onboardingContext(user);}
