import { Hono } from 'hono';
import GET from './GET';

const app = new Hono();

app.route('/', GET);

export default app;
