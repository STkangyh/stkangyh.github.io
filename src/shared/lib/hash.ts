import { createHash } from 'node:crypto';

export const hash = (input: string, length = 8): string =>
  createHash('sha1').update(input).digest('hex').slice(0, length);
