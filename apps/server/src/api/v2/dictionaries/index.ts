import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import colorPalettesRoutes from './color-palettes';
import currencyRoutes from './currency';

const app = new Hono();

export default app
  .use('*', requireAuth)
  .route('/color-palettes', colorPalettesRoutes)
  .route('/currency', currencyRoutes);
