const fs = require('fs');
const path = require('path');

const file = 'c:\\Users\\JimJos\\Documents\\Proyectos Personales\\app-web-mylist\\src\\pages\\Login.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace map
const regexMap = [
  [/text-pink-400/g, 'text-accent-primary'],
  [/text-purple-400/g, 'text-accent-secondary'],
  [/border-pink-500\/(\d+)/g, (m, alpha) => `border-[rgba(var(--color-accent-primary-rgb),0.${alpha.length === 1 ? '0'+alpha : alpha})]`],
  [/border-pink-500/g, 'border-accent-primary'],
  [/bg-pink-500\/(\d+)/g, (m, alpha) => `bg-[rgba(var(--color-accent-primary-rgb),0.${alpha.length === 1 ? '0'+alpha : alpha})]`],
  [/bg-pink-600\/(\d+)/g, (m, alpha) => `bg-[rgba(var(--color-accent-primary-rgb),0.${alpha.length === 1 ? '0'+alpha : alpha})]`],
  [/bg-purple-600\/(\d+)/g, (m, alpha) => `bg-[rgba(var(--color-accent-secondary-rgb),0.${alpha.length === 1 ? '0'+alpha : alpha})]`],
  [/bg-cyan-500\/(\d+)/g, (m, alpha) => `bg-[rgba(var(--color-accent-primary-rgb),0.${alpha.length === 1 ? '0'+alpha : alpha})]`],
  [/bg-pink-600/g, 'bg-accent-primary'],
  [/from-pink-500/g, 'from-accent-primary'],
  [/from-pink-400/g, 'from-accent-primary'],
  [/from-pink-600/g, 'from-accent-primary'],
  [/to-purple-600/g, 'to-accent-secondary'],
  [/to-purple-400/g, 'to-[var(--color-accent-secondary)]'],
  [/via-pink-500\/(\d+)/g, (m, alpha) => `via-[rgba(var(--color-accent-primary-rgb),0.${alpha.length === 1 ? '0'+alpha : alpha})]`],
  [/via-pink-500/g, 'via-accent-primary'],
  [/ring-pink-500\/(\d+)/g, (m, alpha) => `ring-[rgba(var(--color-accent-primary-rgb),0.${alpha.length === 1 ? '0'+alpha : alpha})]`],
  [/focus-visible:border-pink-500/g, 'focus-visible:border-accent-primary'],
  [/rgba\(\s*219\s*,\s*39\s*,\s*119\s*,([0-9.]+)\)/g, 'rgba(var(--color-accent-primary-rgb),$1)'],
  [/bg-zinc-900\/80/g, 'bg-[rgba(var(--color-bg-base-rgb),0.8)]'],
  [/border-zinc-700/g, 'border-[rgba(var(--color-border-subtle-rgb),1)]'],
  [/text-zinc-400/g, 'text-[var(--color-text-muted)]'],
  // Replace text-white with text-primary except in SVG icons where string might differ
  [/text-white/g, 'text-[var(--color-text-primary)]'],
  [/placeholder-zinc-500/g, 'placeholder-[var(--color-text-muted)]'],
  [/bg-black\/95/g, 'bg-[rgba(var(--color-bg-base-rgb),0.95)]'],
  [/bg-black\/90/g, 'bg-[rgba(var(--color-bg-base-rgb),0.9)]'],
  [/bg-black/g, 'bg-[var(--color-bg-base)]'],
];

regexMap.forEach(([regex, replacer]) => {
  content = content.replace(regex, replacer);
});

fs.writeFileSync(file, content);
console.log('Login.tsx has been refactored!');
