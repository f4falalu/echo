import { z } from 'zod';
import { CurrencySchema } from './currency.types';

export const CurrencyResponseSchema = z.array(CurrencySchema);

export type CurrencyResponse = z.infer<typeof CurrencyResponseSchema>;
