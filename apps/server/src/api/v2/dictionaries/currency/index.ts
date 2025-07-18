import type { CurrencyResponse } from '@buster/server-shared/currency';
import { Hono } from 'hono';
import { CURRENCIES_MAP } from './config';

const app = new Hono();

app.get('/', async (c) => {
  const response: CurrencyResponse = CURRENCIES_MAP;
  return c.json(response);
});

export default app;
