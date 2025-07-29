import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { markdownToPlatejs } from '../../../utils/report/markdown-to-platejs';

const app = new Hono().post(
  '/validate-markdown',
  zValidator('json', z.object({ markdown: z.string() })),
  async (c) => {
    const { markdown } = c.req.valid('json');

    const parsedMarkdown = await markdownToPlatejs(markdown);

    return c.json({ parsedMarkdown });
  }
);

export default app;
