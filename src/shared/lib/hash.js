import { createHash } from 'node:crypto';

export const hash = (input, length = 8) =>
  createHash('sha1').update(input).digest('hex').slice(0, length);
