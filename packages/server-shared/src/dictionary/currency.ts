import { z } from 'zod';

export const CurrencySchema = z.object({
  code: z.string(),
  description: z.string(),
  flag: z.string(),
});

export type Currency = z.infer<typeof CurrencySchema>;

export const CurrencyResponseSchema = z.array(CurrencySchema);

export type CurrencyResponse = z.infer<typeof CurrencyResponseSchema>;
