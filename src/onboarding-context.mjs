export function onboardingContext(user){return 'tasks-v3:'+user.role+':'+Object.keys(user.permissions||{}).filter(key=>user.permissions[key]).sort().join(',');}
export function needsWelcome(user){const saved=user.profile?.onboarding;return !saved||saved.version!==3||saved.context!==onboardingContext(user);}
export function accessChanged(user){const previous=user.profile?.onboarding?.context;if(!previous)return false;const access=value=>value.replace(/^tasks-v\d+:/,'');return access(previous)!==access(onboardingContext(user));}
