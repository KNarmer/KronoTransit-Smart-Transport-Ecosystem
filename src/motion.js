// Motion tokens (Emil Kowalski's curves). Strong ease-out for entrances, ease-in-out for on-screen moves.
// Rule of thumb: one entrance for the hero, explanatory motion where it teaches something, nothing decorative on repeat.
export const ease = [0.23, 1, 0.32, 1];
export const easeInOut = [0.77, 0, 0.175, 1];

// Hero-only entrance: marketing latitude, 0.6s with ~110ms steps.
export const heroItem = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease } },
};
export const heroGroup = { hidden: {}, show: { transition: { staggerChildren: 0.11, delayChildren: 0.15 } } };
