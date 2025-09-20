import { Hono } from 'hono';
import '../../../../types/hono.types';
import dashboardByIdRoutes from './GET';

const app = new Hono()
  //  /dashboards/:id GET
  .route('/', dashboardByIdRoutes);

export default app;
