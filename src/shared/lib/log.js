export const log = (...a) => console.log('·', ...a);

export const warn = msg => {
  console.warn(`  ! ${msg}`);
  // Surface it on the Actions run page, not just in the raw log.
  if (process.env.GITHUB_ACTIONS) console.log(`::warning::${msg}`);
};
