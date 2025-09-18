import { Hono } from 'hono';
import { standardErrorHandler } from '../../../../utils/response';
import GET from './GET';
import DATA from './data/GET';
import DOWNLOAD from './download/GET';

const app = new Hono()
  .route('/', GET)
  .route('/data', DATA)
  .route('/download', DOWNLOAD)
  .onError(standardErrorHandler);

export default app;
