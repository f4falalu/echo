import { Hono } from 'hono';
import GET from './GET';
import SHARING from './sharing';

const app = new Hono();

app.route('/', GET);
app.route('/sharing', SHARING);

export default app;
