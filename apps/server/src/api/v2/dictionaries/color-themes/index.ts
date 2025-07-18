import type { ColorThemeDictionariesResponse } from '@buster/server-shared/dictionary';
import { Hono } from 'hono';
import { ALL_THEMES } from './config';

const app = new Hono();

app.get('/', async (c) => {
  const response: ColorThemeDictionariesResponse = ALL_THEMES;
  return c.json(response);
});

export default app;
