export const log = (...a: unknown[]): void => console.log('·', ...a);

export const warn = (msg: string): void => {
  console.warn(`  ! ${msg}`);
  // Surface it on the Actions run page, not just in the raw log.
  if (process.env['GITHUB_ACTIONS']) console.log(`::warning::${msg}`);
};
