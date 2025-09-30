import { Hono } from 'hono';
import '../../../../types/hono.types';
import dashboardByIdRoutes from './GET';
import SHARING from './sharing';

const app = new Hono()
  //  /dashboards/:id GET
  .route('/', dashboardByIdRoutes)
  .route('/sharing', SHARING);

export default app;
