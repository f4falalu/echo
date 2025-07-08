import { z } from 'zod/v4';

export const CurrencySchema = z.object({
  code: z.string(),
  description: z.string(),
  flag: z.string(),
});

export type Currency = z.infer<typeof CurrencySchema>;
