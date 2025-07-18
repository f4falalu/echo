import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import colorThemesRoutes from './color-themes';

const app = new Hono();

export default app.use('*', requireAuth).route('/color-themes', colorThemesRoutes);
